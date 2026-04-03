from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="CyberShield AI Microservice", description="AI Endpoint for Threat Detection")

# Load compiled ML Models at startup
BASE_DIR = os.path.dirname(__file__)
payload_model_path = os.path.join(BASE_DIR, 'payload_model.joblib')
anomaly_model_path = os.path.join(BASE_DIR, 'anomaly_model.joblib')

payload_model = None
anomaly_model = None

if os.path.exists(payload_model_path):
    payload_model = joblib.load(payload_model_path)
if os.path.exists(anomaly_model_path):
    anomaly_model = joblib.load(anomaly_model_path)

class PayloadRequest(BaseModel):
    payload: str

class LoginRequest(BaseModel):
    hour_of_day: int
    consecutive_failures: int
    login_duration_ms: int

@app.post("/api/ai/analyze-payload")
def analyze_payload(req: PayloadRequest):
    if not payload_model:
        raise HTTPException(status_code=500, detail="Payload model not initialized.")
    
    # The payload model returns 1 if malicious, 0 if safe
    prediction = payload_model.predict([req.payload])[0]
    
    # Get confidence score if supported by model (e.g. LogisticRegression)
    risk_score = 0.0
    if hasattr(payload_model, "predict_proba"):
        probabilities = payload_model.predict_proba([req.payload])[0]
        # P(Class 1 = Malicious)
        if len(probabilities) > 1:
            risk_score = float(probabilities[1])
            
    return {
        "is_malicious": bool(prediction == 1),
        "risk_score": risk_score
    }

@app.post("/api/ai/analyze-login")
def analyze_login(req: LoginRequest):
    if not anomaly_model:
        raise HTTPException(status_code=500, detail="Anomaly model not initialized.")
    
    features = [[req.hour_of_day, req.consecutive_failures, req.login_duration_ms]]
    prediction = anomaly_model.predict(features)[0]
    
    # IsolationForest returns -1 for out-of-distribution (anomaly), 1 for inliner
    return {
        "is_anomalous": bool(prediction == -1)
    }

# Run via: uvicorn main:app --reload --port 8000
