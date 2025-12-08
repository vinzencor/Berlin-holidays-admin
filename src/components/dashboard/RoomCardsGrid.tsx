import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Bed } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { RoomStatusDialog } from "./RoomStatusDialog";

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  capacity: number;
  images: string[] | null;
  description: string | null;
  amenities: string[] | null;
  bed_type: string | null;
  size: string | null;
  status: string;
  maintenance_until: string | null;
}

interface RoomCardsGridProps {
  onRoomClick?: (room: RoomType) => void;
}

export const RoomCardsGrid = ({ onRoomClick }: RoomCardsGridProps) => {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();

    // Set up real-time subscription
    const subscription = supabase
      .channel("room_types_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_types" },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      // Fetch all room types - each represents one room
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from("room_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (roomTypesError) throw roomTypesError;

      setRooms(roomTypesData || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-500 hover:shadow-green-200";
      case "booked":
        return "bg-yellow-100 border-yellow-500 hover:shadow-yellow-200";
      case "maintenance":
        return "bg-red-100 border-red-500 hover:shadow-red-200";
      default:
        return "bg-gray-100 border-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-600">Available</Badge>;
      case "booked":
        return <Badge className="bg-yellow-600">Booked</Badge>;
      case "maintenance":
        return <Badge className="bg-red-600">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter rooms based on selected status
  const filteredRooms = statusFilter
    ? rooms.filter((room) => (room.status || "available") === statusFilter)
    : rooms;

  // Count rooms by status
  const statusCounts = {
    available: rooms.filter((r) => (r.status || "available") === "available").length,
    booked: rooms.filter((r) => r.status === "booked").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Rooms</h2>
        <div className="flex gap-2">
          <Badge
            className={`cursor-pointer transition-all ${
              statusFilter === "available"
                ? "bg-green-700 ring-2 ring-green-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={() => setStatusFilter(statusFilter === "available" ? null : "available")}
          >
            Available ({statusCounts.available})
          </Badge>
          <Badge
            className={`cursor-pointer transition-all ${
              statusFilter === "booked"
                ? "bg-yellow-700 ring-2 ring-yellow-400"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
            onClick={() => setStatusFilter(statusFilter === "booked" ? null : "booked")}
          >
            Booked ({statusCounts.booked})
          </Badge>
          <Badge
            className={`cursor-pointer transition-all ${
              statusFilter === "maintenance"
                ? "bg-red-700 ring-2 ring-red-400"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={() => setStatusFilter(statusFilter === "maintenance" ? null : "maintenance")}
          >
            Maintenance ({statusCounts.maintenance})
          </Badge>
        </div>
      </div>

      {statusFilter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filteredRooms.length} {statusFilter} room{filteredRooms.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setStatusFilter(null)}
            className="text-primary hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 border-2 ${getStatusColor(
                room.status || "available"
              )} hover:shadow-lg`}
              onClick={() => {
                setSelectedRoom(room);
                setStatusDialogOpen(true);
              }}
            >
              <CardContent className="p-4">
                {/* Room Image */}
                {room.images && room.images.length > 0 ? (
                  <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(room.status || "available")}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-40 mb-3 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                    <Home className="h-16 w-16 text-gray-400" />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(room.status || "available")}
                    </div>
                  </div>
                )}

                {/* Room Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{room.name}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{room.capacity || 2}</span>
                    </div>
                    {room.bed_type && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{room.bed_type}</span>
                      </div>
                    )}
                  </div>

                  {room.size && (
                    <p className="text-sm text-muted-foreground">
                      Size: {room.size}
                    </p>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-lg font-bold text-[#006938]">
                      ₹{Number(room.base_price).toLocaleString('en-IN')}/night
                    </p>
                  </div>

                  {/* Maintenance Info */}
                  {room.status === "maintenance" && room.maintenance_until && (
                    <div className="pt-2 border-t bg-red-50 -mx-4 -mb-4 p-3 mt-3">
                      <p className="text-xs font-semibold text-red-800">
                        Under Maintenance
                      </p>
                      <p className="text-xs text-red-700">
                        Until: {new Date(room.maintenance_until).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {statusFilter
              ? `No ${statusFilter} rooms found`
              : "No rooms found"}
          </p>
        </div>
      )}

      <RoomStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        room={selectedRoom}
        onSuccess={fetchRooms}
      />
    </div>
  );
};

