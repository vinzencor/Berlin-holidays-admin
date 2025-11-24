import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { FrontDeskDialog } from "../../dialogs/pms/FrontDeskDialog";
import { Badge } from "@/components/ui/badge";

export const FrontDeskSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { 
      key: "operation_type", 
      label: "Operation",
      render: (value: string) => {
        const colors: any = {
          check_in: "default",
          check_out: "secondary",
          room_change: "outline",
          extension: "outline"
        };
        return <Badge variant={colors[value] || "outline"}>{value.replace('_', ' ')}</Badge>;
      }
    },
    { key: "performed_at", label: "Date/Time", render: (value: string) => new Date(value).toLocaleString() },
    { key: "previous_room", label: "Previous Room" },
    { key: "new_room", label: "New Room" },
    { key: "notes", label: "Notes" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: operationsData, error } = await supabase
      .from("front_desk_operations")
      .select("*")
      .order("performed_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch front desk operations");
      console.error(error);
    } else {
      setData(operationsData || []);
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
    if (!confirm("Are you sure you want to delete this operation record?")) return;

    const { error } = await supabase.from("front_desk_operations").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete operation");
      console.error(error);
    } else {
      toast.success("Operation deleted successfully");
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

      <FrontDeskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operation={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

