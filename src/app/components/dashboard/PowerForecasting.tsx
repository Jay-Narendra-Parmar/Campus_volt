import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Zap, AlertCircle, Loader2, RotateCcw, Thermometer, Users, CalendarClock, Building2, Gauge, CloudSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const API_URL = "http://127.0.0.1:8000/predict/power";

const METER_IDS = ["M001", "M002", "M003", "M004", "M005"];
const BUILDING_IDS = ["B001", "B002", "B003", "B004", "B005"];
const WEATHER_CONDITIONS = ["Sunny", "Rainy", "Cloudy", "Stormy"];

interface PredictionResult {
  predicted_power: number;
  unit: string;
  model_type: string;
  status: string;
}

interface FormValues {
  forecastDateTime: string;
  meterId: string;
  buildingId: string;
  temperature: string;
  occupancyLevel: string;
  weatherCondition: string;
}

const defaultForm: FormValues = {
  forecastDateTime: "",
  meterId: "",
  buildingId: "",
  temperature: "",
  occupancyLevel: "",
  weatherCondition: "",
};

function getPowerColor(kw: number) {
  if (kw < 40) return "text-green-600 dark:text-green-400";
  if (kw < 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getPowerBadgeVariant(kw: number): "default" | "secondary" | "destructive" {
  if (kw < 40) return "default";
  if (kw < 70) return "secondary";
  return "destructive";
}

function getPowerLabel(kw: number) {
  if (kw < 40) return "Low Demand";
  if (kw < 70) return "Moderate Demand";
  return "High Demand";
}

function toISODateTime(value: string): string {
  // datetime-local gives "YYYY-MM-DDTHH:MM", backend wants "YYYY-MM-DDTHH:MM:SS"
  return value.length === 16 ? `${value}:00` : value;
}

export function PowerForecasting() {
  const [form, setForm] = useState<FormValues>(defaultForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<FormValues>>({});

  const validate = (): boolean => {
    const errors: Partial<FormValues> = {};

    if (!form.forecastDateTime) errors.forecastDateTime = "Select a future date and time";
    if (!form.meterId) errors.meterId = "Required";
    if (!form.buildingId) errors.buildingId = "Required";
    if (!form.weatherCondition) errors.weatherCondition = "Required";

    const temp = parseFloat(form.temperature);
    if (form.temperature === "" || isNaN(temp)) errors.temperature = "Enter a valid temperature";

    const occ = parseFloat(form.occupancyLevel);
    if (form.occupancyLevel === "" || isNaN(occ) || occ < 0 || occ > 100)
      errors.occupancyLevel = "Enter a percentage between 0 and 100";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePredict = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      forecastDateTime: toISODateTime(form.forecastDateTime),
      meterId: form.meterId,
      buildingId: form.buildingId,
      temperature: parseFloat(form.temperature),
      occupancyLevel: parseFloat(form.occupancyLevel),
      weatherCondition: form.weatherCondition,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded with ${response.status}: ${text || response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        setError("Cannot reach the prediction server. Make sure the FastAPI backend is running and the Cloudflare tunnel URL is configured correctly.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setResult(null);
    setError(null);
    setValidationErrors({});
  };

  const setField = (field: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2.5 rounded-xl">
          <Brain className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Power Consumption Forecasting</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ML-powered demand prediction using a RandomForest model
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Input form */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Input Parameters</CardTitle>
            <CardDescription>
              Provide campus conditions and a forecast window to generate a power demand prediction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Forecast Date & Time — full width */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock className="size-3.5 text-blue-500" />
                Future Forecast Date and Time
              </Label>
              <Input
                type="datetime-local"
                value={form.forecastDateTime}
                onChange={(e) => setField("forecastDateTime", e.target.value)}
                className={validationErrors.forecastDateTime ? "border-red-500" : ""}
              />
              {validationErrors.forecastDateTime ? (
                <p className="text-xs text-red-500">{validationErrors.forecastDateTime}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  Hour, day, month, and day type are derived automatically from this value.
                </p>
              )}
            </div>

            {/* Meter ID + Building ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Gauge className="size-3.5 text-blue-500" />
                  Meter ID
                </Label>
                <Select value={form.meterId} onValueChange={(v) => setField("meterId", v)}>
                  <SelectTrigger className={validationErrors.meterId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select meter" />
                  </SelectTrigger>
                  <SelectContent>
                    {METER_IDS.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.meterId && (
                  <p className="text-xs text-red-500">{validationErrors.meterId}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Building2 className="size-3.5 text-blue-500" />
                  Building ID
                </Label>
                <Select value={form.buildingId} onValueChange={(v) => setField("buildingId", v)}>
                  <SelectTrigger className={validationErrors.buildingId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_IDS.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.buildingId && (
                  <p className="text-xs text-red-500">{validationErrors.buildingId}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-1" />

            {/* Temperature + Occupancy */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Thermometer className="size-3.5 text-orange-500" />
                  Temperature
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 31.2"
                    value={form.temperature}
                    onChange={(e) => setField("temperature", e.target.value)}
                    className={`pr-8 ${validationErrors.temperature ? "border-red-500" : ""}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">°C</span>
                </div>
                {validationErrors.temperature ? (
                  <p className="text-xs text-red-500">{validationErrors.temperature}</p>
                ) : (
                  <p className="text-xs text-gray-400">Ambient temperature</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="size-3.5 text-purple-500" />
                  Expected Occupancy Level (%)
                </Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="e.g. 65"
                  value={form.occupancyLevel}
                  onChange={(e) => setField("occupancyLevel", e.target.value)}
                  className={validationErrors.occupancyLevel ? "border-red-500" : ""}
                />
                {validationErrors.occupancyLevel ? (
                  <p className="text-xs text-red-500">{validationErrors.occupancyLevel}</p>
                ) : (
                  <p className="text-xs text-gray-400">Enter the expected occupancy percentage from 0 to 100.</p>
                )}
              </div>
            </div>

            {/* Weather Condition — full width */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <CloudSun className="size-3.5 text-sky-500" />
                Weather Condition
              </Label>
              <Select value={form.weatherCondition} onValueChange={(v) => setField("weatherCondition", v)}>
                <SelectTrigger className={validationErrors.weatherCondition ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select weather condition" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_CONDITIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.weatherCondition && (
                <p className="text-xs text-red-500">{validationErrors.weatherCondition}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                onClick={handlePredict}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 font-semibold h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating Forecast…
                  </>
                ) : (
                  <>
                    <Brain className="size-4 mr-2" />
                    Generate Power Forecast
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

        {/* Result panel */}
        <div className="xl:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {/* Error state */}
            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Alert className="border-red-400 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="size-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400 text-sm leading-relaxed">
                    {error}
                  </AlertDescription>
                </Alert>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Check that the FastAPI server is running, then try again.
                </p>
              </motion.div>
            )}

            {/* Loading state */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-2 border-blue-100 dark:border-blue-900/40">
                  <CardContent className="flex flex-col items-center justify-center py-14 gap-4">
                    <div className="size-16 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center">
                      <Loader2 className="size-8 text-blue-500 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">Generating forecast…</p>
                      <p className="text-sm text-gray-400 mt-1">Querying the RandomForest model</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success result */}
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Card className="border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-green-500" />
                  <CardHeader className="pb-2 pt-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Predicted Power Demand
                      </CardTitle>
                      <Badge
                        variant={getPowerBadgeVariant(result.predicted_power)}
                        className="text-xs"
                      >
                        {getPowerLabel(result.predicted_power)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-end gap-2">
                      <span className={`text-5xl font-black tabular-nums ${getPowerColor(result.predicted_power)}`}>
                        {result.predicted_power.toFixed(2)}
                      </span>
                      <span className="text-xl font-semibold text-gray-400 mb-1.5">{result.unit}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0 kW</span>
                        <span>100 kW</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((result.predicted_power / 100) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            result.predicted_power < 40
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : result.predicted_power < 70
                              ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                              : "bg-gradient-to-r from-orange-500 to-red-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">Model</p>
                        <p className="text-sm font-medium truncate">{result.model_type}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">Status</p>
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-green-500 flex-shrink-0" />
                          <p className="text-sm font-medium capitalize">{result.status}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 flex items-center justify-center">
                      <Zap className="size-7 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-300">No forecast yet</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-[200px]">
                        Fill in the parameters and click <strong>Generate Power Forecast</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info card */}
          <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                About this model
              </p>
              <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 space-y-1">
                <li>• Trained on campus historical power data</li>
                <li>• Uses time, weather, and occupancy features</li>
                <li>• Hour, day type, and month derived from forecast datetime</li>
                <li>• Output is instantaneous demand in kilowatts (kW)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
