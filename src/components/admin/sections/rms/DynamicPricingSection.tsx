import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { DynamicPricingDialog } from "../../dialogs/rms/DynamicPricingDialog";
import { Badge } from "@/components/ui/badge";

export const DynamicPricingSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "rule_name", label: "Rule Name" },
    { key: "occupancy_threshold", label: "Occupancy %", render: (value: number) => `${value}%` },
    { key: "price_adjustment_type", label: "Adjustment Type" },
    { 
      key: "price_adjustment_value", 
      label: "Adjustment Value",
      render: (value: number, row: any) => 
        row.price_adjustment_type === 'percentage' ? `${value}%` : `₹${value}`
    },
    { key: "priority", label: "Priority" },
    { 
      key: "is_active", 
      label: "Status",
      render: (value: boolean) => value ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>
    },
    { key: "valid_from", label: "Valid From" },
    { key: "valid_to", label: "Valid To" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: pricingData, error } = await supabase
      .from("dynamic_pricing_rules")
      .select("*")
      .order("priority", { ascending: false });

    if (error) {
      toast.error("Failed to fetch pricing rules");
      console.error(error);
    } else {
      setData(pricingData || []);
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
    if (!confirm(`Are you sure you want to delete the rule "${item.rule_name}"?`)) return;

    const { error } = await supabase.from("dynamic_pricing_rules").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete pricing rule");
      console.error(error);
    } else {
      toast.success("Pricing rule deleted successfully");
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

      <DynamicPricingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

