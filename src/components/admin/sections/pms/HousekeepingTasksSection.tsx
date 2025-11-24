import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { HousekeepingTaskDialog } from "../../dialogs/pms/HousekeepingTaskDialog";
import { Badge } from "@/components/ui/badge";

export const HousekeepingTasksSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "room_number", label: "Room" },
    { key: "task_type", label: "Task Type" },
    { 
      key: "priority", 
      label: "Priority",
      render: (value: string) => {
        const colors: any = {
          low: "secondary",
          normal: "outline",
          high: "default",
          urgent: "destructive"
        };
        return <Badge variant={colors[value] || "outline"}>{value}</Badge>;
      }
    },
    { 
      key: "status", 
      label: "Status",
      render: (value: string) => {
        const colors: any = {
          pending: "outline",
          in_progress: "default",
          completed: "secondary",
          cancelled: "destructive"
        };
        return <Badge variant={colors[value] || "outline"}>{value}</Badge>;
      }
    },
    { key: "scheduled_time", label: "Scheduled", render: (value: string) => value ? new Date(value).toLocaleString() : "N/A" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: taskData, error } = await supabase
      .from("housekeeping_tasks")
      .select("*")
      .order("scheduled_time", { ascending: true });

    if (error) {
      toast.error("Failed to fetch housekeeping tasks");
      console.error(error);
    } else {
      setData(taskData || []);
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
    if (!confirm("Are you sure you want to delete this task?")) return;

    const { error } = await supabase.from("housekeeping_tasks").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      toast.success("Task deleted successfully");
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

      <HousekeepingTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

