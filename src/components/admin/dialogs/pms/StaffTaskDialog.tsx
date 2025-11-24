import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StaffTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
}

export const StaffTaskDialog = ({ open, onOpenChange, task, onSuccess }: StaffTaskDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_type: "general",
    priority: "normal",
    status: "pending",
    due_date: "",
    completed_at: "",
  });

  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, role")
      .eq("status", "active");
    setStaff(data || []);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        task_type: task.task_type || "general",
        priority: task.priority || "normal",
        status: task.status || "pending",
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
        completed_at: task.completed_at ? new Date(task.completed_at).toISOString().slice(0, 16) : "",
      });
      setSelectedStaffId(task.assigned_to || "");
    } else {
      setFormData({
        title: "",
        description: "",
        task_type: "general",
        priority: "normal",
        status: "pending",
        due_date: "",
        completed_at: "",
      });
      setSelectedStaffId("");
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      assigned_to: selectedStaffId || null,
      due_date: formData.due_date || null,
      completed_at: formData.completed_at || null,
    };

    if (task) {
      const { error } = await supabase
        .from("staff_tasks")
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
      const { error } = await supabase.from("staff_tasks").insert([dataToSubmit]);

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
          <DialogTitle>{task ? "Edit Staff Task" : "Add New Staff Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task_type">Task Type *</Label>
              <Select value={formData.task_type} onValueChange={(value) => setFormData({ ...formData, task_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="guest_service">Guest Service</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_staff">Assign to Staff *</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId} required>
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

          {formData.status === "completed" && (
            <div>
              <Label htmlFor="completed_at">Completed At</Label>
              <Input
                id="completed_at"
                type="datetime-local"
                value={formData.completed_at}
                onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
              />
            </div>
          )}

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

