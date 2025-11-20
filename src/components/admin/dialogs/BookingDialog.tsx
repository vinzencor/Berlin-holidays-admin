import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const BookingDialog = ({ open, onOpenChange, item, onSuccess }: BookingDialogProps) => {
  const [formData, setFormData] = useState({
    room_name: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    check_in_date: "",
    check_out_date: "",
    number_of_rooms: "1",
    number_of_adults: "2",
    number_of_children: "0",
    total_amount: "",
    advance_payment: "",
    payment_status: "pending",
    status: "confirmed",
    booking_type: "online",
    special_requests: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        room_name: item.room_name || "",
        customer_name: item.customer_name || "",
        customer_email: item.customer_email || "",
        customer_phone: item.customer_phone || "",
        check_in_date: item.check_in_date || "",
        check_out_date: item.check_out_date || "",
        number_of_rooms: item.number_of_rooms?.toString() || "1",
        number_of_adults: item.number_of_adults?.toString() || "2",
        number_of_children: item.number_of_children?.toString() || "0",
        total_amount: item.total_amount || "",
        advance_payment: item.advance_payment || "",
        payment_status: item.payment_status || "pending",
        status: item.status || "confirmed",
        booking_type: item.booking_type || "online",
        special_requests: item.special_requests || "",
      });
    } else {
      setFormData({
        room_name: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        check_in_date: "",
        check_out_date: "",
        number_of_rooms: "1",
        number_of_adults: "2",
        number_of_children: "0",
        total_amount: "",
        advance_payment: "",
        payment_status: "pending",
        status: "confirmed",
        booking_type: "online",
        special_requests: "",
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      number_of_rooms: parseInt(formData.number_of_rooms),
      number_of_adults: parseInt(formData.number_of_adults),
      number_of_children: parseInt(formData.number_of_children),
      total_guests: parseInt(formData.number_of_adults) + parseInt(formData.number_of_children),
      remaining_amount: parseFloat(formData.total_amount) - parseFloat(formData.advance_payment || "0"),
    };

    const { error } = item
      ? await supabase.from("bookings").update(dataToSave).eq("id", item.id)
      : await supabase.from("bookings").insert([dataToSave]);

    if (error) {
      toast.error("Failed to save booking");
      console.error(error);
    } else {
      toast.success(`Booking ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="room_name">Room Name</Label>
              <Input
                id="room_name"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_date">Check-in Date</Label>
              <Input
                id="check_in_date"
                type="date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="check_out_date">Check-out Date</Label>
              <Input
                id="check_out_date"
                type="date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="number_of_rooms">Rooms</Label>
              <Input
                id="number_of_rooms"
                type="number"
                value={formData.number_of_rooms}
                onChange={(e) => setFormData({ ...formData, number_of_rooms: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="number_of_adults">Adults</Label>
              <Input
                id="number_of_adults"
                type="number"
                value={formData.number_of_adults}
                onChange={(e) => setFormData({ ...formData, number_of_adults: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="number_of_children">Children</Label>
              <Input
                id="number_of_children"
                type="number"
                value={formData.number_of_children}
                onChange={(e) => setFormData({ ...formData, number_of_children: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_amount">Total Amount (₹)</Label>
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
              <Label htmlFor="advance_payment">Advance Payment (₹)</Label>
              <Input
                id="advance_payment"
                type="number"
                step="0.01"
                value={formData.advance_payment}
                onChange={(e) => setFormData({ ...formData, advance_payment: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Booking Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booking_type">Booking Type</Label>
              <Select value={formData.booking_type} onValueChange={(value) => setFormData({ ...formData, booking_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="special_requests">Special Requests</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
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

