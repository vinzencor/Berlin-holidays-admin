import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HousekeepingTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
}

export const HousekeepingTaskDialog = ({ open, onOpenChange, task, onSuccess }: HousekeepingTaskDialogProps) => {
  const [formData, setFormData] = useState({
    room_number: "",
    task_type: "cleaning",
    priority: "normal",
    status: "pending",
    scheduled_time: "",
    completed_at: "",
    notes: "",
  });

  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .in("role", ["housekeeper", "maintenance"]);
    setStaff(data || []);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        room_number: task.room_number || "",
        task_type: task.task_type || "cleaning",
        priority: task.priority || "normal",
        status: task.status || "pending",
        scheduled_time: task.scheduled_time ? new Date(task.scheduled_time).toISOString().slice(0, 16) : "",
        completed_at: task.completed_at ? new Date(task.completed_at).toISOString().slice(0, 16) : "",
        notes: task.notes || "",
      });
      setSelectedStaffId(task.assigned_to || "");
    } else {
      setFormData({
        room_number: "",
        task_type: "cleaning",
        priority: "normal",
        status: "pending",
        scheduled_time: "",
        completed_at: "",
        notes: "",
      });
      setSelectedStaffId("");
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      assigned_to: selectedStaffId || null,
      scheduled_time: formData.scheduled_time || null,
      completed_at: formData.completed_at || null,
    };

    if (task) {
      const { error } = await supabase
        .from("housekeeping_tasks")
        .update(dataToSubmit)
        .eq("id", task.id);

      if (error) {
        toast.error("Failed to update task");
        console.error(error);
      } else {
        toast.success("Task updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("housekeeping_tasks").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create task");
        console.error(error);
      } else {
        toast.success("Task created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Housekeeping Task" : "Add New Housekeeping Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="room_number">Room Number *</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="task_type">Task Type *</Label>
              <Select value={formData.task_type} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_staff">Assign to Staff</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_time">Scheduled Time</Label>
              <Input
                id="scheduled_time"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="completed_at">Completed Time</Label>
              <Input
                id="completed_at"
                type="datetime-local"
                value={formData.completed_at}
                onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
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
              {task ? "Update" : "Create"} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

