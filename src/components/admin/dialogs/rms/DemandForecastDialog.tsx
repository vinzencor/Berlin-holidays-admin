import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DemandForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecast: any;
  onSuccess: () => void;
}

export const DemandForecastDialog = ({ open, onOpenChange, forecast, onSuccess }: DemandForecastDialogProps) => {
  const [formData, setFormData] = useState({
    forecast_date: "",
    predicted_occupancy: "0",
    predicted_revenue: "0",
    confidence_level: "80",
    factors: "",
  });

  useEffect(() => {
    if (forecast) {
      setFormData({
        forecast_date: forecast.forecast_date || "",
        predicted_occupancy: forecast.predicted_occupancy?.toString() || "0",
        predicted_revenue: forecast.predicted_revenue?.toString() || "0",
        confidence_level: forecast.confidence_level?.toString() || "80",
        factors: forecast.factors || "",
      });
    } else {
      setFormData({
        forecast_date: "",
        predicted_occupancy: "0",
        predicted_revenue: "0",
        confidence_level: "80",
        factors: "",
      });
    }
  }, [forecast, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      predicted_occupancy: parseFloat(formData.predicted_occupancy) || 0,
      predicted_revenue: parseFloat(formData.predicted_revenue) || 0,
      confidence_level: parseFloat(formData.confidence_level) || 80,
    };

    if (forecast) {
      const { error } = await supabase
        .from("demand_forecasts")
        .update(dataToSubmit)
        .eq("id", forecast.id);

      if (error) {
        toast.error("Failed to update forecast");
        console.error(error);
      } else {
        toast.success("Forecast updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("demand_forecasts").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create forecast");
        console.error(error);
      } else {
        toast.success("Forecast created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{forecast ? "Edit Demand Forecast" : "Add New Demand Forecast"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="forecast_date">Forecast Date *</Label>
            <Input
              id="forecast_date"
              type="date"
              value={formData.forecast_date}
              onChange={(e) => setFormData({ ...formData, forecast_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="predicted_occupancy">Predicted Occupancy (%) *</Label>
              <Input
                id="predicted_occupancy"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.predicted_occupancy}
                onChange={(e) => setFormData({ ...formData, predicted_occupancy: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="predicted_revenue">Predicted Revenue (₹) *</Label>
              <Input
                id="predicted_revenue"
                type="number"
                step="0.01"
                value={formData.predicted_revenue}
                onChange={(e) => setFormData({ ...formData, predicted_revenue: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confidence_level">Confidence Level (%) *</Label>
            <Input
              id="confidence_level"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.confidence_level}
              onChange={(e) => setFormData({ ...formData, confidence_level: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="factors">Influencing Factors</Label>
            <Textarea
              id="factors"
              value={formData.factors}
              onChange={(e) => setFormData({ ...formData, factors: e.target.value })}
              rows={4}
              placeholder="e.g., Holiday season, local events, weather conditions, historical trends"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {forecast ? "Update" : "Create"} Forecast
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

