import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { GuestProfileDialog } from "../../dialogs/pms/GuestProfileDialog";
import { Badge } from "@/components/ui/badge";

export const GuestProfilesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "nationality", label: "Nationality" },
    { 
      key: "vip_status", 
      label: "VIP", 
      render: (value: boolean) => value ? <Badge variant="default">VIP</Badge> : <Badge variant="outline">Regular</Badge>
    },
    { key: "loyalty_points", label: "Points" },
    { key: "total_stays", label: "Stays" },
    { 
      key: "total_spent", 
      label: "Total Spent",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: guestData, error } = await supabase
      .from("guest_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch guest profiles");
      console.error(error);
    } else {
      setData(guestData || []);
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
    if (!confirm(`Are you sure you want to delete ${item.first_name} ${item.last_name}?`)) {
      return;
    }

    const { error } = await supabase.from("guest_profiles").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete guest profile");
      console.error(error);
    } else {
      toast.success("Guest profile deleted successfully");
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

      <GuestProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guest={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

