import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RoomTypeDialog } from "../dialogs/RoomTypeDialog";

export const RoomTypesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: roomTypes, error } = await supabase
      .from("room_types")
      .select("*")
      .order("created_at", { ascending: false});

    if (error) {
      toast.error("Failed to fetch room types");
      console.error(error);
    } else {
      setData(roomTypes || []);
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
    if (!confirm("Are you sure you want to delete this room type?")) return;

    const { error } = await supabase
      .from("room_types")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete room type");
      console.error(error);
    } else {
      toast.success("Room type deleted successfully");
      fetchData();
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "category_label", label: "Category" },
    { key: "description", label: "Description" },
    { key: "capacity", label: "Capacity" },
    { key: "size", label: "Size" },
    {
      key: "base_price",
      label: "Base Price",
      render: (value: string) => `₹${parseFloat(value).toLocaleString()}`,
    },
    { key: "total_rooms", label: "Total Rooms" },
    { key: "bed_type", label: "Bed Type" },
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
        title="Room Types"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search room types..."
      />
      <RoomTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

