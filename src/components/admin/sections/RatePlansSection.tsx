import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RatePlanDialog } from "../dialogs/RatePlanDialog";

export const RatePlansSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: ratePlans, error } = await supabase
      .from("rate_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch rate plans");
      console.error(error);
    } else {
      setData(ratePlans || []);
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
    if (!confirm("Are you sure you want to delete this rate plan?")) return;

    const { error } = await supabase
      .from("rate_plans")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete rate plan");
      console.error(error);
    } else {
      toast.success("Rate plan deleted successfully");
      fetchData();
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "discount_percentage",
      label: "Discount",
      render: (value: number) => (value ? `${value}%` : "-"),
    },
    {
      key: "min_nights",
      label: "Min Nights",
      render: (value: number) => value || "-",
    },
    {
      key: "valid_from",
      label: "Valid From",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      key: "valid_to",
      label: "Valid To",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "-",
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
        title="Rate Plans"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search rate plans..."
      />
      <RatePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

