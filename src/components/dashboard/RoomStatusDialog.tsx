import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface RoomStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any | null;
  onSuccess: () => void;
}

export const RoomStatusDialog = ({ open, onOpenChange, room, onSuccess }: RoomStatusDialogProps) => {
  const [status, setStatus] = useState<string>("available");
  const [maintenanceUntil, setMaintenanceUntil] = useState<string>("");

  useEffect(() => {
    if (room) {
      setStatus(room.status || "available");
      setMaintenanceUntil(room.maintenance_until || "");
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room) return;

    const updateData: any = {
      status,
    };

    // Only set maintenance_until if status is maintenance
    if (status === "maintenance") {
      if (!maintenanceUntil) {
        toast.error("Please select maintenance end date");
        return;
      }
      updateData.maintenance_until = maintenanceUntil;
    } else {
      // Clear maintenance_until if not in maintenance
      updateData.maintenance_until = null;
    }

    const { error } = await supabase
      .from("room_types")
      .update(updateData)
      .eq("id", room.id);

    if (error) {
      toast.error("Failed to update room status");
      console.error(error);
    } else {
      toast.success("Room status updated successfully");
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Room Status - {room?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="status">Room Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "maintenance" && (
            <div>
              <Label htmlFor="maintenance_until">
                <Calendar className="inline h-4 w-4 mr-2" />
                Maintenance Until
              </Label>
              <Input
                id="maintenance_until"
                type="date"
                value={maintenanceUntil}
                onChange={(e) => setMaintenanceUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Room will be unavailable until this date
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Status:</strong> {room?.status || "available"}
            </p>
            {room?.maintenance_until && (
              <p className="text-sm text-blue-800">
                <strong>Maintenance Until:</strong> {new Date(room.maintenance_until).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Status</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

