from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.ml.model_loader import ModelContainer
from backend.app.routes import health, prediction, model, weather

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load model, metadata, and SHAP explainer once on server startup (Section 33)
    print("[Enerlytics Backend] Initializing server and loading ML artifacts...")
    container = ModelContainer.get_instance()
    container.load()
    print("[Enerlytics Backend] Model loaded and ready for real-time inference.")
    yield
    print("[Enerlytics Backend] Shutting down.")

app = FastAPI(
    title="Enerlytics API — Smart Energy Consumption Predictor",
    description="Real-time ML inference engine for building electricity consumption using XGBoost and SHAP.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api prefix
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(prediction.router, prefix="/api", tags=["Prediction"])
app.include_router(model.router, prefix="/api/model", tags=["Model"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])

@app.get("/")
def root():
    return {
        "service": "Enerlytics — Energy insights that make sense",
        "system_status": "ONLINE",
        "documentation": "/docs",
        "api_endpoints": [
            "/api/health",
            "/api/predict",
            "/api/model/metrics",
            "/api/weather/current"
        ]
    }
