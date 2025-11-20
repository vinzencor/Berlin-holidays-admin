import { useState, useEffect } from "react";
import { RoomWithBooking, BookingStatus, PaymentStatus } from "@/types/room";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUpdateBooking } from "@/hooks/useRooms";
import { DollarSign, CreditCard, User, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentManagementDialogProps {
  room: RoomWithBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentManagementDialog = ({ room, open, onOpenChange }: PaymentManagementDialogProps) => {
  const [additionalPayment, setAdditionalPayment] = useState("");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("checked-in");
  
  const updateBooking = useUpdateBooking();

  useEffect(() => {
    if (room?.current_booking) {
      setBookingStatus(room.current_booking.booking_status);
    }
  }, [room]);

  if (!room || !room.current_booking) return null;

  const booking = room.current_booking;
  const currentAdvance = booking.advance_payment;
  const totalAmount = booking.total_amount;
  const remainingAmount = booking.remaining_amount;

  const handlePaymentUpdate = async () => {
    const payment = parseFloat(additionalPayment);
    
    if (isNaN(payment) || payment <= 0) {
      return;
    }

    const newAdvancePayment = currentAdvance + payment;
    const newPaymentStatus: PaymentStatus = newAdvancePayment >= totalAmount ? 'full' : 'advance';

    await updateBooking.mutateAsync({
      id: booking.id,
      advance_payment: newAdvancePayment,
      payment_status: newPaymentStatus,
    });

    setAdditionalPayment("");
  };

  const handleStatusUpdate = async () => {
    await updateBooking.mutateAsync({
      id: booking.id,
      booking_status: bookingStatus,
    });
  };

  const handleCheckout = async () => {
    // Check if payment is complete
    if (booking.payment_status !== 'full') {
      // Optionally, you can show a warning or prevent checkout
      const confirmCheckout = window.confirm(
        `Remaining amount: €${remainingAmount.toFixed(2)}. Proceed with checkout?`
      );
      if (!confirmCheckout) return;
    }

    await updateBooking.mutateAsync({
      id: booking.id,
      booking_status: 'checked-out',
    });

    onOpenChange(false);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-500';
      case 'checked-in': return 'bg-red-500';
      case 'checked-out': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    return status === 'full' ? 'bg-green-500' : 'bg-yellow-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{room.name}</DialogTitle>
            <Badge className={`${getStatusColor(booking.booking_status)} text-white`}>
              {booking.booking_status}
            </Badge>
          </div>
          <DialogDescription className="capitalize">
            {room.type} - {booking.booking_type} Booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest Information */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Guest Information
            </h4>
            <div className="pl-6 space-y-1">
              <p className="text-sm"><span className="font-medium">Name:</span> {booking.guest_name}</p>
              {booking.guest_email && (
                <p className="text-sm"><span className="font-medium">Email:</span> {booking.guest_email}</p>
              )}
              {booking.guest_phone && (
                <p className="text-sm"><span className="font-medium">Phone:</span> {booking.guest_phone}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Booking Dates */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Period
            </h4>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Check-in</p>
                <p className="text-sm font-medium">
                  {new Date(booking.check_in_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check-out</p>
                <p className="text-sm font-medium">
                  {new Date(booking.check_out_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Details
            </h4>
            <div className="pl-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount:</span>
                <span className="text-sm font-semibold">€{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid Amount:</span>
                <span className="text-sm font-semibold text-green-600">€{currentAdvance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Remaining:</span>
                <span className="text-sm font-semibold text-red-600">€{remainingAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">Payment Status:</span>
                <Badge className={`${getPaymentStatusColor(booking.payment_status)} text-white`}>
                  {booking.payment_status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Add Payment */}
          {booking.payment_status !== 'full' && booking.booking_status !== 'checked-out' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Add Payment
              </h4>
              <div className="pl-6 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={additionalPayment}
                      onChange={(e) => setAdditionalPayment(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <Button
                    onClick={handlePaymentUpdate}
                    disabled={updateBooking.isPending || !additionalPayment}
                  >
                    Add Payment
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quick fill:
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setAdditionalPayment(remainingAmount.toString())}
                  >
                    Full remaining (€{remainingAmount.toFixed(2)})
                  </Button>
                </p>
              </div>
            </div>
          )}

          {/* Update Booking Status */}
          {booking.booking_status !== 'checked-out' && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Update Booking Status</h4>
                <div className="pl-6 space-y-2">
                  <Select value={bookingStatus} onValueChange={(value) => setBookingStatus(value as BookingStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked-in">Checked In</SelectItem>
                      <SelectItem value="checked-out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updateBooking.isPending || bookingStatus === booking.booking_status}
                    className="w-full"
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {booking.booking_status !== 'checked-out' && (
            <Button
              onClick={handleCheckout}
              disabled={updateBooking.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Checkout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

