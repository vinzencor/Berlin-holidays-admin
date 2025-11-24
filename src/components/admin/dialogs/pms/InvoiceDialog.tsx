import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess: () => void;
}

export const InvoiceDialog = ({ open, onOpenChange, invoice, onSuccess }: InvoiceDialogProps) => {
  const [formData, setFormData] = useState({
    invoice_number: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    total_amount: "0",
    tax_amount: "0",
    discount_amount: "0",
    paid_amount: "0",
    payment_status: "unpaid",
    payment_method: "",
    notes: "",
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");

  useEffect(() => {
    fetchBookings();
    fetchGuests();
  }, []);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("id, customer_name").order("created_at", { ascending: false }).limit(50);
    setBookings(data || []);
  };

  const fetchGuests = async () => {
    const { data } = await supabase.from("guest_profiles").select("id, first_name, last_name").order("created_at", { ascending: false }).limit(50);
    setGuests(data || []);
  };

  useEffect(() => {
    if (invoice) {
      const balance = (parseFloat(invoice.total_amount) || 0) - (parseFloat(invoice.paid_amount) || 0);
      setFormData({
        invoice_number: invoice.invoice_number || "",
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || "",
        total_amount: invoice.total_amount?.toString() || "0",
        tax_amount: invoice.tax_amount?.toString() || "0",
        discount_amount: invoice.discount_amount?.toString() || "0",
        paid_amount: invoice.paid_amount?.toString() || "0",
        payment_status: invoice.payment_status || "unpaid",
        payment_method: invoice.payment_method || "",
        notes: invoice.notes || "",
      });
      setSelectedBookingId(invoice.booking_id || "");
      setSelectedGuestId(invoice.guest_profile_id || "");
    } else {
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: "",
        total_amount: "0",
        tax_amount: "0",
        discount_amount: "0",
        paid_amount: "0",
        payment_status: "unpaid",
        payment_method: "",
        notes: "",
      });
      setSelectedBookingId("");
      setSelectedGuestId("");
    }
  }, [invoice, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = parseFloat(formData.total_amount) || 0;
    const paidAmount = parseFloat(formData.paid_amount) || 0;
    const balance = totalAmount - paidAmount;

    const dataToSubmit = {
      ...formData,
      total_amount: totalAmount,
      tax_amount: parseFloat(formData.tax_amount) || 0,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      paid_amount: paidAmount,
      balance: balance,
      booking_id: selectedBookingId || null,
      guest_profile_id: selectedGuestId || null,
    };

    if (invoice) {
      const { error } = await supabase
        .from("invoices")
        .update(dataToSubmit)
        .eq("id", invoice.id);

      if (error) {
        toast.error("Failed to update invoice");
        console.error(error);
      } else {
        toast.success("Invoice updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("invoices").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create invoice");
        console.error(error);
      } else {
        toast.success("Invoice created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_status">Payment Status *</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="booking">Booking</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guest">Guest</Label>
              <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guest" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.first_name} {g.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_amount">Total Amount *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_amount">Discount Amount</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="paid_amount">Paid Amount</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              placeholder="e.g., Cash, Card, UPI"
            />
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
              {invoice ? "Update" : "Create"} Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

