from fastapi import APIRouter, HTTPException
from backend.app.schemas.prediction import PredictionRequest, PredictionResponse
from backend.app.services.predictor import run_prediction

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
def predict_energy(req: PredictionRequest):
    try:
        return run_prediction(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction computation failed: {str(e)}")
