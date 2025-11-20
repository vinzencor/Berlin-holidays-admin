import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RoomAvailabilityDialog } from "../dialogs/RoomAvailabilityDialog";

export const RoomAvailabilitySection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: availability, error } = await supabase
      .from("room_availability")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch room availability");
      console.error(error);
    } else {
      setData(availability || []);
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
    if (!confirm("Are you sure you want to delete this availability record?")) return;

    const { error } = await supabase
      .from("room_availability")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete availability record");
      console.error(error);
    } else {
      toast.success("Availability record deleted successfully");
      fetchData();
    }
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    { key: "total_rooms", label: "Total Rooms" },
    { key: "available_rooms", label: "Available" },
    { key: "booked_rooms", label: "Booked" },
    { key: "blocked_rooms", label: "Blocked" },
    { key: "minimum_stay", label: "Min Stay" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === "available" ? "default" : "secondary"}>
          {value || "Available"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Room Availability"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search availability..."
      />
      <RoomAvailabilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

