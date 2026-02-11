"""Common parameter parsing helpers for API endpoints."""

from flask import Request


def get_float_param(request: Request, name: str, default: float) -> float:
    """Extract a float parameter from request form data."""
    try:
        return float(request.form.get(name, default))
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Invalid parameter: {name} must be a float") from exc


def get_int_param(request: Request, name: str, default: int) -> int:
    """Extract an int parameter from request form data."""
    try:
        return int(request.form.get(name, default))
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Invalid parameter: {name} must be an integer") from exc


def get_optional_float_param(request: Request, name: str) -> float | None:
    """Extract an optional float parameter from request form data."""
    value = request.form.get(name)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Invalid parameter: {name} must be a float") from exc
