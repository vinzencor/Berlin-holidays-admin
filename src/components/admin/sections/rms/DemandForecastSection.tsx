import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { DemandForecastDialog } from "../../dialogs/rms/DemandForecastDialog";
import { Badge } from "@/components/ui/badge";

export const DemandForecastSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "forecast_date", label: "Date" },
    { key: "predicted_occupancy", label: "Predicted Occupancy", render: (value: number) => `${value}%` },
    { 
      key: "predicted_revenue", 
      label: "Predicted Revenue",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: "confidence_level", 
      label: "Confidence",
      render: (value: number) => {
        const level = value >= 80 ? "secondary" : value >= 60 ? "default" : "outline";
        return <Badge variant={level}>{value}%</Badge>;
      }
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: forecastData, error } = await supabase
      .from("demand_forecasts")
      .select("*")
      .order("forecast_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch demand forecasts");
      console.error(error);
    } else {
      setData(forecastData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete forecast for ${item.forecast_date}?`)) return;

    const { error } = await supabase.from("demand_forecasts").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete forecast");
      console.error(error);
    } else {
      toast.success("Forecast deleted successfully");
      fetchData();
    }
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DemandForecastDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        forecast={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

