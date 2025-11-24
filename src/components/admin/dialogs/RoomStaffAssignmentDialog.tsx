import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface RoomStaffAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: any;
  onSuccess: () => void;
}

export const RoomStaffAssignmentDialog = ({ open, onOpenChange, staff, onSuccess }: RoomStaffAssignmentDialogProps) => {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    room_type_id: "",
    assignment_type: "primary",
    assigned_date: new Date().toISOString().split('T')[0],
    end_date: "",
    shift: "full_day",
    notes: "",
  });

  useEffect(() => {
    if (open && staff) {
      fetchRoomTypes();
      fetchAssignments();
    }
  }, [open, staff]);

  const fetchRoomTypes = async () => {
    const { data, error } = await supabase
      .from("room_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setRoomTypes(data);
    }
  };

  const fetchAssignments = async () => {
    if (!staff) return;

    const { data, error } = await supabase
      .from("room_staff_assignments")
      .select("*, room_types(name)")
      .eq("staff_id", staff.id)
      .order("assigned_date", { ascending: false });

    if (!error && data) {
      setAssignments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staff) return;

    const dataToSubmit = {
      ...formData,
      staff_id: staff.id,
      end_date: formData.end_date || null,
    };

    const { error } = await supabase
      .from("room_staff_assignments")
      .insert([dataToSubmit]);

    if (error) {
      toast.error("Failed to create assignment");
      console.error(error);
    } else {
      toast.success("Staff assigned to room successfully");
      setFormData({
        room_type_id: "",
        assignment_type: "primary",
        assigned_date: new Date().toISOString().split('T')[0],
        end_date: "",
        shift: "full_day",
        notes: "",
      });
      fetchAssignments();
      onSuccess();
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    const { error } = await supabase
      .from("room_staff_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Failed to delete assignment");
    } else {
      toast.success("Assignment removed successfully");
      fetchAssignments();
      onSuccess();
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Room Assignments for {staff.first_name} {staff.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No room assignments yet</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {assignment.room_types?.name || "Unknown Room"}
                        </span>
                        <Badge variant="outline">{assignment.assignment_type}</Badge>
                        <Badge variant="secondary">{assignment.shift}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        From: {assignment.assigned_date}
                        {assignment.end_date && ` - To: ${assignment.end_date}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Add New Assignment</h3>

            <div>
              <Label htmlFor="room_type_id">Room Type *</Label>
              <Select
                value={formData.room_type_id}
                onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignment_type">Assignment Type *</Label>
                <Select
                  value={formData.assignment_type}
                  onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shift">Shift *</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) => setFormData({ ...formData, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_date">Start Date *</Label>
                <Input
                  id="assigned_date"
                  type="date"
                  value={formData.assigned_date}
                  onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="submit">Add Assignment</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

