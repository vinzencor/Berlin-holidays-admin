import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PricingPlanDialog } from "../dialogs/PricingPlanDialog";

export const PricingPlansSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: pricingPlans, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch pricing plans");
      console.error(error);
    } else {
      setData(pricingPlans || []);
    }
    setIsLoading(false);
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
    if (!confirm("Are you sure you want to delete this pricing plan?")) return;

    const { error } = await supabase
      .from("pricing_plans")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete pricing plan");
      console.error(error);
    } else {
      toast.success("Pricing plan deleted successfully");
      fetchData();
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "duration", label: "Duration" },
    { key: "includes", label: "Includes" },
    {
      key: "price",
      label: "Price",
      render: (value: string) => value || "-",
    },
    {
      key: "is_active",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Pricing Plans"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search pricing plans..."
      />
      <PricingPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

