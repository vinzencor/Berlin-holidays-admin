import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  check_in_date: string;
  check_out_date: string;
  room_name: string;
  room_number?: string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  payment_status: string;
  status: string;
  is_settled: boolean;
}

interface BookingCalendarViewProps {
  onBookingClick: (booking: Booking) => void;
}

export const BookingCalendarView = ({ onBookingClick }: BookingCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingDates, setBookingDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("check_in_date", { ascending: false });

      if (error) throw error;

      const formattedBookings = data?.map((booking: any) => ({
        ...booking,
        room_number: booking.room_name || "N/A"
      })) || [];

      setBookings(formattedBookings);

      // Extract all dates that have bookings
      const dates = formattedBookings.flatMap((booking: Booking) => {
        const checkIn = parseISO(booking.check_in_date);
        const checkOut = parseISO(booking.check_out_date);
        const dates = [];
        for (let d = new Date(checkIn); d <= checkOut; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        return dates;
      });
      setBookingDates(dates);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const checkIn = parseISO(booking.check_in_date);
      const checkOut = parseISO(booking.check_out_date);
      return date >= checkIn && date <= checkOut;
    });
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "checked-in":
        return "destructive";
      case "checked-out":
        return "secondary";
      case "cancelled":
        return "outline";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "secondary";
      case "partial":
        return "default";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              booked: bookingDates,
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "#fef3c7",
                fontWeight: "bold",
              },
            }}
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
              <span className="text-sm">Has Bookings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings for Selected Date */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            Bookings for {format(selectedDate, "MMMM dd, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : selectedDateBookings.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No bookings for this date
            </p>
          ) : (
            <div className="space-y-4">
              {selectedDateBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onBookingClick(booking)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {booking.customer_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer_phone}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                        {booking.is_settled && (
                          <Badge variant="secondary">Settled</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Room</p>
                        <p className="font-medium">{booking.room_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.room_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{booking.total_amount?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid: ₹{booking.paid_amount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">
                          {format(parseISO(booking.check_in_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-medium">
                          {format(parseISO(booking.check_out_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

