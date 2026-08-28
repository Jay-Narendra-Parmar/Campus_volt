from fastapi import FastAPI
import joblib
from pydantic import BaseModel
import json
from datetime import datetime
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

power_model = joblib.load("Models/power_forecasting/power_forecast_model.pkl")

with open("Models/power_forecasting/metadata.json", "r") as file:
    power_metadata = json.load(file)

class PowerPredictionInput(BaseModel):
    forecastDateTime: datetime
    meterId: str
    buildingId: str
    temperature: float
    occupancyLevel: int
    weatherCondition: str
    
#To Create a endpoint 
@app.get("/")
def home():
    return {"message": "CampusVolt backend is running"}

#To check whether the backend is available or not
@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/power")
def predict_power(data: PowerPredictionInput):

    forecast_time = data.forecastDateTime

    hour = forecast_time.hour
    day_of_week = forecast_time.weekday()
    month = forecast_time.month

    if day_of_week < 5:
        day_type = "Weekday"
    else:
        day_type = "Weekend"

    working_hours = 9 <= hour < 17

    model_input = pd.DataFrame([{
        "hour": hour,
        "dayOfWeek": day_of_week,
        "month": month,
        "meterId": data.meterId,
        "buildingId": data.buildingId,
        "temperature": data.temperature,
        "occupancyLevel": data.occupancyLevel,
        "weatherCondition": data.weatherCondition,
        "dayType": day_type,
        "workingHours": working_hours
    }])

    prediction = power_model.predict(model_input)

    return {
        "predicted_power": float(prediction[0]),
        "unit": power_metadata["prediction_unit"],
        "model_type": power_metadata["model_type"],
        "status": "success"
    }

