"""Renders a stored migration plan as Markdown (primary) or PDF (same content)."""

from fpdf import FPDF


def _phase_rows(plan_doc: dict) -> list[list[str]]:
    return [[str(p["sequence"]), p["title"], f"{p['start_week']:g}-{p['end_week']:g}", f"{p['duration_weeks']:g}",
             f"{p['effort_person_weeks']:g}", ", ".join(p["components"]) or "-"] for p in plan_doc["plan"]["phases"]]


PHASE_HEADER = ["#", "Phase", "Weeks", "Duration (wk)", "Effort (person-wk)", "Components"]


def render_markdown(plan_doc: dict) -> str:
    plan, narrative = plan_doc["plan"], plan_doc.get("narrative", {})
    notes = narrative.get("phase_notes", {})
    lines = [
        f"# Migration Plan: {plan_doc['file_name']}",
        "",
        f"- **Plan ID:** {plan_doc['plan_id']}  ",
        f"- **Target platform:** {plan_doc['target_platform']}  ",
        f"- **Source:** {plan_doc['source_type'].replace('_', ' ')} ({plan_doc['page_count']} page(s))  ",
        f"- **Estimated duration:** {plan['total_weeks']:g} weeks with a team of {plan['team_size']} "
        f"({plan['total_effort_person_weeks']:g} person-weeks, {plan['risk_buffer_pct']}% risk buffer included)  ",
        f"- **Status:** {plan_doc['status']}  ",
        f"- **Generated:** {plan_doc['created_at']}",
        "",
        "> Estimates are computed deterministically from the component inventory. "
        "Review sizes and dependencies with the delivery team before committing to dates.",
        "",
        "## Executive summary",
        "",
        narrative.get("summary", ""),
        "",
        "## Phases and timeline",
        "",
        "| " + " | ".join(PHASE_HEADER) + " |",
        "|" + "---|" * len(PHASE_HEADER),
    ]
    lines += ["| " + " | ".join(row) + " |" for row in _phase_rows(plan_doc)]
    lines += ["", "## Phase details", ""]
    for p in plan["phases"]:
        note = notes.get(p["key"], {})
        lines += [f"### {p['sequence']}. {p['title']} (weeks {p['start_week']:g}-{p['end_week']:g})", ""]
        if note.get("rationale"):
            lines += [note["rationale"], ""]
        if p["components"]:
            lines += [f"**Components (in order):** {', '.join(p['components'])}", ""]
        if note.get("risks"):
            lines += ["**Risks and mitigations:**", ""] + [f"- {r}" for r in note["risks"]] + [""]

    lines += ["## Component inventory", "", "| ID | Name | Type | Size | Complexity | Depends on | Source |", "|---|---|---|---|---|---|---|"]
    for c in plan_doc["components"]:
        lines.append(f"| {c['id']} | {c['name']} | {c['type']} | {c['size']} | {c['complexity']} | "
                     f"{', '.join(c['depends_on']) or '-'} | {', '.join(c['source_refs'])} |")

    lines += ["", "## Verification checks", ""]
    lines += [f"- [{'x' if c['passed'] else ' '}] **{c['name']}**: {c['detail']}" for c in plan_doc["checks"]]
    if narrative.get("assumptions"):
        lines += ["", "## Assumptions", ""] + [f"- {a}" for a in narrative["assumptions"]]
    if plan_doc.get("warnings"):
        lines += ["", "## Warnings", ""] + [f"- {w}" for w in plan_doc["warnings"]]
    return "\n".join(lines) + "\n"


def _latin1(text: str) -> str:
    # Core PDF fonts only cover Latin-1.
    return str(text).encode("latin-1", "replace").decode("latin-1")


def render_pdf(plan_doc: dict) -> bytes:
    plan, narrative = plan_doc["plan"], plan_doc.get("narrative", {})
    notes = narrative.get("phase_notes", {})
    pdf = FPDF(orientation="L")
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    def heading(text: str, size: int = 13) -> None:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", size)
        pdf.multi_cell(0, 7, _latin1(text), new_x="LMARGIN", new_y="NEXT")

    def para(text: str, style: str = "") -> None:
        pdf.set_font("Helvetica", style, 9)
        pdf.multi_cell(0, 5, _latin1(text), new_x="LMARGIN", new_y="NEXT")

    def table(header: list[str], rows: list[list[str]], widths: tuple) -> None:
        pdf.set_font("Helvetica", "", 8)
        with pdf.table(col_widths=widths, text_align="LEFT", line_height=5) as t:
            for row in [header] + rows:
                r = t.row()
                for cell in row:
                    r.cell(_latin1(cell))

    heading(f"Migration Plan: {plan_doc['file_name']}", 16)
    para(f"Plan {plan_doc['plan_id']} | Target: {plan_doc['target_platform']} | Status: {plan_doc['status']} | "
         f"Generated {plan_doc['created_at']}")
    para(f"Estimated duration: {plan['total_weeks']:g} weeks, team of {plan['team_size']}, "
         f"{plan['total_effort_person_weeks']:g} person-weeks ({plan['risk_buffer_pct']}% risk buffer).", "B")
    heading("Executive summary")
    para(narrative.get("summary", ""))
    heading("Phases and timeline")
    table(PHASE_HEADER, _phase_rows(plan_doc), (8, 60, 20, 22, 28, 132))
    heading("Phase details")
    for p in plan["phases"]:
        note = notes.get(p["key"], {})
        para(f"{p['sequence']}. {p['title']} (weeks {p['start_week']:g}-{p['end_week']:g})", "B")
        if note.get("rationale"):
            para(note["rationale"])
        for risk in note.get("risks", []):
            para(f"  - {risk}")
    heading("Component inventory")
    table(["ID", "Name", "Type", "Size", "Complexity", "Depends on", "Source"],
          [[c["id"], c["name"], c["type"], c["size"], c["complexity"], ", ".join(c["depends_on"]) or "-",
            ", ".join(c["source_refs"])] for c in plan_doc["components"]], (40, 55, 25, 12, 20, 60, 58))
    heading("Verification checks")
    for c in plan_doc["checks"]:
        para(f"[{'PASS' if c['passed'] else 'FAIL'}] {c['name']}: {c['detail']}")
    if narrative.get("assumptions"):
        heading("Assumptions")
        for a in narrative["assumptions"]:
            para(f"- {a}")
    if plan_doc.get("warnings"):
        heading("Warnings")
        for w in plan_doc["warnings"]:
            para(f"- {w}")
    return bytes(pdf.output())
