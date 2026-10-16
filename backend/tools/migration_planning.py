"""Deterministic migration planning: component normalisation, dependency ordering, effort and checks.

Gemini may propose components and write explanations, but ordering, effort and timeline
arithmetic are computed here with Decimal so the same inventory always yields the same plan.
"""

import json
import re
from decimal import ROUND_CEILING, Decimal

from pydantic import ValidationError

from models.schemas import ComponentType, MigrationComponent

# Default migration order: target environment first, data stores next, code after the data it uses.
TYPE_ORDER = [ComponentType.INFRASTRUCTURE, ComponentType.DATABASE, ComponentType.DATA, ComponentType.QUERY,
              ComponentType.APPLICATION, ComponentType.INTEGRATION, ComponentType.BATCH]
TYPE_RANK = {t.value: i for i, t in enumerate(TYPE_ORDER)}
PHASE_TITLES = {
    "infrastructure": "Target infrastructure & landing zone",
    "database": "Database schema migration",
    "data": "Data migration & reconciliation",
    "query": "Queries, stored procedures & views",
    "application": "Application code migration",
    "integration": "Integrations & interfaces",
    "batch": "Batch jobs & schedulers",
}

# Person-weeks for one component before complexity, type and risk adjustments.
BASE_WEEKS = {"S": Decimal("1"), "M": Decimal("3"), "L": Decimal("6"), "XL": Decimal("12")}
COMPLEXITY_FACTOR = {"low": Decimal("1.0"), "medium": Decimal("1.5"), "high": Decimal("2.25")}
TYPE_FACTOR = {"infrastructure": Decimal("0.8"), "database": Decimal("1.2"), "data": Decimal("1.0"),
               "query": Decimal("0.8"), "application": Decimal("1.0"), "integration": Decimal("1.1"),
               "batch": Decimal("0.9")}
MOBILISATION_WEEKS = Decimal("2")
CUTOVER_SHARE = Decimal("0.15")
MAX_PEOPLE_PER_COMPONENT = 2

CODEBASE_FILE_NAME = "MIGRATION_CONTEXT.md"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:80]
    return slug or "component"


def _half_weeks(value: Decimal) -> Decimal:
    """Round up to the next half week."""
    return (value * 2).to_integral_value(rounding=ROUND_CEILING) / 2


# ---- Component inventory ----

def normalize_components(raw: list, require_refs: bool = True) -> tuple[list[dict], list[str]]:
    """Validate proposed components, merge duplicates and drop entries without document evidence.

    Args:
        raw: Component dicts proposed by Gemini or parsed from a codebase summary.
        require_refs: Drop components with no source reference (unsupported by the document).
    """
    merged: dict[str, MigrationComponent] = {}
    warnings: list[str] = []
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict):
            continue
        item = {**item, "id": slugify(str(item.get("id") or item.get("name") or ""))}
        item["depends_on"] = [slugify(str(d)) for d in item.get("depends_on") or []]
        for key in ("type", "complexity"):
            if isinstance(item.get(key), str):
                item[key] = item[key].lower()
        if isinstance(item.get("size"), str):
            item["size"] = item["size"].upper()
        try:
            comp = MigrationComponent(**item)
        except ValidationError:
            warnings.append(f"Skipped invalid component '{item.get('name') or item['id']}'")
            continue
        if require_refs and not comp.source_refs:
            warnings.append(f"Skipped '{comp.name}': no supporting reference in the document")
            continue
        if comp.id in merged:
            prev = merged[comp.id]
            prev.depends_on = sorted(set(prev.depends_on) | set(comp.depends_on))
            prev.source_refs = sorted(set(prev.source_refs) | set(comp.source_refs))[:20]
            continue
        merged[comp.id] = comp
    return [c.model_dump(mode="json") for c in merged.values()], warnings


def parse_codebase_summary(text: str) -> list | None:
    """Return the components list from the ```json inventory block of a MIGRATION_CONTEXT.md, if present.

    Args:
        text: Full text of the uploaded codebase summary.
    """
    for block in re.findall(r"```json\s*(.*?)```", text, flags=re.DOTALL):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and isinstance(data.get("components"), list):
            return data["components"]
    return None


# Keyword catalogue for offline extraction: pattern -> (id, display name, type, default complexity).
KEYWORD_CATALOGUE = [
    (r"\bdb2\b", "db2", "IBM Db2 database", "database", "high"),
    (r"\boracle\b", "oracle-db", "Oracle database", "database", "high"),
    (r"\bsql server\b|\bmssql\b", "sql-server", "SQL Server database", "database", "medium"),
    (r"\bpostgres(ql)?\b", "postgresql", "PostgreSQL database", "database", "medium"),
    (r"\bmysql\b", "mysql", "MySQL database", "database", "medium"),
    (r"\bmongodb\b", "mongodb", "MongoDB database", "database", "medium"),
    (r"\bvsam\b", "vsam", "VSAM datasets", "database", "high"),
    (r"\bims\b", "ims-db", "IMS database", "database", "high"),
    (r"\bdata (migration|load|conversion)\b|\betl\b", "historical-data", "Historical data migration", "data", "medium"),
    (r"\bstored procedures?\b|\bpl/?sql\b|\bt-?sql\b", "stored-procedures", "Stored procedures & SQL", "query", "medium"),
    (r"\bviews?\b.{0,20}\bquer", "reporting-queries", "Reporting queries & views", "query", "low"),
    (r"\bcobol\b", "cobol-programs", "COBOL programs", "application", "high"),
    (r"\bpl/i\b", "pli-programs", "PL/I programs", "application", "high"),
    (r"\bjava\b|\bspring\b", "java-services", "Java services", "application", "medium"),
    (r"\b\.net\b|\bc#", "dotnet-apps", ".NET applications", "application", "medium"),
    (r"\bpython\b", "python-services", "Python services", "application", "low"),
    (r"\bcics\b", "cics-transactions", "CICS transactions", "application", "high"),
    (r"\bmq\b|\bmessage queue", "message-queues", "Message queues", "integration", "medium"),
    (r"\bkafka\b", "kafka", "Kafka streams", "integration", "medium"),
    (r"\bsftp\b|\bfile transfer\b", "file-transfers", "File transfer interfaces", "integration", "low"),
    (r"\bsoap\b|\brest api\b|\bapis?\b", "apis", "APIs & web services", "integration", "medium"),
    (r"\bjcl\b|\bbatch\b|\bcontrol-m\b|\bscheduler\b", "batch-jobs", "Batch jobs & scheduling", "batch", "medium"),
    (r"\bkubernetes\b|\bnetwork\b|\bfirewall\b|\bvpc\b", "landing-zone", "Target environment & networking", "infrastructure", "low"),
]


def _size_from_mentions(count: int) -> str:
    return "S" if count <= 2 else "M" if count <= 6 else "L" if count <= 15 else "XL"


def keyword_components(chunks: list[dict]) -> list[dict]:
    """Offline extractor: detect technologies by keyword and link them with default dependency rules.

    Args:
        chunks: Document chunks with text and page_start.
    """
    found: dict[str, dict] = {}
    for pattern, cid, name, ctype, complexity in KEYWORD_CATALOGUE:
        regex = re.compile(pattern, re.IGNORECASE)
        pages = []
        count = 0
        for chunk in chunks:
            hits = len(regex.findall(chunk["text"]))
            if hits:
                count += hits
                pages.append(chunk["page_start"])
        if count:
            refs = [f"p.{p}" for p in sorted(set(pages))[:5]]
            found[cid] = {"id": cid, "name": name, "type": ctype, "size": _size_from_mentions(count),
                          "complexity": complexity, "depends_on": [], "source_refs": refs,
                          "notes": f"Detected from {count} mention(s)"}

    by_type: dict[str, list[str]] = {}
    for comp in found.values():
        by_type.setdefault(comp["type"], []).append(comp["id"])
    rules = {"data": ["database"], "query": ["database"], "application": ["database", "query"],
             "integration": ["application"], "batch": ["database", "application"]}
    for comp in found.values():
        comp["depends_on"] = [d for t in rules.get(comp["type"], []) for d in by_type.get(t, [])]
    return list(found.values())


# ---- Ordering, effort and timeline ----

def order_components(components: list[dict]) -> dict:
    """Topologically order components and assign each to a phase (type order, pushed later by dependencies).

    Args:
        components: Normalised component dicts.
    """
    ids = {c["id"] for c in components}
    by_id = {c["id"]: c for c in components}
    warnings = []
    deps: dict[str, list[str]] = {}
    for c in components:
        unknown = [d for d in c["depends_on"] if d not in ids or d == c["id"]]
        if unknown:
            warnings.append(f"'{c['id']}' references unknown dependencies: {', '.join(unknown)}")
        deps[c["id"]] = [d for d in c["depends_on"] if d in ids and d != c["id"]]

    remaining = {cid: set(d) for cid, d in deps.items()}
    ordered: list[str] = []
    while remaining:
        ready = sorted((cid for cid, d in remaining.items() if not d), key=lambda cid: (TYPE_RANK[by_id[cid]["type"]], cid))
        if not ready:
            return {"error": "Dependency cycle detected", "cycle": sorted(remaining), "warnings": warnings}
        cid = ready[0]
        ordered.append(cid)
        del remaining[cid]
        for d in remaining.values():
            d.discard(cid)

    rank: dict[str, int] = {}
    for cid in ordered:
        own = TYPE_RANK[by_id[cid]["type"]]
        rank[cid] = max([own] + [rank[d] for d in deps[cid]])
        if rank[cid] > own:
            warnings.append(f"'{cid}' moved to the {TYPE_ORDER[rank[cid]].value} phase because of its dependencies")
    return {"order": ordered, "rank": rank, "dependencies": deps, "warnings": warnings}


def component_weeks(component: dict) -> Decimal:
    return BASE_WEEKS[component["size"]] * COMPLEXITY_FACTOR[component["complexity"]] * TYPE_FACTOR[component["type"]]


def build_plan(components: list[dict], team_size: int, risk_buffer_pct: int) -> dict:
    """Group ordered components into sequential phases and compute effort and calendar weeks.

    Args:
        components: Normalised component dicts.
        team_size: Engineers available to the migration.
        risk_buffer_pct: Contingency added to every build phase.
    """
    ordering = order_components(components)
    if "error" in ordering:
        return ordering
    by_id = {c["id"]: c for c in components}
    buffer = 1 + Decimal(risk_buffer_pct) / 100
    team = Decimal(team_size)
    per_component = Decimal(min(team_size, MAX_PEOPLE_PER_COMPONENT))

    phases = [{"key": "mobilisation", "title": "Mobilisation & assessment", "components": [],
               "effort_person_weeks": MOBILISATION_WEEKS * team, "duration_weeks": MOBILISATION_WEEKS}]
    for rank in sorted(set(ordering["rank"].values())):
        members = [cid for cid in ordering["order"] if ordering["rank"][cid] == rank]
        weeks = [component_weeks(by_id[cid]) for cid in members]
        effort = sum(weeks, Decimal(0)) * buffer
        duration = _half_weeks(max(effort / team, max(weeks) * buffer / per_component))
        key = TYPE_ORDER[rank].value
        phases.append({"key": key, "title": PHASE_TITLES[key], "components": members,
                       "effort_person_weeks": effort, "duration_weeks": duration})

    build_weeks = sum((p["duration_weeks"] for p in phases[1:]), Decimal(0))
    cutover = max(Decimal(1), _half_weeks(build_weeks * CUTOVER_SHARE))
    phases.append({"key": "cutover", "title": "Parallel run, validation & cutover", "components": [],
                   "effort_person_weeks": cutover * team, "duration_weeks": cutover})

    start = Decimal(0)
    for i, p in enumerate(phases, start=1):
        p["sequence"] = i
        p["start_week"], p["end_week"] = start, start + p["duration_weeks"]
        start = p["end_week"]

    total_effort = sum((p["effort_person_weeks"] for p in phases), Decimal(0))
    return {
        "phases": [_floats(p) for p in phases],
        "component_order": ordering["order"],
        "dependencies": ordering["dependencies"],
        "total_weeks": float(start),
        "total_effort_person_weeks": float(total_effort.quantize(Decimal("0.1"))),
        "team_size": team_size,
        "risk_buffer_pct": risk_buffer_pct,
        "warnings": ordering["warnings"],
    }


def _floats(phase: dict) -> dict:
    out = dict(phase)
    for key in ("effort_person_weeks", "duration_weeks", "start_week", "end_week"):
        out[key] = float(Decimal(out[key]).quantize(Decimal("0.1")))
    return out


def verify_plan(components: list[dict], plan: dict) -> list[dict]:
    """Deterministic pass/fail checks a plan must satisfy before the task can succeed.

    Args:
        components: Normalised component dicts.
        plan: Output of build_plan.
    """
    if "error" in plan:
        return [{"name": "dependency_graph_acyclic", "passed": False, "detail": f"Cycle among: {', '.join(plan['cycle'])}"}]
    phase_of = {cid: p["sequence"] for p in plan["phases"] for cid in p["components"]}
    position = {cid: i for i, cid in enumerate(plan["component_order"])}
    assigned = [c["id"] for c in components if c["id"] in phase_of]
    violations = [f"{cid} before {d}" for cid, ds in plan["dependencies"].items() for d in ds
                  if phase_of[d] > phase_of[cid] or position[d] > position[cid]]
    contiguous = all(abs(a["end_week"] - b["start_week"]) < 1e-9 for a, b in zip(plan["phases"], plan["phases"][1:]))
    duration_sum = round(sum(p["duration_weeks"] for p in plan["phases"]), 1)
    uncited = [c["id"] for c in components if not c["source_refs"]]
    return [
        {"name": "has_components", "passed": bool(components), "detail": f"{len(components)} component(s) identified"},
        {"name": "all_components_assigned", "passed": len(assigned) == len(components),
         "detail": f"{len(assigned)}/{len(components)} assigned to a phase"},
        {"name": "dependencies_respected", "passed": not violations,
         "detail": "No dependency is scheduled after its dependant" if not violations else "; ".join(violations[:5])},
        {"name": "timeline_consistent", "passed": contiguous and abs(duration_sum - plan["total_weeks"]) < 0.11,
         "detail": f"Phase durations sum to {duration_sum} of {plan['total_weeks']} weeks"},
        {"name": "components_cited", "passed": not uncited,
         "detail": "Every component cites the source document" if not uncited else f"Uncited: {', '.join(uncited[:5])}"},
    ]


CODEBASE_PROMPT = f"""You are documenting this codebase so a migration planner can build a phased migration plan.
Analyse the whole repository (source, build files, configuration, SQL, infrastructure, CI) and create a single
Markdown file named `{CODEBASE_FILE_NAME}` in the repository root with exactly these sections:

## 1. Overview
Purpose of the system, main business capabilities, approximate size (files, lines of code per language).
## 2. Languages, frameworks and runtimes
With versions where they can be found (package manifests, build files).
## 3. Modules and functionality
Each module/service/package: responsibility, entry points, key files, approximate size.
## 4. Databases and schemas
Every database engine, schema, important tables, ORM/migration tooling, approximate data volume if known.
## 5. Queries, stored procedures and views
Where SQL lives, notable stored procedures, views, raw queries, reporting queries.
## 6. Dependencies
Internal module-to-module dependencies, and third-party libraries that matter for migration (deprecated, licensed, platform-specific).
## 7. Integrations and interfaces
External APIs, message queues, file transfers, scheduled/batch jobs, authentication providers.
## 8. Build, deployment and infrastructure
Build tooling, containers, IaC, environments, CI/CD, configuration and secrets handling (names only, never values).
## 9. Tests
Test frameworks, coverage areas, gaps.
## 10. Known risks and technical debt
Anything that will make migration harder.

## Machine-readable inventory
End the file with ONE fenced ```json block of this shape (no comments inside the JSON):
{{"components": [{{"id": "kebab-case-id", "name": "Readable name", "type": "infrastructure|database|data|query|application|integration|batch",
"size": "S|M|L|XL", "complexity": "low|medium|high", "depends_on": ["other-component-id"],
"source_refs": ["path/to/relevant/file_or_folder"], "notes": "one sentence"}}]}}

Rules:
- One component per database, data set, SQL area, deployable application/service, integration and batch area.
- depends_on lists components that must be migrated BEFORE this one (e.g. an application depends on its database).
- size: S < 2k LOC or < 10 objects, M < 20k LOC, L < 100k LOC, XL larger.
- Only describe what exists in the repository. Never include secrets, credentials, connection strings or personal data.
"""
