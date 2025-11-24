import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  customer_name: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
}

export const BookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Get first and last day of current month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Fetch bookings for the month
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .gte("check_in_date", firstDay.toISOString().split('T')[0])
      .lte("check_in_date", lastDay.toISOString().split('T')[0])
      .order("check_in_date", { ascending: true });

    if (bookingError) {
      toast.error("Failed to fetch bookings");
      console.error(bookingError);
    } else {
      setBookings(bookingData || []);
    }

    // Fetch availability for the month
    const { data: availData, error: availError } = await supabase
      .from("room_availability")
      .select("*, room_types(name)")
      .gte("date", firstDay.toISOString().split('T')[0])
      .lte("date", lastDay.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (availError) {
      toast.error("Failed to fetch availability");
      console.error(availError);
    } else {
      setAvailability(availData || []);
    }

    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getBookingsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    return bookings.filter(booking => {
      const checkIn = booking.check_in_date;
      const checkOut = booking.check_out_date;
      return dateStr >= checkIn && dateStr <= checkOut;
    });
  };

  const getAvailabilityForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    return availability.filter(avail => avail.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = getDaysInMonth();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Booking Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2 border-b">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-[100px] border rounded-lg bg-gray-50" />;
              }

              const dayBookings = getBookingsForDate(day);
              const dayAvailability = getAvailabilityForDate(day);
              const totalAvailable = dayAvailability.reduce((sum, a) => sum + (a.available_rooms || 0), 0);
              const totalBooked = dayAvailability.reduce((sum, a) => sum + (a.booked_rooms || 0), 0);

              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border rounded-lg p-2 ${
                    isToday ? "bg-blue-50 border-blue-300" : "bg-white"
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="font-semibold text-sm mb-1">{day}</div>

                  {/* Availability summary */}
                  {dayAvailability.length > 0 && (
                    <div className="text-xs mb-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Available:</span>
                        <Badge variant="secondary" className="text-xs">{totalAvailable}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600">Booked:</span>
                        <Badge variant="destructive" className="text-xs">{totalBooked}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Bookings */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map(booking => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 rounded bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200"
                      >
                        <div className="font-semibold truncate">{booking.customer_name}</div>
                        <div className="text-gray-600 truncate">{booking.room_name}</div>
                        <Badge
                          variant={
                            booking.status === "confirmed" ? "default" :
                            booking.status === "checked_in" ? "secondary" :
                            booking.status === "cancelled" ? "destructive" : "outline"
                          }
                          className="text-xs mt-1"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

