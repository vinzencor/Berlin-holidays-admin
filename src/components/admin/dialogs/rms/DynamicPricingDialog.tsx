import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DynamicPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: any;
  onSuccess: () => void;
}

export const DynamicPricingDialog = ({ open, onOpenChange, rule, onSuccess }: DynamicPricingDialogProps) => {
  const [formData, setFormData] = useState({
    rule_name: "",
    occupancy_threshold: "0",
    price_adjustment_type: "percentage",
    price_adjustment_value: "0",
    priority: "1",
    is_active: true,
    valid_from: "",
    valid_to: "",
  });

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    const { data } = await supabase.from("room_types").select("id, name");
    setRoomTypes(data || []);
  };

  useEffect(() => {
    if (rule) {
      setFormData({
        rule_name: rule.rule_name || "",
        occupancy_threshold: rule.occupancy_threshold?.toString() || "0",
        price_adjustment_type: rule.price_adjustment_type || "percentage",
        price_adjustment_value: rule.price_adjustment_value?.toString() || "0",
        priority: rule.priority?.toString() || "1",
        is_active: rule.is_active ?? true,
        valid_from: rule.valid_from || "",
        valid_to: rule.valid_to || "",
      });
      setSelectedRoomTypeId(rule.room_type_id || "");
    } else {
      setFormData({
        rule_name: "",
        occupancy_threshold: "0",
        price_adjustment_type: "percentage",
        price_adjustment_value: "0",
        priority: "1",
        is_active: true,
        valid_from: "",
        valid_to: "",
      });
      setSelectedRoomTypeId("");
    }
  }, [rule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      occupancy_threshold: parseFloat(formData.occupancy_threshold) || 0,
      price_adjustment_value: parseFloat(formData.price_adjustment_value) || 0,
      priority: parseInt(formData.priority) || 1,
      room_type_id: selectedRoomTypeId || null,
    };

    if (rule) {
      const { error } = await supabase
        .from("dynamic_pricing_rules")
        .update(dataToSubmit)
        .eq("id", rule.id);

      if (error) {
        toast.error("Failed to update pricing rule");
        console.error(error);
      } else {
        toast.success("Pricing rule updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("dynamic_pricing_rules").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create pricing rule");
        console.error(error);
      } else {
        toast.success("Pricing rule created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Dynamic Pricing Rule" : "Add New Dynamic Pricing Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rule_name">Rule Name *</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="room_type">Room Type</Label>
            <Select value={selectedRoomTypeId} onValueChange={setSelectedRoomTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="All room types" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occupancy_threshold">Occupancy Threshold (%) *</Label>
              <Input
                id="occupancy_threshold"
                type="number"
                step="0.1"
                value={formData.occupancy_threshold}
                onChange={(e) => setFormData({ ...formData, occupancy_threshold: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_adjustment_type">Adjustment Type *</Label>
              <Select value={formData.price_adjustment_type} onValueChange={(value) => setFormData({ ...formData, price_adjustment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price_adjustment_value">Adjustment Value *</Label>
              <Input
                id="price_adjustment_value"
                type="number"
                step="0.01"
                value={formData.price_adjustment_value}
                onChange={(e) => setFormData({ ...formData, price_adjustment_value: e.target.value })}
                required
                placeholder={formData.price_adjustment_type === "percentage" ? "e.g., 10 for 10%" : "e.g., 500"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="valid_to">Valid To</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {rule ? "Update" : "Create"} Pricing Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

