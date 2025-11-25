import { useState, useEffect } from "react";
import { BookingCalendarView } from "@/components/dashboard/BookingCalendarView";
import { BookingSettlementModal } from "@/components/dashboard/BookingSettlementModal";
import { CustomerDetailsDialog } from "@/components/dashboard/CustomerDetailsDialog";
import { RoomCardsGrid } from "@/components/dashboard/RoomCardsGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, Home, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

const NewDashboard = () => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("staff");

  // Statistics state
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    currentGuests: 0,
    availableRooms: 0,
  });

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("staff")
          .select("access_role")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setUserRole(data.access_role);
        }
      }
    };
    checkUserRole();
  }, []);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("*");

        if (bookingsError) throw bookingsError;

        // Get all room types
        const { data: roomTypes, error: roomTypesError } = await supabase
          .from("room_types")
          .select("total_rooms");

        if (roomTypesError) throw roomTypesError;

        // Calculate total bookings (active reservations - not cancelled or checked-out)
        const activeBookings = bookings?.filter(
          (b) => b.status !== "cancelled" && b.status !== "checked-out"
        ) || [];

        // Calculate total revenue (sum of paid_amount from all bookings)
        const totalRevenue = bookings?.reduce(
          (sum, b) => sum + (parseFloat(b.paid_amount) || 0),
          0
        ) || 0;

        // Calculate current guests (checked-in bookings)
        const checkedInBookings = bookings?.filter(
          (b) => b.status === "checked-in"
        ) || [];
        const currentGuests = checkedInBookings.reduce(
          (sum, b) => sum + (b.total_guests || 0),
          0
        );

        // Calculate available rooms
        const totalRooms = roomTypes?.reduce(
          (sum, rt) => sum + (rt.total_rooms || 0),
          0
        ) || 0;

        // Count booked rooms (active bookings)
        const bookedRooms = activeBookings.length;
        const availableRooms = totalRooms - bookedRooms;

        setStats({
          totalBookings: activeBookings.length,
          totalRevenue,
          currentGuests,
          availableRooms: Math.max(0, availableRooms),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    // Set up real-time subscription for bookings
    const subscription = supabase
      .channel("bookings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    // Super admin can view customer details, staff goes to settlement
    if (userRole === "super_admin") {
      setCustomerDetailsOpen(true);
    } else {
      setSettlementModalOpen(true);
    }
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);

    // If room is booked, show settlement modal with booking details
    if (room.status === "occupied" || room.status === "reserved") {
      if (room.current_booking) {
        // Convert room booking to Booking format for settlement modal
        const booking: Booking = {
          id: room.current_booking.id,
          customer_name: room.current_booking.customer_name,
          customer_email: "",
          customer_phone: "",
          check_in_date: room.current_booking.check_in_date,
          check_out_date: room.current_booking.check_out_date,
          room_name: room.room_types.name,
          room_number: room.room_number,
          total_amount: room.current_booking.total_amount,
          paid_amount: room.current_booking.paid_amount,
          discount_amount: 0,
          payment_status: room.current_booking.payment_status,
          status: "checked-in",
          is_settled: false,
        };
        setSelectedBooking(booking);
        setSettlementModalOpen(true);
      }
    }
    // If room is available, could open booking dialog (implement later)
  };

  const handleSettlementSuccess = () => {
    // Refresh the calendar view
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Berlin Holidays Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your bookings and reservations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Active reservations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentGuests}</div>
              <p className="text-xs text-muted-foreground">
                Currently checked in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableRooms}</div>
              <p className="text-xs text-muted-foreground">
                Ready for booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <BookingCalendarView onBookingClick={handleBookingClick} />

        {/* Room Cards Grid */}
        <RoomCardsGrid onRoomClick={handleRoomClick} />

        {/* Settlement Modal */}
        <BookingSettlementModal
          booking={selectedBooking}
          open={settlementModalOpen}
          onOpenChange={setSettlementModalOpen}
          onSuccess={handleSettlementSuccess}
        />

        {/* Customer Details Dialog (Super Admin Only) */}
        <CustomerDetailsDialog
          booking={selectedBooking}
          open={customerDetailsOpen}
          onOpenChange={setCustomerDetailsOpen}
        />
      </div>
    </div>
  );
};

export default NewDashboard;

