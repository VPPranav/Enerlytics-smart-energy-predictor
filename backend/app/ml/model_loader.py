import os
import json
import joblib
import sys

# Ensure unpickling can find EnergyFeatureEngineer
import backend.app.ml.feature_engineering as fe_module
sys.modules["ml.training.feature_engineering"] = fe_module

class ModelContainer:
    _instance = None
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.metrics = {}
        self.is_loaded = False
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelContainer()
        return cls._instance
        
    def load(self):
        if self.is_loaded:
            return
            
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_dir = os.path.join(base_dir, "models")
        
        model_path = os.path.join(model_dir, "energy_model.joblib")
        prep_path = os.path.join(model_dir, "preprocessing.joblib")
        meta_path = os.path.join(model_dir, "model_metadata.json")
        metrics_path = os.path.join(model_dir, "metrics.json")
        
        root_dir = os.path.dirname(os.path.dirname(base_dir))
        if not os.path.exists(model_path):
            model_path = os.path.join(root_dir, "ml", "models", "energy_model.joblib")
        if not os.path.exists(prep_path):
            prep_path = os.path.join(root_dir, "ml", "models", "preprocessing.joblib")
        if not os.path.exists(meta_path):
            meta_path = os.path.join(root_dir, "ml", "models", "model_metadata.json")
        if not os.path.exists(metrics_path):
            metrics_path = os.path.join(root_dir, "ml", "evaluation", "metrics.json")
            
        print(f"[ModelContainer] Loading model from {model_path}...")
        self.model = joblib.load(model_path)
        self.preprocessor = joblib.load(prep_path)
        
        with open(meta_path, "r") as f:
            self.metadata = json.load(f)
            
        with open(metrics_path, "r") as f:
            self.metrics = json.load(f)
            
        self.is_loaded = True
        print("[ModelContainer] Model, preprocessor, and metadata loaded successfully.")
