import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";

interface ExtendBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any | null;
  onSuccess: () => void;
}

export const ExtendBookingDialog = ({ open, onOpenChange, booking, onSuccess }: ExtendBookingDialogProps) => {
  const [newCheckoutDate, setNewCheckoutDate] = useState("");
  const [newCheckoutTime, setNewCheckoutTime] = useState("11:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      // Set default to current checkout date
      setNewCheckoutDate(booking.check_out_date);
      setNewCheckoutTime(booking.check_out_time || "11:00");
    }
  }, [booking]);

  const handleExtend = async () => {
    if (!booking) return;

    if (!newCheckoutDate) {
      toast.error("Please select a new checkout date");
      return;
    }

    // Validate that new checkout is after current checkout
    const currentCheckout = new Date(`${booking.check_out_date}T${booking.check_out_time || '11:00'}`);
    const newCheckout = new Date(`${newCheckoutDate}T${newCheckoutTime}`);

    if (newCheckout <= currentCheckout) {
      toast.error("New checkout time must be after the current checkout time");
      return;
    }

    setLoading(true);
    try {
      // Call the extend_booking function
      const { data, error } = await supabase.rpc('extend_booking', {
        booking_id: booking.id,
        new_checkout_date: newCheckoutDate,
        new_checkout_time: newCheckoutTime
      });

      if (error) throw error;

      if (data && !data.success) {
        toast.error(data.error || "Failed to extend booking");
        return;
      }

      toast.success("Booking extended successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error extending booking:", error);
      toast.error(error.message || "Failed to extend booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Extend Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Booking Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div>
              <p className="text-sm font-semibold">Customer</p>
              <p className="text-sm">{booking.customer_name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Room</p>
              <p className="text-sm">{booking.room_name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Current Checkout</p>
              <p className="text-sm">
                {new Date(booking.check_out_date).toLocaleDateString()} at {booking.check_out_time || "11:00"}
              </p>
            </div>
            {booking.extended_until && (
              <div>
                <p className="text-sm font-semibold text-orange-600">Currently Extended Until</p>
                <p className="text-sm text-orange-600">
                  {new Date(booking.extended_until).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* New Checkout Date */}
          <div className="space-y-2">
            <Label htmlFor="new_checkout_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              New Checkout Date
            </Label>
            <Input
              id="new_checkout_date"
              type="date"
              value={newCheckoutDate}
              onChange={(e) => setNewCheckoutDate(e.target.value)}
              min={booking.check_out_date}
            />
          </div>

          {/* New Checkout Time */}
          <div className="space-y-2">
            <Label htmlFor="new_checkout_time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              New Checkout Time
            </Label>
            <Input
              id="new_checkout_time"
              type="time"
              value={newCheckoutTime}
              onChange={(e) => setNewCheckoutTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExtend} disabled={loading}>
            {loading ? "Extending..." : "Extend Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

