import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PricingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const PricingPlanDialog = ({ open, onOpenChange, item, onSuccess }: PricingPlanDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    weekend_price: "",
    holiday_price: "",
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        base_price: item.base_price || "",
        weekend_price: item.weekend_price || "",
        holiday_price: item.holiday_price || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        base_price: "",
        weekend_price: "",
        holiday_price: "",
        is_active: true,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = item
      ? await supabase.from("pricing_plans").update(formData).eq("id", item.id)
      : await supabase.from("pricing_plans").insert([formData]);

    if (error) {
      toast.error("Failed to save pricing plan");
      console.error(error);
    } else {
      toast.success(`Pricing plan ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Pricing Plan</DialogTitle>
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
            <Label htmlFor="base_price">Base Price</Label>
            <Input
              id="base_price"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="weekend_price">Weekend Price</Label>
            <Input
              id="weekend_price"
              type="number"
              value={formData.weekend_price}
              onChange={(e) => setFormData({ ...formData, weekend_price: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="holiday_price">Holiday Price</Label>
            <Input
              id="holiday_price"
              type="number"
              value={formData.holiday_price}
              onChange={(e) => setFormData({ ...formData, holiday_price: e.target.value })}
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

