from typing import Any, Optional


def success_response(message: str, data: Any = None) -> dict:
    """Matches the Node.js success() helper exactly."""
    return {"success": True, "message": message, "data": data}


def error_response(message: str, details: Any = None) -> dict:
    """Matches the Node.js error() helper exactly."""
    return {"success": False, "message": message, "details": details}
