import { useState } from "react";
import { motion } from "framer-motion";
import { RoomTypeWithBookings } from "@/types/room";
import { StatCard } from "@/components/dashboard/StatCard";
import { RoomCard } from "@/components/dashboard/RoomCard";
import { RoomListView } from "@/components/dashboard/RoomListView";
import { RoomDetailsDialog } from "@/components/dashboard/RoomDetailsDialog";
import { WalkInBookingDialog } from "@/components/dashboard/WalkInBookingDialog";
import { PaymentManagementDialog } from "@/components/dashboard/PaymentManagementDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRooms } from "@/hooks/useRooms";
import {
  Home,
  DoorOpen,
  Clock,
  CheckCircle,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";

const Index = () => {
  const { rooms, isLoading, error } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeWithBookings | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Debug: Log rooms data
  console.log('Dashboard - Rooms data:', rooms);

  // Calculate statistics from room types
  const totalRoomTypes = rooms.length; // Number of room types (3)
  const totalRooms = rooms.reduce((sum, rt) => sum + rt.total_rooms, 0); // Total individual rooms (20)
  const totalBooked = rooms.reduce((sum, rt) => sum + (rt.booked_count || 0), 0);
  const totalAvailable = totalRooms - totalBooked;

  // Count reserved vs occupied based on booking status
  const reservedRooms = rooms.reduce((sum, rt) => {
    const reserved = (rt.active_bookings || []).filter(b => b.status === 'confirmed');
    return sum + reserved.reduce((s, b) => s + (b.number_of_rooms || 0), 0);
  }, 0);

  const occupiedRooms = rooms.reduce((sum, rt) => {
    const occupied = (rt.active_bookings || []).filter(b => b.status === 'checked-in');
    return sum + occupied.reduce((s, b) => s + (b.number_of_rooms || 0), 0);
  }, 0);

  const handleViewDetails = (room: RoomTypeWithBookings) => {
    setSelectedRoom(room);
    setDetailsDialogOpen(true);
  };

  const handleWalkInBooking = (room: RoomTypeWithBookings) => {
    setSelectedRoom(room);
    setWalkInDialogOpen(true);
  };

  const handleManagePayment = (room: RoomTypeWithBookings) => {
    setSelectedRoom(room);
    setPaymentDialogOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Rooms</h2>
          <p className="text-muted-foreground">Please check your Supabase configuration</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-nature-forest via-nature-forest-light to-nature-earth bg-clip-text text-transparent">
                Berlin Holidays
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Resort Management Dashboard</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex gap-2 items-center"
            >
              {isLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <div className="text-sm text-muted-foreground">
                Real-time sync enabled
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics */}
        <section className="mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-semibold mb-6 flex items-center gap-2"
          >
            <Home className="h-6 w-6 text-primary" />
            Overview
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Room Types"
              value={totalRoomTypes}
              icon={Home}
              description={`${totalRooms} total rooms`}
              delay={0.1}
            />
            <StatCard
              title="Available"
              value={totalAvailable}
              icon={CheckCircle}
              description="Ready for booking"
              delay={0.2}
            />
            <StatCard
              title="Reserved"
              value={reservedRooms}
              icon={Clock}
              description="Online bookings"
              delay={0.3}
            />
            <StatCard
              title="Occupied"
              value={occupiedRooms}
              icon={DoorOpen}
              description="Currently in use"
              delay={0.4}
            />
          </div>
        </section>

        {/* Rooms Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-between mb-6"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Room Status
            </h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </motion.div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 bg-muted/50">
              <TabsTrigger value="all">All Room Types ({rooms.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rooms.map((room, index) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onWalkInBooking={handleWalkInBooking}
                    />
                  ))}
                </div>
              ) : (
                <RoomListView
                  rooms={rooms}
                  onViewDetails={handleViewDetails}
                  onWalkInBooking={handleWalkInBooking}
                />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <RoomDetailsDialog
        room={selectedRoom}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onManagePayment={handleManagePayment}
        onWalkInBooking={handleWalkInBooking}
      />

      <WalkInBookingDialog
        room={selectedRoom}
        open={walkInDialogOpen}
        onOpenChange={setWalkInDialogOpen}
      />

      <PaymentManagementDialog
        room={selectedRoom}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </div>
  );
};

export default Index;
