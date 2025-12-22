// import { motion } from "framer-motion";
// import { RoomTypeWithBookings } from "@/types/room";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Home, User, Calendar, DollarSign, Users } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface RoomCardProps {
//   room: RoomTypeWithBookings;
//   index: number;
//   onViewDetails: (room: RoomTypeWithBookings) => void;
//   onWalkInBooking?: (room: RoomTypeWithBookings) => void;
// }

// export const RoomCard = ({ room, index, onViewDetails, onWalkInBooking }: RoomCardProps) => {
//   const bookedCount = room.booked_count || 0;
//   const availableCount = room.available_count || room.total_rooms;
//   const totalRooms = room.total_rooms;

//   // Determine status based on availability
//   const getStatus = () => {
//     if (bookedCount === 0) return 'available';
//     if (availableCount === 0) return 'occupied';
//     return 'reserved';
//   };

//   const status = getStatus();

//   const statusConfig = {
//     available: {
//       color: "bg-green-500",
//       label: "Available",
//       bgClass: "bg-green-50 border-green-200",
//     },
//     reserved: {
//       color: "bg-yellow-500",
//       label: "Partially Booked",
//       bgClass: "bg-yellow-50 border-yellow-200",
//     },
//     occupied: {
//       color: "bg-red-500",
//       label: "Fully Booked",
//       bgClass: "bg-red-50 border-red-200",
//     },
//   };

//   const config = statusConfig[status];
//   const activeBookings = room.active_bookings || [];

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{
//         duration: 0.3,
//         delay: index * 0.05,
//         ease: "easeOut",
//       }}
//       whileHover={{ scale: 1.03, y: -5 }}
//       whileTap={{ scale: 0.98 }}
//     >
//       <Card
//         className={cn(
//           "relative overflow-hidden border-2 transition-all duration-300 cursor-pointer",
//           config.bgClass
//         )}
//         onClick={() => onViewDetails(room)}
//       >
//         <div className={cn("absolute top-0 left-0 right-0 h-1", config.color)} />
        
//         <CardContent className="p-4">
//           <div className="flex items-start justify-between mb-3">
//             <div className="flex items-center gap-2">
//               <div className={cn("p-2 rounded-lg", config.color, "bg-opacity-20")}>
//                 <Home className="h-4 w-4 text-foreground" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-foreground">{room.name}</h3>
//                 <p className="text-xs text-muted-foreground capitalize">{room.category_label || 'Room Type'}</p>
//               </div>
//             </div>
//             <Badge
//               variant="secondary"
//               className={cn("text-xs font-medium", config.color, "text-white")}
//             >
//               {config.label}
//             </Badge>
//           </div>

//           {/* Room Availability Info */}
//           <div className="space-y-2 mb-3">
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Total Rooms:</span>
//               <span className="font-semibold">{totalRooms}</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Available:</span>
//               <span className="font-semibold text-green-600">{availableCount}</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Booked:</span>
//               <span className="font-semibold text-red-600">{bookedCount}</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Rate:</span>
//               <span className="font-semibold text-primary">₹{parseFloat(room.base_price).toLocaleString()}/night</span>
//             </div>
//           </div>

//           {activeBookings.length > 0 && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               className="space-y-2 mt-3 pt-3 border-t border-border/50"
//             >
//               <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
//                 <Users className="h-3 w-3" />
//                 <span>Active Bookings ({activeBookings.length})</span>
//               </div>
//               {activeBookings.slice(0, 2).map((booking, idx) => (
//                 <div key={booking.id} className="text-xs space-y-1 bg-background/50 p-2 rounded">
//                   <div className="flex items-center gap-2">
//                     <User className="h-3 w-3 text-muted-foreground" />
//                     <span className="text-foreground font-medium">{booking.customer_name}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                     <Calendar className="h-3 w-3" />
//                     <span>
//                       {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                     <span className="font-medium">{booking.number_of_rooms || 1} room(s)</span>
//                     <span>•</span>
//                     <span>₹{booking.total_amount?.toLocaleString() || 'N/A'}</span>
//                   </div>
//                   <Badge className={cn("text-xs w-fit", booking.status === 'confirmed' ? 'bg-yellow-500' : 'bg-red-500', 'text-white')}>
//                     {booking.status}
//                   </Badge>
//                 </div>
//               ))}
//               {activeBookings.length > 2 && (
//                 <p className="text-xs text-muted-foreground text-center">
//                   +{activeBookings.length - 2} more booking(s)
//                 </p>
//               )}
//             </motion.div>
//           )}

//           <div className="flex gap-2 mt-3">
//             {availableCount > 0 && onWalkInBooking && (
//               <Button
//                 variant="default"
//                 size="sm"
//                 className="flex-1 bg-green-600 hover:bg-green-700"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onWalkInBooking(room);
//                 }}
//               >
//                 Walk-in Booking
//               </Button>
//             )}
//             <Button
//               variant="outline"
//               size="sm"
//               className={cn("hover:bg-primary hover:text-primary-foreground transition-colors", availableCount > 0 ? "flex-1" : "w-full")}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onViewDetails(room);
//               }}
//             >
//               {activeBookings.length > 0 ? "Manage" : "Details"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

import { motion } from "framer-motion";
import { RoomTypeWithBookings } from "@/types/room";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, User, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface RoomCardProps {
  room: RoomTypeWithBookings;
  index: number;
  onViewDetails: (room: RoomTypeWithBookings) => void;
  onWalkInBooking?: (room: RoomTypeWithBookings) => void;
}

export const RoomCard = ({
  room,
  index,
  onViewDetails,
  onWalkInBooking,
}: RoomCardProps) => {
  const bookedCount = room.booked_count || 0;
  const availableCount = room.available_count || room.total_rooms;
  const totalRooms = room.total_rooms;
  const [todayPrice, setTodayPrice] = useState<number>(parseFloat(room.base_price));

  // Fetch today's date-specific pricing
  useEffect(() => {
    const fetchTodayPrice = async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("date_specific_pricing")
        .select("price")
        .eq("room_type_id", room.id)
        .eq("date", today)
        .single();

      if (!error && data) {
        setTodayPrice(parseFloat(data.price));
      } else {
        setTodayPrice(parseFloat(room.base_price));
      }
    };

    fetchTodayPrice();
  }, [room.id, room.base_price]);

  // Determine status based on availability
  const getStatus = () => {
    if (bookedCount === 0) return "available";
    if (availableCount === 0) return "occupied";
    return "reserved";
  };

  const status = getStatus();

  // All colors now use design tokens (primary, secondary, destructive)
  const statusConfig = {
    available: {
      label: "Available",
      barClass: "bg-[hsl(var(--primary))]",
      cardClass:
        "bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/40",
      badgeClass:
        "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
    },
    reserved: {
      label: "Partially Booked",
      barClass: "bg-[hsl(var(--secondary))]",
      cardClass:
        "bg-[hsl(var(--secondary))]/10 border-[hsl(var(--secondary))]/50",
      badgeClass:
        "bg-[hsl(var(--secondary))] text-[hsl(var(--accent-foreground))]",
    },
    occupied: {
      label: "Fully Booked",
      barClass: "bg-[hsl(var(--destructive))]",
      cardClass:
        "bg-[hsl(var(--destructive))]/5 border-[hsl(var(--destructive))]/40",
      badgeClass:
        "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]",
    },
  } as const;

  const config = statusConfig[status];
  const activeBookings = room.active_bookings || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-300 cursor-pointer",
          config.cardClass
        )}
        onClick={() => onViewDetails(room)}
      >
        {/* top accent bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            config.barClass
          )}
        />

        <CardContent className="p-4">
          {/* header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/5">
                <Home className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{room.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {room.category_label || "Room Type"}
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium border-none",
                config.badgeClass
              )}
            >
              {config.label}
            </Badge>
          </div>

          {/* availability */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Rooms:</span>
              <span className="font-semibold">{totalRooms}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-semibold text-[hsl(var(--primary))]">
                {availableCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booked:</span>
              <span className="font-semibold text-[hsl(var(--destructive))]">
                {bookedCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-semibold text-[hsl(var(--secondary))]">
                {room.capacity || 2}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today's Rate:</span>
              <span className="font-semibold text-primary">
                ₹{todayPrice.toLocaleString()}/night
              </span>
            </div>
          </div>

          {/* active bookings */}
          {activeBookings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2 mt-3 pt-3 border-t border-border/50"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                <Users className="h-3 w-3" />
                <span>Active Bookings ({activeBookings.length})</span>
              </div>

              {activeBookings.slice(0, 2).map((booking) => (
                <div
                  key={booking.id}
                  className="text-xs space-y-1 bg-background/70 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {booking.customer_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(
                        booking.check_in_date
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        booking.check_out_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {booking.number_of_rooms || 1} room(s)
                    </span>
                    <span>•</span>
                    <span>
                      ₹{booking.total_amount?.toLocaleString() || "N/A"}
                    </span>
                  </div>

                  <Badge
                    className={cn(
                      "text-xs w-fit border-none",
                      booking.status === "confirmed"
                        ? "bg-[hsl(var(--secondary))] text-[hsl(var(--accent-foreground))]"
                        : "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]"
                    )}
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}

              {activeBookings.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{activeBookings.length - 2} more booking(s)
                </p>
              )}
            </motion.div>
          )}

          {/* actions */}
          <div className="flex gap-2 mt-3">
            {availableCount > 0 && onWalkInBooking && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]"
                onClick={(e) => {
                  e.stopPropagation();
                  onWalkInBooking(room);
                }}
              >
                Walk-in Booking
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "hover:bg-[hsl(var(--secondary))]/20 hover:text-[hsl(var(--primary))] transition-colors",
                availableCount > 0 ? "flex-1" : "w-full"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(room);
              }}
            >
              {activeBookings.length > 0 ? "Manage" : "Details"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
