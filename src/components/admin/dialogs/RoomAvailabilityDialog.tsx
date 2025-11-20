import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RoomAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const RoomAvailabilityDialog = ({ open, onOpenChange, item, onSuccess }: RoomAvailabilityDialogProps) => {
  const [formData, setFormData] = useState({
    date: "",
    total_rooms: "1",
    available_rooms: "1",
    booked_rooms: "0",
    blocked_rooms: "0",
    minimum_stay: "1",
    status: "available",
    notes: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        date: item.date || "",
        total_rooms: item.total_rooms?.toString() || "1",
        available_rooms: item.available_rooms?.toString() || "1",
        booked_rooms: item.booked_rooms?.toString() || "0",
        blocked_rooms: item.blocked_rooms?.toString() || "0",
        minimum_stay: item.minimum_stay?.toString() || "1",
        status: item.status || "available",
        notes: item.notes || "",
      });
    } else {
      setFormData({
        date: "",
        total_rooms: "1",
        available_rooms: "1",
        booked_rooms: "0",
        blocked_rooms: "0",
        minimum_stay: "1",
        status: "available",
        notes: "",
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      total_rooms: parseInt(formData.total_rooms),
      available_rooms: parseInt(formData.available_rooms),
      booked_rooms: parseInt(formData.booked_rooms),
      blocked_rooms: parseInt(formData.blocked_rooms),
      minimum_stay: parseInt(formData.minimum_stay),
    };

    const { error } = item
      ? await supabase.from("room_availability").update(dataToSave).eq("id", item.id)
      : await supabase.from("room_availability").insert([dataToSave]);

    if (error) {
      toast.error("Failed to save room availability");
      console.error(error);
    } else {
      toast.success(`Room availability ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Room Availability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_rooms">Total Rooms</Label>
              <Input
                id="total_rooms"
                type="number"
                value={formData.total_rooms}
                onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="available_rooms">Available Rooms</Label>
              <Input
                id="available_rooms"
                type="number"
                value={formData.available_rooms}
                onChange={(e) => setFormData({ ...formData, available_rooms: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="booked_rooms">Booked Rooms</Label>
              <Input
                id="booked_rooms"
                type="number"
                value={formData.booked_rooms}
                onChange={(e) => setFormData({ ...formData, booked_rooms: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="blocked_rooms">Blocked Rooms</Label>
              <Input
                id="blocked_rooms"
                type="number"
                value={formData.blocked_rooms}
                onChange={(e) => setFormData({ ...formData, blocked_rooms: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minimum_stay">Minimum Stay (nights)</Label>
              <Input
                id="minimum_stay"
                type="number"
                value={formData.minimum_stay}
                onChange={(e) => setFormData({ ...formData, minimum_stay: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                </SelectContent>
              </Select>
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
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

