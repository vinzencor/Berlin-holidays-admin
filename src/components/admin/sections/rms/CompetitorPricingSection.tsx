import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { CompetitorPricingDialog } from "../../dialogs/rms/CompetitorPricingDialog";

export const CompetitorPricingSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "competitor_name", label: "Competitor" },
    { key: "competitor_location", label: "Location" },
    { key: "room_category", label: "Room Category" },
    { 
      key: "price", 
      label: "Price",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { key: "date_checked", label: "Date Checked" },
    { key: "source", label: "Source" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: competitorData, error } = await supabase
      .from("competitor_pricing")
      .select("*")
      .order("date_checked", { ascending: false });

    if (error) {
      toast.error("Failed to fetch competitor pricing");
      console.error(error);
    } else {
      setData(competitorData || []);
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
    if (!confirm(`Are you sure you want to delete pricing data for ${item.competitor_name}?`)) return;

    const { error } = await supabase.from("competitor_pricing").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete competitor pricing");
      console.error(error);
    } else {
      toast.success("Competitor pricing deleted successfully");
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

      <CompetitorPricingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competitor={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

