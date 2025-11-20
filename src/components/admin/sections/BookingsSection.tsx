import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookingDialog } from "../dialogs/BookingDialog";

export const BookingsSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false});

    if (error) {
      toast.error("Failed to fetch bookings");
      console.error(error);
    } else {
      setData(bookings || []);
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
    if (!confirm("Are you sure you want to delete this booking?")) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete booking");
      console.error(error);
    } else {
      toast.success("Booking deleted successfully");
      fetchData();
    }
  };

  const columns = [
    { key: "customer_name", label: "Customer" },
    { key: "customer_email", label: "Email" },
    { key: "customer_phone", label: "Phone" },
    { key: "room_name", label: "Room" },
    {
      key: "check_in_date",
      label: "Check-in",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "check_out_date",
      label: "Check-out",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    { key: "number_of_rooms", label: "Rooms" },
    { key: "total_guests", label: "Guests" },
    {
      key: "total_amount",
      label: "Amount",
      render: (value: number) => `₹${value?.toLocaleString() || 0}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => {
        const variants: any = {
          confirmed: "default",
          "checked-in": "destructive",
          "checked-out": "secondary",
          cancelled: "outline",
        };
        return (
          <Badge variant={variants[value] || "default"}>
            {value || "Confirmed"}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        title="Bookings"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search bookings..."
      />
      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

