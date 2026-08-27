from fastapi import FastAPI
import joblib
from pydantic import BaseModel
import json

app = FastAPI()

power_model = joblib.load("Models/power_forecasting/power_forecast_model.pkl")

class PowerPredictionInput(BaseModel):
    hour: int
    day: int
    dayOfWeek: int
    month: int
    powerLag1: float
    powerLag24: float
    temperature: float
    occupancyLevel: int
    

#To Create a endpoint 
@app.get("/")
def home():
    return {"message": "CampusVolt backend is running"}

#To check whether the backend is available or not
@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/power")
@app.post("/predict/power")
def predict_power(data: PowerPredictionInput):

    model_input = [[
        data.hour,
        data.day,
        data.dayOfWeek,
        data.month,
        data.powerLag1,
        data.powerLag24,
        data.temperature,
        data.occupancyLevel
    ]]

    prediction = power_model.predict(model_input)

    return {
        "predicted_power": float(prediction[0]),
        "unit": "kW"
    }