from fastapi import FastAPI
import joblib
from pydantic import BaseModel
import json
from datetime import datetime, timedelta
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from datetime import date


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# POWER FORECASTING MODELS
# =========================================================

# Existing Power Forecasting Model
power_model = joblib.load(
    "Models/power_forecasting/power_forecast_model.pkl"
)

with open("Models/power_forecasting/metadata.json", "r") as file:
    power_metadata = json.load(file)


# Peak Power Prediction Model
peak_power_model = joblib.load(
    "Models/power_forecasting/peak_power_model.pkl"
)

with open(
    "Models/power_forecasting/peak_power_metadata.json",
    "r"
) as file:
    peak_power_metadata = json.load(file)


# =========================================================
# ENERGY FORECASTING MODEL
# =========================================================

energy_model = joblib.load(
    "Models/energy_forecasting/energy_forecast_model.pkl"
)

with open(
    "Models/energy_forecasting/metadata.json",
    "r"
) as file:
    energy_metadata = json.load(file)


# =========================================================
# INPUT MODELS
# =========================================================

# Existing Power Prediction Input
class PowerPredictionInput(BaseModel):
    forecastDateTime: datetime
    meterId: str
    buildingId: str
    temperature: float
    occupancyLevel: int
    weatherCondition: str


# Peak Power Prediction Input
class PeakPowerPredictionInput(BaseModel):
    #date: datetime
    dayType: str
    dayOfWeek: int
    month: int
    meterId: str
    buildingId: str
    weatherCondition: str
    avgTemperature: float
    maxTemperature: float
    avgOccupancy: float
    maxOccupancy: float
    sunnyHours: int
    cloudyHours: int
    rainyHours: int
    stormyHours: int


# Energy Forecasting Input
class EnergyForecastInput(BaseModel):
    forecastDateTime: datetime
    meterId: str
    buildingId: str
    temperature: float
    occupancyLevel: int
    weatherCondition: str


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_day_type(day_of_week):

    if day_of_week < 5:
        return "Weekday"

    return "Weekend"


def generate_energy_predictions(
    start_datetime,
    total_hours,
    meter_id,
    temperature,
    occupancy_level,
    weather_condition
):

    prediction_rows = []

    for hour_offset in range(total_hours):

        current_datetime = (
            start_datetime +
            timedelta(hours=hour_offset)
        )

        hour = current_datetime.hour
        day_of_week = current_datetime.weekday()
        month = current_datetime.month

        day_type = get_day_type(day_of_week)

        working_hours = 9 <= hour < 17

        prediction_rows.append({

            "temperature": temperature,

            "occupancyLevel": occupancy_level,

            "workingHours": working_hours,

            "hour": hour,

            "dayOfWeek": day_of_week,

            "month": month,

            "meterId": meter_id,

            "weatherCondition": weather_condition,

            "dayType": day_type
        })


    model_input = pd.DataFrame(prediction_rows)

    predictions = energy_model.predict(model_input)

    forecast_results = []

    for index, prediction in enumerate(predictions):

        current_datetime = (
            start_datetime +
            timedelta(hours=index)
        )

        forecast_results.append({

            "forecastDateTime": current_datetime.isoformat(),

            "predictedEnergyConsumption": round(
                float(prediction),
                2
            )
        })


    return forecast_results


# =========================================================
# HEALTH ENDPOINTS
# =========================================================

# To check whether backend is running
@app.get("/")
def home():

    return {
        "message": "CampusVolt backend is running"
    }


# To check whether the backend is available or not
@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =========================================================
# EXISTING SINGLE POWER PREDICTION
# =========================================================

@app.post("/predict/power")
def predict_power(data: PowerPredictionInput):

    forecast_time = data.forecastDateTime

    hour = forecast_time.hour
    day_of_week = forecast_time.weekday()
    month = forecast_time.month

    day_type = get_day_type(day_of_week)

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


# =========================================================
# PEAK POWER PREDICTION
# =========================================================

@app.post("/predict/power/peak")
def predict_peak_power(data: PeakPowerPredictionInput):

    #selected_date = data.date

    #day_of_week = selected_date.weekday()
    #month = selected_date.month

    #day_type = get_day_type(day_of_week)
    print("Hello Word ")
    #print(data)

    model_input = pd.DataFrame([{
    "meterId": data.meterId,
    "buildingId": data.buildingId,
    "dayOfWeek": data.dayOfWeek,
    "month": data.month,
    "dayType": data.dayType,
    "weatherCondition": data.weatherCondition,
    "avgTemperature": data.avgTemperature,
    "maxTemperature": data.maxTemperature,
    "avgOccupancy": data.avgOccupancy,
    "maxOccupancy": data.maxOccupancy,
    "sunnyHours": data.sunnyHours,
    "cloudyHours": data.cloudyHours,
    "rainyHours": data.rainyHours,
    "stormyHours": data.stormyHours
}])

    prediction = peak_power_model.predict(model_input)


    return {

        "predicted_peak_power": round(
            float(prediction[0]),
            2
        ),

        "unit": "kW",

        #"date": selected_date,

        "meterId": data.meterId,

        "buildingId": data.buildingId,

        "status": "success"
    }


# =========================================================
# ENERGY FORECASTING
# =========================================================

@app.post("/forecast/energy")
def forecast_energy(data: EnergyForecastInput):


    # -----------------------------------------------------
    # DAILY ENERGY FORECAST
    # -----------------------------------------------------

    daily_start = data.forecastDateTime.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


    daily_predictions = generate_energy_predictions(

        start_datetime=daily_start,

        total_hours=24,

        meter_id=data.meterId,

        temperature=data.temperature,

        occupancy_level=data.occupancyLevel,

        weather_condition=data.weatherCondition
    )


    predicted_daily_consumption = sum(

        prediction["predictedEnergyConsumption"]

        for prediction in daily_predictions
    )


    # -----------------------------------------------------
    # WEEKLY ENERGY FORECAST
    # -----------------------------------------------------

    weekly_predictions = generate_energy_predictions(

        start_datetime=daily_start,

        total_hours=168,

        meter_id=data.meterId,

        temperature=data.temperature,

        occupancy_level=data.occupancyLevel,

        weather_condition=data.weatherCondition
    )


    predicted_weekly_consumption = sum(

        prediction["predictedEnergyConsumption"]

        for prediction in weekly_predictions
    )


    # -----------------------------------------------------
    # MONTHLY ENERGY FORECAST
    # -----------------------------------------------------

    monthly_start = data.forecastDateTime.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


    if monthly_start.month == 12:

        next_month = monthly_start.replace(
            year=monthly_start.year + 1,
            month=1
        )

    else:

        next_month = monthly_start.replace(
            month=monthly_start.month + 1
        )


    total_monthly_hours = int(

        (
            next_month -
            monthly_start
        ).total_seconds() / 3600

    )


    monthly_predictions = generate_energy_predictions(

        start_datetime=monthly_start,

        total_hours=total_monthly_hours,

        meter_id=data.meterId,

        temperature=data.temperature,

        occupancy_level=data.occupancyLevel,

        weather_condition=data.weatherCondition
    )


    predicted_monthly_consumption = sum(

        prediction["predictedEnergyConsumption"]

        for prediction in monthly_predictions
    )


    # =====================================================
    # HIGH-CONSUMPTION PERIODS
    # =====================================================

    average_energy_consumption = (

        predicted_daily_consumption /
        len(daily_predictions)

    )


    high_consumption_threshold = (

        average_energy_consumption *
        1.20

    )


    high_consumption_periods = []


    for prediction in daily_predictions:

        if (

            prediction["predictedEnergyConsumption"]
            >=
            high_consumption_threshold

        ):

            high_consumption_periods.append({

                "forecastDateTime":
                prediction["forecastDateTime"],

                "predictedEnergyConsumption":
                prediction["predictedEnergyConsumption"],

                "message":
                "High energy consumption expected during this period."

            })


    # =====================================================
    # POTENTIALLY UNUSUAL INCREASES
    # =====================================================

    unusual_increases = []


    for index in range(1, len(daily_predictions)):


        previous_prediction = (

            daily_predictions[index - 1]
            ["predictedEnergyConsumption"]

        )


        current_prediction = (

            daily_predictions[index]
            ["predictedEnergyConsumption"]

        )


        if previous_prediction > 0:


            percentage_increase = (

                (
                    current_prediction -
                    previous_prediction
                )

                /

                previous_prediction

            ) * 100


            if percentage_increase >= 30:


                unusual_increases.append({

                    "forecastDateTime":
                    daily_predictions[index]
                    ["forecastDateTime"],

                    "previousConsumption":
                    round(
                        previous_prediction,
                        2
                    ),

                    "predictedConsumption":
                    round(
                        current_prediction,
                        2
                    ),

                    "percentageIncrease":
                    round(
                        percentage_increase,
                        2
                    ),

                    "message":
                    "Potentially unusual increase in energy consumption detected.",

                    "recommendation":
                    "Monitor this period and investigate possible causes if the increase continues."

                })


    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {


        "status": "success",


        "forecastDateTime":
        data.forecastDateTime.isoformat(),


        "meterId":
        data.meterId,


        "buildingId":
        data.buildingId,


        "unit":
        energy_metadata.get(
            "prediction_unit",
            "kWh"
        ),


        "predictedDailyConsumption":
        round(
            predicted_daily_consumption,
            2
        ),


        "predictedWeeklyConsumption":
        round(
            predicted_weekly_consumption,
            2
        ),


        "predictedMonthlyConsumption":
        round(
            predicted_monthly_consumption,
            2
        ),


        "highConsumptionThreshold":
        round(
            high_consumption_threshold,
            2
        ),


        "highConsumptionPeriods":
        high_consumption_periods,


        "potentiallyUnusualIncreases":
        unusual_increases

    }