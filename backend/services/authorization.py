"""Deterministic authorization rules. Approval gates are enforced here, never by the LLM."""

# Which persona may approve which sensitive action.
APPROVER_ROLES: dict[str, set[str]] = {
    "execute_simulated_maintenance": {"dba"},
    "execute_incident_remediation": {"sre"},
    "apply_reconciliation_correction": {"reconciler"},
    "promote_migration_stage": {"migration"},
    "update_agent_permissions": {"coo"},
}

SENSITIVE_ACTIONS = set(APPROVER_ROLES)

AGENT_ACTORS_PREFIX = "agent:"


class AuthorizationError(Exception):
    pass


def requires_approval(action: str) -> bool:
    return action in SENSITIVE_ACTIONS


def required_role(action: str) -> str:
    roles = APPROVER_ROLES.get(action)
    if not roles:
        raise AuthorizationError(f"Unknown sensitive action: {action}")
    return sorted(roles)[0]


def check_can_approve(action: str, reviewer: str, reviewer_role: str, requested_by: str) -> None:
    if reviewer.startswith(AGENT_ACTORS_PREFIX):
        raise AuthorizationError("Agents cannot approve actions.")
    if reviewer == requested_by:
        raise AuthorizationError("Requester cannot approve their own action.")
    if reviewer_role not in APPROVER_ROLES.get(action, set()):
        raise AuthorizationError(f"Role '{reviewer_role}' is not authorized to approve '{action}'.")
