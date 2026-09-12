from fastapi import APIRouter
from datetime import datetime, timezone
from backend.app.ml.model_loader import ModelContainer

router = APIRouter()

@router.get("/health")
def get_health():
    container = ModelContainer.get_instance()
    return {
        "status": "online",
        "model_loaded": container.is_loaded,
        "model_version": container.metadata.get("model_version", "xgboost-v1"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
