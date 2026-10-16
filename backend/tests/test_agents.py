"""Offline agent checks: build every agent, validate tool schemas, and run the real ADK loop
against a scripted fake model. No network calls and no Gemini credits are used."""

import asyncio
import inspect
import warnings

import pytest
from google.adk.models.base_llm import BaseLlm
from google.adk.models.llm_response import LlmResponse
from google.adk.tools.function_tool import FunctionTool
from google.genai import types

from agents import runner
from agents.orchestrator import AGENT_REGISTRY, create_orchestrator
from config import get_settings

warnings.filterwarnings("ignore", message=r"\[EXPERIMENTAL\]")


class ScriptedLlm(BaseLlm):
    """Root agent transfers to `target`; the target calls `tool` once, then answers with the tool result."""

    model: str = "scripted"
    target: str = "database_agent"
    tool: str = "get_database_metrics"
    args: dict = {"database_id": "DB2_MAIN"}
    loop_forever: bool = False
    calls: list = []

    async def generate_content_async(self, llm_request, stream=False):
        tools = set(llm_request.tools_dict)
        last = llm_request.contents[-1].parts[0]
        response = last.function_response
        if response is not None and response.name != "transfer_to_agent" and not self.loop_forever:
            part = types.Part(text=f"{response.name}: {response.response}")
        elif self.tool in tools:
            part = types.Part.from_function_call(name=self.tool, args=self.args)
        else:
            part = types.Part.from_function_call(name="transfer_to_agent", args={"agent_name": self.target})
        self.calls.append(part.function_call.name if part.function_call else "text")
        yield LlmResponse(content=types.Content(role="model", parts=[part]))


def with_model(agent, model):
    agent.model = model
    for sub in agent.sub_agents:
        with_model(sub, model)
    return agent


def all_agents():
    root = create_orchestrator()
    return root, list(root.sub_agents)


def test_every_registered_agent_is_wired_into_the_orchestrator():
    _, subs = all_agents()
    assert {a.name for a in subs} == set(AGENT_REGISTRY)


def test_every_tool_has_a_valid_schema_and_docstring():
    _, subs = all_agents()
    for agent in subs:
        for tool in agent.tools:
            ft = tool if isinstance(tool, FunctionTool) else FunctionTool(tool)
            decl = ft._get_declaration()
            assert decl.name, f"{agent.name}: tool without a name"
            assert (inspect.getdoc(ft.func) or "").strip(), f"{agent.name}.{decl.name} needs a docstring (it is the tool description Gemini sees)"


def test_orchestrator_delegates_and_agent_calls_real_tool():
    llm = ScriptedLlm(calls=[])
    answer = asyncio.run(runner.run_agent(with_model(create_orchestrator(), llm), "How full is Db2?"))
    assert llm.calls == ["transfer_to_agent", "get_database_metrics", "text"]
    # The answer is built from the mock tool output, i.e. the shared store.
    assert "utilization_pct" in answer and "DB2_MAIN" in answer


@pytest.mark.parametrize("target,tool,args", [
    ("operations_agent", "telemetry_summary", {}),
    ("incident_agent", "list_incidents", {}),
    ("reconciliation_agent", "list_exceptions", {"status": "OPEN"}),
    ("compliance_agent", "list_compliance_controls", {}),
    ("risk_agent", "get_queue_metrics", {"queue_id": "ARCHIVAL_QUEUE"}),
])
def test_each_domain_agent_runs_its_tools(target, tool, args):
    llm = ScriptedLlm(target=target, tool=tool, args=args, calls=[])
    answer = asyncio.run(runner.run_agent(with_model(create_orchestrator(), llm), "question"))
    assert llm.calls == ["transfer_to_agent", tool, "text"]
    assert answer.startswith(f"{tool}:") and "error" not in answer.split(":", 1)[1][:40].lower()


def test_llm_call_cap_stops_a_looping_agent(monkeypatch):
    monkeypatch.setattr(get_settings(), "agent_max_llm_calls", 4)
    monkeypatch.setattr(get_settings(), "agents_enabled", True)
    monkeypatch.setenv("GOOGLE_API_KEY", "test-not-used")
    llm = ScriptedLlm(loop_forever=True, calls=[])
    answer, source = asyncio.run(runner.ask(lambda: with_model(create_orchestrator(), llm), "loop"))
    assert source == "limit"
    assert len(llm.calls) <= 4


def test_missing_credentials_fail_before_any_model_call(monkeypatch):
    monkeypatch.setattr(get_settings(), "agents_enabled", True)
    for var in ("GOOGLE_API_KEY", "GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_CLOUD_PROJECT"):
        monkeypatch.delenv(var, raising=False)
    llm = ScriptedLlm(calls=[])
    answer, source = asyncio.run(runner.ask(lambda: with_model(create_orchestrator(), llm), "hi"))
    assert source == "config_error" and "GOOGLE_API_KEY" in answer
    assert llm.calls == []


def test_agents_disabled_returns_demo_answer():
    answer, source = asyncio.run(runner.ask(create_orchestrator, "hi"))
    assert source == "demo"
