

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarClock,
  CloudSun,
  Gauge,
  Loader2,
  RotateCcw,
  Thermometer,
  Users,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  Activity,
  Brain,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { BillEstimator } from "./BillEstimator";

const ENERGY_API_URL =
  "https://taught-conducting-tool-engaged.trycloudflare.com/forecast/energy";


const METER_IDS = ["M001", "M002", "M003", "M004", "M005"];

const BUILDING_IDS = ["B001", "B002", "B003", "B004", "B005"];

const WEATHER_CONDITIONS = [
  "Sunny",
  "Rainy",
  "Cloudy",
  "Stormy",
];


interface EnergyFormValues {
  forecastDateTime: string;
  meterId: string;
  buildingId: string;
  temperature: string;
  occupancyLevel: string;
  weatherCondition: string;
}


interface EnergyForecastResult {
  predictedDailyConsumption?: number;
  predictedWeeklyConsumption?: number;
  predictedMonthlyConsumption?: number;

  highConsumptionPeriods?: any[];
  potentiallyUnusualIncreases?: any[];

  unit?: string;
  status?: string;
  model_type?: string;
}


const defaultEnergyForm: EnergyFormValues = {
  forecastDateTime: "",
  meterId: "",
  buildingId: "",
  temperature: "",
  occupancyLevel: "",
  weatherCondition: "",
};


function toISODateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}


function getPeriodLabel(item: any) {
  return (
    item.timestamp ||
    item.forecastDateTime ||
    item.dateTime ||
    item.datetime ||
    item.time ||
    item.hour ||
    "Unknown time"
  );
}


function getConsumptionValue(item: any) {
  const value =
    item.predictedConsumption ??
    item.energyConsumption ??
    item.consumption ??
    item.prediction ??
    item.value;

  return typeof value === "number"
    ? value.toFixed(2)
    : value ?? "N/A";
}


function getIncreaseValue(item: any) {
  const value =
    item.increasePercentage ??
    item.increase_percent ??
    item.percentageIncrease ??
    item.increase;

  return typeof value === "number"
    ? `${value.toFixed(1)}%`
    : value ?? "";
}


export function EnergyForecasting() {
  const [form, setForm] =
    useState<EnergyFormValues>(defaultEnergyForm);

  const [result, setResult] =
    useState<EnergyForecastResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [validationErrors, setValidationErrors] =
    useState<Partial<EnergyFormValues>>({});


  const setField = (
    field: keyof EnergyFormValues,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };


  const validate = (): boolean => {
    const errors: Partial<EnergyFormValues> = {};

    if (!form.forecastDateTime) {
      errors.forecastDateTime =
        "Select a forecast date and time";
    }

    if (!form.meterId) {
      errors.meterId = "Select a meter";
    }

    if (!form.buildingId) {
      errors.buildingId = "Select a building";
    }

    if (!form.weatherCondition) {
      errors.weatherCondition =
        "Select a weather condition";
    }

    const temperature =
      parseFloat(form.temperature);

    if (
      form.temperature === "" ||
      Number.isNaN(temperature)
    ) {
      errors.temperature =
        "Enter a valid temperature";
    }

    const occupancy =
      parseFloat(form.occupancyLevel);

    if (
      form.occupancyLevel === "" ||
      Number.isNaN(occupancy) ||
      occupancy < 0 ||
      occupancy > 100
    ) {
      errors.occupancyLevel =
        "Enter a value between 0 and 100";
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };


  const handleForecast = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      forecastDateTime: toISODateTime(
        form.forecastDateTime
      ),

      meterId: form.meterId,

      buildingId: form.buildingId,

      temperature: parseFloat(
        form.temperature
      ),

      occupancyLevel: parseFloat(
        form.occupancyLevel
      ),

      weatherCondition:
        form.weatherCondition,
    };

    try {
      const response = await fetch(
        ENERGY_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          `Server responded with ${response.status}: ${
            text || response.statusText
          }`
        );
      }

      const data =
        await response.json();

      setResult(data);

    } catch (err) {

      if (
        err instanceof TypeError &&
        err.message
          .toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Cannot reach the Energy Forecasting server. Make sure FastAPI is running and the Cloudflare tunnel is active."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );
      }

    } finally {
      setLoading(false);
    }
  };


  const handleReset = () => {
    setForm(defaultEnergyForm);

    setResult(null);

    setError(null);

    setValidationErrors({});
  };


  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2.5 rounded-xl">
          <BarChart3 className="size-5 text-white" />
        </div>

        <div>
          <h2 className="text-xl font-bold">
            Energy Forecasting
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Predict future energy consumption and identify high-consumption patterns.
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* INPUT SECTION */}

        <Card className="xl:col-span-3">

          <CardHeader className="pb-4">

            <CardTitle className="text-base font-semibold">
              Forecast Parameters
            </CardTitle>

            <CardDescription>
              Provide the expected campus conditions.
              The backend automatically derives
              hour, day of week, month,
              day type, and working hours.
            </CardDescription>

          </CardHeader>


          <CardContent className="space-y-5">


            {/* Date and Time */}

            <div className="space-y-1.5">

              <Label className="flex items-center gap-1.5 text-sm font-medium">

                <CalendarClock className="size-3.5 text-purple-500" />

                Forecast Date and Time

              </Label>

              <Input
                type="datetime-local"

                value={
                  form.forecastDateTime
                }

                onChange={(e) =>
                  setField(
                    "forecastDateTime",
                    e.target.value
                  )
                }

                className={
                  validationErrors.forecastDateTime
                    ? "border-red-500"
                    : ""
                }
              />

              {validationErrors.forecastDateTime ? (

                <p className="text-xs text-red-500">
                  {
                    validationErrors.forecastDateTime
                  }
                </p>

              ) : (

                <p className="text-xs text-gray-400">
                  Used as the starting point for
                  daily, weekly, and monthly
                  energy forecasting.
                </p>

              )}

            </div>


            {/* Meter and Building */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1.5">

                <Label className="flex items-center gap-1.5 text-sm font-medium">

                  <Gauge className="size-3.5 text-blue-500" />

                  Meter ID

                </Label>

                <Select
                  value={form.meterId}

                  onValueChange={(value) =>
                    setField(
                      "meterId",
                      value
                    )
                  }
                >

                  <SelectTrigger
                    className={
                      validationErrors.meterId
                        ? "border-red-500"
                        : ""
                    }
                  >

                    <SelectValue placeholder="Select meter" />

                  </SelectTrigger>


                  <SelectContent>

                    {METER_IDS.map((id) => (

                      <SelectItem
                        key={id}
                        value={id}
                      >

                        {id}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>


                {validationErrors.meterId && (

                  <p className="text-xs text-red-500">

                    {
                      validationErrors.meterId
                    }

                  </p>

                )}

              </div>


              <div className="space-y-1.5">

                <Label className="flex items-center gap-1.5 text-sm font-medium">

                  <Building2 className="size-3.5 text-green-500" />

                  Building ID

                </Label>


                <Select
                  value={form.buildingId}

                  onValueChange={(value) =>
                    setField(
                      "buildingId",
                      value
                    )
                  }
                >

                  <SelectTrigger
                    className={
                      validationErrors.buildingId
                        ? "border-red-500"
                        : ""
                    }
                  >

                    <SelectValue placeholder="Select building" />

                  </SelectTrigger>


                  <SelectContent>

                    {BUILDING_IDS.map((id) => (

                      <SelectItem
                        key={id}
                        value={id}
                      >

                        {id}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>


                {validationErrors.buildingId && (

                  <p className="text-xs text-red-500">

                    {
                      validationErrors.buildingId
                    }

                  </p>

                )}

              </div>

            </div>


            <div className="border-t border-gray-100 dark:border-gray-800" />


            {/* Temperature and Occupancy */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              <div className="space-y-1.5">

                <Label className="flex items-center gap-1.5 text-sm font-medium">

                  <Thermometer className="size-3.5 text-orange-500" />

                  Temperature

                </Label>


                <div className="relative">

                  <Input
                    type="number"

                    step="0.1"

                    placeholder="e.g. 30.5"

                    value={
                      form.temperature
                    }

                    onChange={(e) =>
                      setField(
                        "temperature",
                        e.target.value
                      )
                    }

                    className={`pr-8 ${
                      validationErrors.temperature
                        ? "border-red-500"
                        : ""
                    }`}
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">

                    °C

                  </span>

                </div>


                {validationErrors.temperature ? (

                  <p className="text-xs text-red-500">

                    {
                      validationErrors.temperature
                    }

                  </p>

                ) : (

                  <p className="text-xs text-gray-400">

                    Expected ambient temperature.

                  </p>

                )}

              </div>


              <div className="space-y-1.5">

                <Label className="flex items-center gap-1.5 text-sm font-medium">

                  <Users className="size-3.5 text-purple-500" />

                  Occupancy Level (%)

                </Label>


                <Input
                  type="number"

                  min="0"

                  max="100"

                  placeholder="e.g. 75"

                  value={
                    form.occupancyLevel
                  }

                  onChange={(e) =>
                    setField(
                      "occupancyLevel",
                      e.target.value
                    )
                  }

                  className={
                    validationErrors.occupancyLevel
                      ? "border-red-500"
                      : ""
                  }
                />


                {validationErrors.occupancyLevel ? (

                  <p className="text-xs text-red-500">

                    {
                      validationErrors.occupancyLevel
                    }

                  </p>

                ) : (

                  <p className="text-xs text-gray-400">

                    Expected occupancy from
                    0 to 100%.

                  </p>

                )}

              </div>

            </div>


            {/* Weather */}

            <div className="space-y-1.5">

              <Label className="flex items-center gap-1.5 text-sm font-medium">

                <CloudSun className="size-3.5 text-sky-500" />

                Weather Condition

              </Label>


              <Select
                value={
                  form.weatherCondition
                }

                onValueChange={(value) =>
                  setField(
                    "weatherCondition",
                    value
                  )
                }
              >

                <SelectTrigger
                  className={
                    validationErrors.weatherCondition
                      ? "border-red-500"
                      : ""
                  }
                >

                  <SelectValue placeholder="Select weather condition" />

                </SelectTrigger>


                <SelectContent>

                  {WEATHER_CONDITIONS.map(
                    (weather) => (

                      <SelectItem
                        key={weather}
                        value={weather}
                      >

                        {weather}

                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>


              {validationErrors.weatherCondition && (

                <p className="text-xs text-red-500">

                  {
                    validationErrors.weatherCondition
                  }

                </p>

              )}

            </div>


            {/* Actions */}

            <div className="flex gap-3 pt-2">

              <Button
                onClick={handleForecast}

                disabled={loading}

                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold h-11"
              >

                {loading ? (

                  <>

                    <Loader2 className="size-4 mr-2 animate-spin" />

                    Generating Energy Forecast...

                  </>

                ) : (

                  <>

                    <Brain className="size-4 mr-2" />

                    Generate Energy Forecast

                  </>

                )}

              </Button>


              <Button
                onClick={handleReset}

                variant="outline"

                disabled={loading}

                className="h-11"

                title="Reset form"
              >

                <RotateCcw className="size-4" />

              </Button>

            </div>


          </CardContent>

        </Card>


        {/* RESULT SECTION */}

        <div className="xl:col-span-2 space-y-4">

          <AnimatePresence mode="wait">


            {/* Error */}

            {error && !loading && (

              <motion.div
                key="energy-error"

                initial={{
                  opacity: 0,
                  y: 12,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                exit={{
                  opacity: 0,
                  y: -8,
                }}
              >

                <Alert className="border-red-400 bg-red-50 dark:bg-red-950/20">

                  <AlertCircle className="size-4 text-red-600" />

                  <AlertDescription className="text-red-700 dark:text-red-400 text-sm leading-relaxed">

                    {error}

                  </AlertDescription>

                </Alert>

              </motion.div>

            )}


            {/* Loading */}

            {loading && (

              <motion.div
                key="energy-loading"

                initial={{
                  opacity: 0,
                }}

                animate={{
                  opacity: 1,
                }}

                exit={{
                  opacity: 0,
                }}
              >

                <Card className="border-2 border-purple-100 dark:border-purple-900/40">

                  <CardContent className="flex flex-col items-center justify-center py-14 gap-4">

                    <Loader2 className="size-10 text-purple-500 animate-spin" />

                    <div className="text-center">

                      <p className="font-semibold">

                        Generating energy forecast...

                      </p>

                      <p className="text-sm text-gray-400 mt-1">

                        Calculating future energy consumption.

                      </p>

                    </div>

                  </CardContent>

                </Card>

              </motion.div>

            )}


            {/* Results */}

            {result && !loading && (

              <motion.div
                key="energy-result"

                initial={{
                  opacity: 0,
                  y: 12,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >

                <div className="space-y-4">


                  {/* Daily */}

                  <Card className="border-purple-200 dark:border-purple-800">

                    <CardContent className="pt-5">

                      <div className="flex items-center gap-3">

                        <CalendarDays className="size-5 text-purple-500" />

                        <div>

                          <p className="text-xs text-gray-400">

                            Predicted Daily Consumption

                          </p>

                          <p className="text-2xl font-bold">

                            {result.predictedDailyConsumption?.toFixed(2) ?? "N/A"}

                            <span className="text-sm text-gray-400 ml-2">

                              {result.unit ?? "kWh"}

                            </span>

                          </p>

                        </div>

                      </div>

                    </CardContent>

                  </Card>


                  {/* Weekly */}

                  <Card>

                    <CardContent className="pt-5">

                      <div className="flex items-center gap-3">

                        <Activity className="size-5 text-blue-500" />

                        <div>

                          <p className="text-xs text-gray-400">

                            Predicted Weekly Consumption

                          </p>

                          <p className="text-2xl font-bold">

                            {result.predictedWeeklyConsumption?.toFixed(2) ?? "N/A"}

                            <span className="text-sm text-gray-400 ml-2">

                              {result.unit ?? "kWh"}

                            </span>

                          </p>

                        </div>

                      </div>

                    </CardContent>

                  </Card>


                  {/* Monthly */}

                  <Card className="border-blue-200 dark:border-blue-800">

                    <CardContent className="pt-5">

                      <div className="flex items-center gap-3">

                        <TrendingUp className="size-5 text-green-500" />

                        <div>

                          <p className="text-xs text-gray-400">

                            Predicted Monthly Consumption

                          </p>

                          <p className="text-2xl font-bold">

                            {result.predictedMonthlyConsumption?.toFixed(2) ?? "N/A"}

                            <span className="text-sm text-gray-400 ml-2">

                              {result.unit ?? "kWh"}

                            </span>

                          </p>

                        </div>

                      </div>

                    </CardContent>

                  </Card>

                </div>

              </motion.div>

            )}


            {/* Empty */}

            {!result && !loading && !error && (

              <motion.div
                key="energy-empty"

                initial={{
                  opacity: 0,
                }}

                animate={{
                  opacity: 1,
                }}
              >

                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">

                  <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">

                    <div className="size-14 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">

                      <BarChart3 className="size-7 text-purple-400" />

                    </div>


                    <div>

                      <p className="font-medium text-gray-600 dark:text-gray-300">

                        No energy forecast yet

                      </p>

                      <p className="text-sm text-gray-400 mt-1 max-w-[220px]">

                        Enter the forecast conditions and generate an energy prediction.

                      </p>

                    </div>

                  </CardContent>

                </Card>

              </motion.div>

            )}

          </AnimatePresence>


          {/* Model information */}

          <Card className="bg-purple-50/60 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40">

            <CardContent className="pt-4 pb-4">

              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wide">

                Energy Forecast Insights

              </p>


              <ul className="text-xs text-purple-600/80 dark:text-purple-400/80 space-y-1">

                <li>
                  • Predicts daily energy consumption
                </li>

                <li>
                  • Projects weekly energy consumption
                </li>

                <li>
                  • Estimates monthly energy consumption
                </li>

                <li>
                  • Identifies high-consumption periods
                </li>

                <li>
                  • Detects potentially unusual increases
                </li>

              </ul>

            </CardContent>

          </Card>

        </div>

      </div>


      {/* HIGH CONSUMPTION PERIODS */}

      {result &&
        result.highConsumptionPeriods &&
        result.highConsumptionPeriods.length > 0 && (

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <TrendingUp className="size-5 text-orange-500" />

                High-Consumption Periods

              </CardTitle>


              <CardDescription>

                Forecast periods where predicted energy consumption is significantly above the expected level.

              </CardDescription>

            </CardHeader>


            <CardContent>

              <div className="space-y-3">

                {result.highConsumptionPeriods.map(
                  (item, index) => (

                    <div
                      key={index}

                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-4"
                    >

                      <div>

                        <p className="font-medium">

                          {getPeriodLabel(item)}

                        </p>

                        <p className="text-sm text-gray-400">

                          High predicted consumption period

                        </p>

                      </div>


                      <div className="text-left sm:text-right">

                        <p className="font-bold text-orange-500">

                          {getConsumptionValue(item)} kWh

                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </CardContent>

          </Card>

        )}


      {/* UNUSUAL INCREASES */}

      {result &&
        result.potentiallyUnusualIncreases &&
        result.potentiallyUnusualIncreases.length > 0 && (

          <Card className="border-red-200 dark:border-red-900/40">

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <AlertTriangle className="size-5 text-red-500" />

                Potentially Unusual Increases

              </CardTitle>


              <CardDescription>

                Periods where predicted energy usage increases sharply compared with the previous period.

              </CardDescription>

            </CardHeader>


            <CardContent>

              <div className="space-y-3">

                {result.potentiallyUnusualIncreases.map(
                  (item, index) => (

                    <div
                      key={index}

                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-red-100 dark:border-red-900/30 p-4"
                    >

                      <div>

                        <p className="font-medium">

                          {getPeriodLabel(item)}

                        </p>

                        <p className="text-sm text-gray-400">

                          Significant increase in predicted energy consumption

                        </p>

                      </div>


                      <div className="text-left sm:text-right">

                        <p className="font-bold text-red-500">

                          {getIncreaseValue(item)}

                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </CardContent>

          </Card>

        )}

         {/* Bill Estimator */}
      {result?.predictedMonthlyConsumption !== undefined && (
        <BillEstimator
          currentUsage={result.predictedMonthlyConsumption}
        />
      )}
      
    </div>
  );
}