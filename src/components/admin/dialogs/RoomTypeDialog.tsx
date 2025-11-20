import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RoomTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const RoomTypeDialog = ({ open, onOpenChange, item, onSuccess }: RoomTypeDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    capacity: "2",
    size: "",
    base_price: "",
    total_rooms: "1",
    bed_type: "",
    category_label: "",
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        slug: item.slug || "",
        description: item.description || "",
        capacity: item.capacity?.toString() || "2",
        size: item.size || "",
        base_price: item.base_price || "",
        total_rooms: item.total_rooms?.toString() || "1",
        bed_type: item.bed_type || "",
        category_label: item.category_label || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        capacity: "2",
        size: "",
        base_price: "",
        total_rooms: "1",
        bed_type: "",
        category_label: "",
        is_active: true,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      capacity: parseInt(formData.capacity),
      total_rooms: parseInt(formData.total_rooms),
    };

    const { error } = item
      ? await supabase.from("room_types").update(dataToSave).eq("id", item.id)
      : await supabase.from("room_types").insert([dataToSave]);

    if (error) {
      toast.error("Failed to save room type");
      console.error(error);
    } else {
      toast.success(`Room type ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Room Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setFormData({ ...formData, name, slug });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 400 sq ft"
              />
            </div>
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
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="base_price">Base Price (₹)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="bed_type">Bed Type</Label>
              <Input
                id="bed_type"
                value={formData.bed_type}
                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category_label">Category</Label>
              <Input
                id="category_label"
                value={formData.category_label}
                onChange={(e) => setFormData({ ...formData, category_label: e.target.value })}
              />
            </div>
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

