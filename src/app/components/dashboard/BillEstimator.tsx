import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Calculator,
  TrendingUp,
  Lightbulb,
  Zap,
  IndianRupee,
  BarChart3,
} from "lucide-react";

interface BillEstimatorProps {
  currentUsage: number;
}

export function BillEstimator({ currentUsage }: BillEstimatorProps) {
  const [monthlyUsage, setMonthlyUsage] = useState(currentUsage);
  const [rate, setRate] = useState(6.5);
  const [fixedCharges, setFixedCharges] = useState(50);

  const daysInMonth = 30;

  const calculateEnergyCost = (usage: number) => {
    let cost = 0;
    let remainingUsage = usage;

    // Tier 1: 0–100 kWh
    if (remainingUsage > 0) {
      const tier1 = Math.min(remainingUsage, 100);
      cost += tier1 * rate;
      remainingUsage -= tier1;
    }

    // Tier 2: 101–200 kWh
    if (remainingUsage > 0) {
      const tier2 = Math.min(remainingUsage, 100);
      cost += tier2 * (rate * 1.15);
      remainingUsage -= tier2;
    }

    // Tier 3: Above 200 kWh
    if (remainingUsage > 0) {
      cost += remainingUsage * (rate * 1.3);
    }

    return cost;
  };

  const calculateBill = (usage: number) => {
    return calculateEnergyCost(usage) + fixedCharges;
  };

  const totalBill = calculateBill(monthlyUsage);

  const dailyCost = totalBill / daysInMonth;
  const avgDailyUsage = monthlyUsage / daysInMonth;

  // Tier breakdown
  const tier1Usage = Math.min(monthlyUsage, 100);

  const tier2Usage =
    monthlyUsage > 100
      ? Math.min(monthlyUsage - 100, 100)
      : 0;

  const tier3Usage =
    monthlyUsage > 200
      ? monthlyUsage - 200
      : 0;

  const tier1Cost = tier1Usage * rate;
  const tier2Cost = tier2Usage * (rate * 1.15);
  const tier3Cost = tier3Usage * (rate * 1.3);

  // Usage scenarios
  const increasedUsage = monthlyUsage * 1.1;
  const reducedUsage = monthlyUsage * 0.9;

  const increasedBill = calculateBill(increasedUsage);
  const reducedBill = calculateBill(reducedUsage);

  const savingsWithReduction = totalBill - reducedBill;

  // Usage status
  let usageStatus = "Low";
  let usageMessage =
    "Your estimated consumption is currently within a lower usage range.";

  if (monthlyUsage >= 200 && monthlyUsage < 500) {
    usageStatus = "Moderate";
    usageMessage =
      "Your consumption is moderate. Reducing unnecessary usage can help lower your bill.";
  }

  if (monthlyUsage >= 500) {
    usageStatus = "High";
    usageMessage =
      "Your estimated consumption is high. Consider reviewing major appliances and peak usage periods.";
  }

  // Savings tips
  const savingsTips = [
    {
      tip: "Switch to LED bulbs",
      savings: "₹200–₹400/month",
    },
    {
      tip: "Use AC at 24°C instead of lower temperatures",
      savings: "₹300–₹600/month",
    },
    {
      tip: "Unplug devices when not in use",
      savings: "₹150–₹250/month",
    },
    {
      tip: "Use natural light during the day",
      savings: "₹100–₹200/month",
    },
    {
      tip: "Regularly clean AC filters",
      savings: "₹200–₹350/month",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Estimated Bill
            </p>

            <p className="text-2xl font-bold mt-2">
              ₹{totalBill.toFixed(2)}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              For the current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Daily Cost
            </p>

            <p className="text-2xl font-bold mt-2">
              ₹{dailyCost.toFixed(2)}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Average per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Daily Usage
            </p>

            <p className="text-2xl font-bold mt-2">
              {avgDailyUsage.toFixed(2)} kWh
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Average consumption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Usage Status
            </p>

            <p className="text-2xl font-bold mt-2">
              {usageStatus}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {monthlyUsage.toFixed(0)} kWh estimated usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5 text-blue-600" />
              Bill Calculator
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Monthly Usage */}
            <div className="space-y-3">
              <Label>Estimated Monthly Usage (kWh)</Label>

              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  value={monthlyUsage}
                  onChange={(e) =>
                    setMonthlyUsage(
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  className="flex-1"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthlyUsage(currentUsage)}
                >
                  Use Current
                </Button>
              </div>

              <Slider
                value={[monthlyUsage]}
                onValueChange={(value) =>
                  setMonthlyUsage(value[0])
                }
                max={1000}
                step={10}
              />
            </div>

            {/* Rate */}
            <div className="space-y-3">
              <Label>Base Rate per kWh (₹)</Label>

              <Input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) =>
                  setRate(Math.max(0, Number(e.target.value)))
                }
              />
            </div>

            {/* Fixed Charges */}
            <div className="space-y-3">
              <Label>Fixed Monthly Charges (₹)</Label>

              <Input
                type="number"
                value={fixedCharges}
                onChange={(e) =>
                  setFixedCharges(
                    Math.max(0, Number(e.target.value))
                  )
                }
              />
            </div>

            {/* Main Conclusion */}
            <div className="border-t pt-5">
              <div className="rounded-lg p-5 bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="size-5" />
                  <p className="text-sm text-muted-foreground">
                    Estimated Monthly Electricity Bill
                  </p>
                </div>

                <p className="text-4xl font-bold">
                  ₹{totalBill.toFixed(2)}
                </p>

                <p className="text-sm text-muted-foreground mt-3">
                  Based on {monthlyUsage.toFixed(0)} kWh estimated
                  monthly consumption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-purple-600" />
              Bill Cost Breakdown
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border">
              <div className="flex justify-between">
                <span>Tier 1</span>
                <span className="font-bold">
                  ₹{tier1Cost.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {tier1Usage.toFixed(0)} kWh × ₹{rate.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex justify-between">
                <span>Tier 2</span>
                <span className="font-bold">
                  ₹{tier2Cost.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {tier2Usage.toFixed(0)} kWh × ₹
                {(rate * 1.15).toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex justify-between">
                <span>Tier 3</span>
                <span className="font-bold">
                  ₹{tier3Cost.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {tier3Usage.toFixed(0)} kWh × ₹
                {(rate * 1.3).toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between">
                <span>Fixed Charges</span>

                <span className="font-bold">
                  ₹{fixedCharges.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Conclusion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-yellow-600" />
            Consumption Insight
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="font-medium">
            {usageStatus} Energy Consumption
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            {usageMessage}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost Projection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-purple-600" />
              Cost Projection & Usage Scenarios
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>Current monthly estimate</span>

              <span className="font-bold">
                ₹{totalBill.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>If usage increases by 10%</span>

              <span className="font-bold">
                ₹{increasedBill.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>If usage decreases by 10%</span>

              <span className="font-bold">
                ₹{reducedBill.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>Quarterly projection</span>

              <span className="font-bold">
                ₹{(totalBill * 3).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>Yearly projection</span>

              <span className="font-bold">
                ₹{(totalBill * 12).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Savings Conclusion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-600" />
              Potential Savings
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="p-5 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                By reducing your estimated energy consumption by 10%
              </p>

              <p className="text-3xl font-bold mt-3">
                ₹{savingsWithReduction.toFixed(2)}
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                Estimated monthly bill reduction
              </p>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Annual potential savings:{" "}
              <span className="font-bold">
                ₹{(savingsWithReduction * 12).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Saving Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-600" />
            Energy Saving Recommendations
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {savingsTips.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start p-4 rounded-lg border"
              >
                <p className="text-sm font-medium">
                  {item.tip}
                </p>

                <span className="text-sm font-bold ml-3 whitespace-nowrap">
                  {item.savings}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Potential Total Savings from Recommended Actions
            </p>

            <p className="text-2xl font-bold mt-2">
              ₹950 – ₹1,800/month
            </p>

            <p className="text-sm text-muted-foreground mt-2">
              Actual savings may vary depending on appliances,
              occupancy, weather, and consumption behaviour.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}