import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { toast } from "sonner";
import { StaffDialog } from "../dialogs/StaffDialog";
import { RoomStaffAssignmentDialog } from "../dialogs/RoomStaffAssignmentDialog";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";

export const StaffSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
    { key: "hire_date", label: "Hire Date" },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: staffData, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch staff");
      console.error(error);
    } else {
      setData(staffData || []);
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

    const { error } = await supabase.from("staff").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete staff member");
      console.error(error);
    } else {
      toast.success("Staff member deleted successfully");
      fetchData();
    }
  };

  const handleAssignRoom = (item: any) => {
    setSelectedItem(item);
    setAssignmentDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage staff members and room assignments</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={(item) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAssignRoom(item)}
            className="ml-2"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign to Room
          </Button>
        )}
      />

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedItem}
        onSuccess={fetchData}
      />

      <RoomStaffAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        staff={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

