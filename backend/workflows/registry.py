"""Importing this module registers every workflow with the engine."""

from workflows import database_investigation, incident_response  # noqa: F401
from workflows.engine import REGISTRY

__all__ = ["REGISTRY"]
