from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict

class SystemConfigRequest(BaseModel):
    config_key: str
    config_value: Any

class SystemConfigResponse(BaseModel):
    config_key: str
    config_value: Any
    updated_at: datetime

class AllConfigsResponse(BaseModel):
    configs: Dict[str, Any]
