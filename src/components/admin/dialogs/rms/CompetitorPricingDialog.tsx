import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CompetitorPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: any;
  onSuccess: () => void;
}

export const CompetitorPricingDialog = ({ open, onOpenChange, competitor, onSuccess }: CompetitorPricingDialogProps) => {
  const [formData, setFormData] = useState({
    competitor_name: "",
    competitor_location: "",
    room_category: "",
    price: "0",
    date_checked: new Date().toISOString().split('T')[0],
    source: "manual",
    url: "",
    notes: "",
  });

  useEffect(() => {
    if (competitor) {
      setFormData({
        competitor_name: competitor.competitor_name || "",
        competitor_location: competitor.competitor_location || "",
        room_category: competitor.room_category || "",
        price: competitor.price?.toString() || "0",
        date_checked: competitor.date_checked || new Date().toISOString().split('T')[0],
        source: competitor.source || "manual",
        url: competitor.url || "",
        notes: competitor.notes || "",
      });
    } else {
      setFormData({
        competitor_name: "",
        competitor_location: "",
        room_category: "",
        price: "0",
        date_checked: new Date().toISOString().split('T')[0],
        source: "manual",
        url: "",
        notes: "",
      });
    }
  }, [competitor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      price: parseFloat(formData.price) || 0,
    };

    if (competitor) {
      const { error } = await supabase
        .from("competitor_pricing")
        .update(dataToSubmit)
        .eq("id", competitor.id);

      if (error) {
        toast.error("Failed to update competitor pricing");
        console.error(error);
      } else {
        toast.success("Competitor pricing updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("competitor_pricing").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create competitor pricing");
        console.error(error);
      } else {
        toast.success("Competitor pricing created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{competitor ? "Edit Competitor Pricing" : "Add New Competitor Pricing"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="competitor_name">Competitor Name *</Label>
              <Input
                id="competitor_name"
                value={formData.competitor_name}
                onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="competitor_location">Location *</Label>
              <Input
                id="competitor_location"
                value={formData.competitor_location}
                onChange={(e) => setFormData({ ...formData, competitor_location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="room_category">Room Category *</Label>
              <Input
                id="room_category"
                value={formData.room_category}
                onChange={(e) => setFormData({ ...formData, room_category: e.target.value })}
                required
                placeholder="e.g., Deluxe, Suite, Standard"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_checked">Date Checked *</Label>
              <Input
                id="date_checked"
                type="date"
                value={formData.date_checked}
                onChange={(e) => setFormData({ ...formData, date_checked: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="web_scraping">Web Scraping</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://competitor-website.com"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional information about the pricing..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {competitor ? "Update" : "Create"} Competitor Pricing
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

