import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Reference {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  commission_percentage: number;
  notes: string;
  is_active: boolean;
}

interface ReferenceDialogProps {
  open: boolean;
  onClose: () => void;
  reference: Reference | null;
}

export default function ReferenceDialog({ open, onClose, reference }: ReferenceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pin_code: "",
    commission_percentage: "0",
    notes: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reference) {
      setFormData({
        name: reference.name || "",
        contact_person: reference.contact_person || "",
        phone: reference.phone || "",
        email: reference.email || "",
        address: reference.address || "",
        city: reference.city || "",
        state: reference.state || "",
        country: reference.country || "",
        pin_code: reference.pin_code || "",
        commission_percentage: reference.commission_percentage?.toString() || "0",
        notes: reference.notes || "",
        is_active: reference.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "",
        pin_code: "",
        commission_percentage: "0",
        notes: "",
        is_active: true,
      });
    }
  }, [reference, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name) {
        toast.error("Reference name is required");
        setIsSubmitting(false);
        return;
      }

      const dataToSave = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        pin_code: formData.pin_code || null,
        commission_percentage: parseFloat(formData.commission_percentage) || 0,
        notes: formData.notes || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (reference) {
        // Update existing reference
        const { error } = await supabase
          .from("booking_references")
          .update(dataToSave)
          .eq("id", reference.id);

        if (error) throw error;
        toast.success("Reference updated successfully");
      } else {
        // Create new reference
        const { error } = await supabase
          .from("booking_references")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Reference created successfully");
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving reference:", error);
      toast.error("Failed to save reference: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006938]">
            {reference ? "Edit Reference" : "Add New Reference"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Reference Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ABC Travels"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="commission_percentage">Commission Percentage (%)</Label>
              <Input
                id="commission_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_percentage}
                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Address Information</h3>

            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="pin_code">Pin Code</Label>
                <Input
                  id="pin_code"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  placeholder="Pin code"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Additional Information</h3>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#006938] hover:bg-[#005030]" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : reference ? "Update Reference" : "Create Reference"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

