import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FrontDeskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: any;
  onSuccess: () => void;
}

export const FrontDeskDialog = ({ open, onOpenChange, operation, onSuccess }: FrontDeskDialogProps) => {
  const [formData, setFormData] = useState({
    operation_type: "check_in",
    performed_at: new Date().toISOString().slice(0, 16),
    previous_room: "",
    new_room: "",
    notes: "",
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    fetchBookings();
    fetchStaff();
  }, []);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("id, customer_name").order("created_at", { ascending: false }).limit(50);
    setBookings(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, role, department")
      .eq("status", "active");
    setStaff(data || []);
  };

  useEffect(() => {
    if (operation) {
      setFormData({
        operation_type: operation.operation_type || "check_in",
        performed_at: operation.performed_at ? new Date(operation.performed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        previous_room: operation.previous_room || "",
        new_room: operation.new_room || "",
        notes: operation.notes || "",
      });
      setSelectedBookingId(operation.booking_id || "");
      setSelectedStaffId(operation.performed_by || "");
    } else {
      setFormData({
        operation_type: "check_in",
        performed_at: new Date().toISOString().slice(0, 16),
        previous_room: "",
        new_room: "",
        notes: "",
      });
      setSelectedBookingId("");
      setSelectedStaffId("");
    }
  }, [operation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      booking_id: selectedBookingId || null,
      performed_by: selectedStaffId || null,
      performed_at: formData.performed_at || null,
    };

    if (operation) {
      const { error } = await supabase
        .from("front_desk_operations")
        .update(dataToSubmit)
        .eq("id", operation.id);

      if (error) {
        toast.error("Failed to update operation");
        console.error(error);
      } else {
        toast.success("Operation updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("front_desk_operations").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create operation");
        console.error(error);
      } else {
        toast.success("Operation created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{operation ? "Edit Front Desk Operation" : "Add New Front Desk Operation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation_type">Operation Type *</Label>
              <Select value={formData.operation_type} onValueChange={(value) => setFormData({ ...formData, operation_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check_in">Check In</SelectItem>
                  <SelectItem value="check_out">Check Out</SelectItem>
                  <SelectItem value="room_change">Room Change</SelectItem>
                  <SelectItem value="extension">Extension</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="performed_at">Date/Time *</Label>
              <Input
                id="performed_at"
                type="datetime-local"
                value={formData.performed_at}
                onChange={(e) => setFormData({ ...formData, performed_at: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="booking">Booking</Label>
            <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking" />
              </SelectTrigger>
              <SelectContent>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="staff">Performed By</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="previous_room">Previous Room</Label>
              <Input
                id="previous_room"
                value={formData.previous_room}
                onChange={(e) => setFormData({ ...formData, previous_room: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new_room">New Room</Label>
              <Input
                id="new_room"
                value={formData.new_room}
                onChange={(e) => setFormData({ ...formData, new_room: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {operation ? "Update" : "Create"} Operation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

