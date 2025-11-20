import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const RatePlanDialog = ({ open, onOpenChange, item, onSuccess }: RatePlanDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_percentage: "",
    min_nights: "",
    max_nights: "",
    valid_from: "",
    valid_to: "",
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        discount_percentage: item.discount_percentage || "",
        min_nights: item.min_nights || "",
        max_nights: item.max_nights || "",
        valid_from: item.valid_from || "",
        valid_to: item.valid_to || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        discount_percentage: "",
        min_nights: "",
        max_nights: "",
        valid_from: "",
        valid_to: "",
        is_active: true,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = item
      ? await supabase.from("rate_plans").update(formData).eq("id", item.id)
      : await supabase.from("rate_plans").insert([formData]);

    if (error) {
      toast.error("Failed to save rate plan");
      console.error(error);
    } else {
      toast.success(`Rate plan ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Rate Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="discount_percentage">Discount %</Label>
            <Input
              id="discount_percentage"
              type="number"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_nights">Min Nights</Label>
              <Input
                id="min_nights"
                type="number"
                value={formData.min_nights}
                onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_nights">Max Nights</Label>
              <Input
                id="max_nights"
                type="number"
                value={formData.max_nights}
                onChange={(e) => setFormData({ ...formData, max_nights: e.target.value })}
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

