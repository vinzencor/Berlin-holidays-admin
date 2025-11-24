// import { RoomWithBooking } from "@/types/room";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   Home,
//   User,
//   Calendar,
//   DollarSign,
//   CreditCard,
//   Users,
//   Bed,
//   Star,
//   Maximize2,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Info
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface RoomDetailsDialogProps {
//   room: RoomWithBooking | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onManagePayment?: (room: RoomWithBooking) => void;
//   onWalkInBooking?: (room: RoomWithBooking) => void;
// }

// export const RoomDetailsDialog = ({ room, open, onOpenChange, onManagePayment, onWalkInBooking }: RoomDetailsDialogProps) => {
//   if (!room) return null;

//   const booking = room.current_booking;
//   const bookedCount = room.booked_count || 0;
//   const availableCount = room.available_count || room.total_rooms;

//   // Determine status based on availability
//   const getStatus = () => {
//     if (bookedCount === 0) return 'available';
//     if (availableCount === 0) return 'occupied';
//     return 'reserved';
//   };

//   const status = getStatus();

//   const statusColors = {
//     available: "bg-green-500",
//     reserved: "bg-yellow-500",
//     occupied: "bg-red-500",
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-2xl">{room.name}</DialogTitle>
//             <Badge className={cn(statusColors[status], "text-white")}>
//               {status === 'available' ? 'Available' : status === 'reserved' ? 'Partially Booked' : 'Fully Booked'}
//             </Badge>
//           </div>
//           <DialogDescription className="capitalize">
//             {room.category_label || 'Standard Room'} • {room.total_rooms} Total Units
//           </DialogDescription>
//         </DialogHeader>

//         <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
//           <div className="space-y-4 mt-4">
//             {/* Room Information Section */}
//             <div className="space-y-3">
//               <h4 className="font-semibold text-sm flex items-center gap-2">
//                 <Home className="h-4 w-4" />
//                 Room Information
//               </h4>
//               <div className="grid grid-cols-2 gap-3 pl-6">
//                 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                   <DollarSign className="h-5 w-5 text-green-600" />
//                   <div>
//                     <p className="text-xs text-muted-foreground">Base Price</p>
//                     <p className="text-sm font-semibold">₹{parseFloat(room.base_price).toLocaleString()}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                   <Users className="h-5 w-5 text-blue-600" />
//                   <div>
//                     <p className="text-xs text-muted-foreground">Capacity</p>
//                     <p className="text-sm font-semibold">{room.capacity} Guests</p>
//                   </div>
//                 </div>
//                 {room.size && (
//                   <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                     <Maximize2 className="h-5 w-5 text-purple-600" />
//                     <div>
//                       <p className="text-xs text-muted-foreground">Room Size</p>
//                       <p className="text-sm font-semibold">{room.size}</p>
//                     </div>
//                   </div>
//                 )}
//                 {room.bed_type && (
//                   <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
//                     <Bed className="h-5 w-5 text-indigo-600" />
//                     <div>
//                       <p className="text-xs text-muted-foreground">Bed Type</p>
//                       <p className="text-sm font-semibold capitalize">{room.bed_type}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Availability Section */}
//             <Separator />
//             <div className="space-y-3">
//               <h4 className="font-semibold text-sm flex items-center gap-2">
//                 <CheckCircle className="h-4 w-4" />
//                 Availability Status
//               </h4>
//               <div className="grid grid-cols-3 gap-3 pl-6">
//                 <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
//                   <p className="text-xs text-blue-600 mb-1">Total Rooms</p>
//                   <p className="text-2xl font-bold text-blue-700">{room.total_rooms}</p>
//                 </div>
//                 <div className="p-3 rounded-lg bg-green-50 border border-green-200">
//                   <p className="text-xs text-green-600 mb-1">Available</p>
//                   <p className="text-2xl font-bold text-green-700">{availableCount}</p>
//                 </div>
//                 <div className="p-3 rounded-lg bg-red-50 border border-red-200">
//                   <p className="text-xs text-red-600 mb-1">Booked</p>
//                   <p className="text-2xl font-bold text-red-700">{bookedCount}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Description */}
//             {room.description && (
//               <>
//                 <Separator />
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-sm flex items-center gap-2">
//                     <Info className="h-4 w-4" />
//                     Description
//                   </h4>
//                   <p className="text-sm text-muted-foreground pl-6">{room.description}</p>
//                 </div>
//               </>
//             )}

//             {/* Amenities */}
//             {room.amenities && room.amenities.length > 0 && (
//               <>
//                 <Separator />
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-sm flex items-center gap-2">
//                     <Star className="h-4 w-4" />
//                     Amenities
//                   </h4>
//                   <div className="flex flex-wrap gap-2 pl-6">
//                     {room.amenities.map((amenity, idx) => (
//                       <Badge key={idx} variant="secondary" className="capitalize">
//                         {amenity}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             )}

//             {/* Check-in/Check-out Times */}
//             {(room.check_in_time || room.check_out_time) && (
//               <>
//                 <Separator />
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-sm flex items-center gap-2">
//                     <Clock className="h-4 w-4" />
//                     Check-in/Check-out Times
//                   </h4>
//                   <div className="grid grid-cols-2 gap-3 pl-6">
//                     {room.check_in_time && (
//                       <div className="p-3 rounded-lg bg-muted/50">
//                         <p className="text-xs text-muted-foreground mb-1">Check-in</p>
//                         <p className="text-sm font-semibold">{room.check_in_time}</p>
//                       </div>
//                     )}
//                     {room.check_out_time && (
//                       <div className="p-3 rounded-lg bg-muted/50">
//                         <p className="text-xs text-muted-foreground mb-1">Check-out</p>
//                         <p className="text-sm font-semibold">{room.check_out_time}</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </>
//             )}

//             {/* Active Bookings */}
//             {room.active_bookings && room.active_bookings.length > 0 && (
//               <>
//                 <Separator />
//                 <div className="space-y-3">
//                   <h4 className="font-semibold text-sm flex items-center gap-2">
//                     <User className="h-4 w-4" />
//                     Active Bookings ({room.active_bookings.length})
//                   </h4>
//                   <div className="space-y-3 pl-6">
//                     {room.active_bookings.map((activeBooking, idx) => (
//                       <div key={activeBooking.id} className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-2">
//                             <User className="h-4 w-4 text-muted-foreground" />
//                             <span className="font-medium">{activeBooking.customer_name}</span>
//                           </div>
//                           <Badge className={cn(
//                             activeBooking.status === 'confirmed' ? 'bg-yellow-500' :
//                             activeBooking.status === 'checked-in' ? 'bg-red-500' : 'bg-gray-500',
//                             'text-white'
//                           )}>
//                             {activeBooking.status}
//                           </Badge>
//                         </div>

//                         {activeBooking.customer_email && (
//                           <p className="text-xs text-muted-foreground">
//                             📧 {activeBooking.customer_email}
//                           </p>
//                         )}

//                         {activeBooking.customer_phone && (
//                           <p className="text-xs text-muted-foreground">
//                             📱 {activeBooking.customer_phone}
//                           </p>
//                         )}

//                         <div className="flex items-center gap-2 text-xs">
//                           <Calendar className="h-3 w-3 text-muted-foreground" />
//                           <span className="text-muted-foreground">
//                             {new Date(activeBooking.check_in_date).toLocaleDateString('en-GB', {
//                               day: '2-digit',
//                               month: 'short',
//                               year: 'numeric',
//                             })} - {new Date(activeBooking.check_out_date).toLocaleDateString('en-GB', {
//                               day: '2-digit',
//                               month: 'short',
//                               year: 'numeric',
//                             })}
//                           </span>
//                         </div>

//                         <div className="flex items-center justify-between pt-2 border-t border-border/50">
//                           <div className="flex items-center gap-3 text-xs">
//                             <span className="text-muted-foreground">
//                               {activeBooking.number_of_rooms || 1} room(s)
//                             </span>
//                             <span className="text-muted-foreground">•</span>
//                             <span className="text-muted-foreground">
//                               {(activeBooking.number_of_adults || 0) + (activeBooking.number_of_children || 0)} guests
//                             </span>
//                           </div>
//                           <span className="font-semibold text-sm">
//                             ₹{activeBooking.total_amount?.toLocaleString() || 'N/A'}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </ScrollArea>

//         {/* Action Buttons */}
//         <Separator />
//         <div className="flex gap-2 pt-4">
//           {availableCount > 0 && onWalkInBooking && (
//             <Button
//               className="flex-1 bg-green-600 hover:bg-green-700"
//               onClick={() => {
//                 onOpenChange(false);
//                 onWalkInBooking(room);
//               }}
//             >
//               Walk-in Booking
//             </Button>
//           )}
//           {room.active_bookings && room.active_bookings.length > 0 && onManagePayment && (
//             <Button
//               className="flex-1 bg-blue-600 hover:bg-blue-700"
//               onClick={() => {
//                 onOpenChange(false);
//                 onManagePayment(room);
//               }}
//             >
//               Manage Payments
//             </Button>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

import { RoomWithBooking } from "@/types/room";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  Users,
  Bed,
  Star,
  Maximize2,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomDetailsDialogProps {
  room: RoomWithBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManagePayment?: (room: RoomWithBooking) => void;
  onWalkInBooking?: (room: RoomWithBooking) => void;
}

export const RoomDetailsDialog = ({
  room,
  open,
  onOpenChange,
  onManagePayment,
  onWalkInBooking,
}: RoomDetailsDialogProps) => {
  if (!room) return null;

  const booking = room.current_booking;
  const bookedCount = room.booked_count || 0;
  const availableCount = room.available_count || room.total_rooms;

  // Determine status based on availability
  const getStatus = () => {
    if (bookedCount === 0) return "available";
    if (availableCount === 0) return "occupied";
    return "reserved";
  };

  const status = getStatus();

  // Use theme tokens instead of fixed colors
  const statusColors: Record<
    "available" | "reserved" | "occupied",
    string
  > = {
    available:
      "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
    reserved:
      "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
    occupied:
      "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-[hsl(var(--primary))]">
              {room.name}
            </DialogTitle>
            <Badge className={cn("px-3 py-1 text-xs font-semibold", statusColors[status])}>
              {status === "available"
                ? "Available"
                : status === "reserved"
                ? "Partially Booked"
                : "Fully Booked"}
            </Badge>
          </div>
          <DialogDescription className="capitalize">
            {room.category_label || "Standard Room"} • {room.total_rooms} Total
            Units
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-4 mt-4">
            {/* Room Information Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Home className="h-4 w-4 text-[hsl(var(--primary))]" />
                Room Information
              </h4>
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Base Price</p>
                    <p className="text-sm font-semibold">
                      ₹{parseFloat(room.base_price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-[hsl(var(--secondary))]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-sm font-semibold">
                      {room.capacity} Guests
                    </p>
                  </div>
                </div>
                {room.size && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Maximize2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Room Size</p>
                      <p className="text-sm font-semibold">{room.size}</p>
                    </div>
                  </div>
                )}
                {room.bed_type && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Bed className="h-5 w-5 text-[hsl(var(--secondary))]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bed Type</p>
                      <p className="text-sm font-semibold capitalize">
                        {room.bed_type}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Section */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[hsl(var(--primary))]" />
                Availability Status
              </h4>
              <div className="grid grid-cols-3 gap-3 pl-6">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Rooms
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {room.total_rooms}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/40">
                  <p className="text-xs text-[hsl(var(--primary))] mb-1">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                    {availableCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/40">
                  <p className="text-xs text-[hsl(var(--destructive))] mb-1">
                    Booked
                  </p>
                  <p className="text-2xl font-bold text-[hsl(var(--destructive))]">
                    {bookedCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-[hsl(var(--primary))]" />
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">
                    {room.description}
                  </p>
                </div>
              </>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-[hsl(var(--secondary))]" />
                    Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {room.amenities.map((amenity, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="capitalize"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Check-in/Check-out Times */}
            {(room.check_in_time || room.check_out_time) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
                    Check-in/Check-out Times
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {room.check_in_time && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">
                          Check-in
                        </p>
                        <p className="text-sm font-semibold">
                          {room.check_in_time}
                        </p>
                      </div>
                    )}
                    {room.check_out_time && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">
                          Check-out
                        </p>
                        <p className="text-sm font-semibold">
                          {room.check_out_time}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Active Bookings */}
            {room.active_bookings && room.active_bookings.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-[hsl(var(--primary))]" />
                    Active Bookings ({room.active_bookings.length})
                  </h4>
                  <div className="space-y-3 pl-6">
                    {room.active_bookings.map((activeBooking) => (
                      <div
                        key={activeBooking.id}
                        className="p-3 rounded-lg bg-muted/50 border border-border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {activeBooking.customer_name}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "text-white text-xs px-2 py-0.5",
                              activeBooking.status === "confirmed"
                                ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                                : activeBooking.status === "checked-in"
                                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                : "bg-[hsl(var(--muted-foreground))]/70 text-background"
                            )}
                          >
                            {activeBooking.status}
                          </Badge>
                        </div>

                        {activeBooking.customer_email && (
                          <p className="text-xs text-muted-foreground">
                            📧 {activeBooking.customer_email}
                          </p>
                        )}

                        {activeBooking.customer_phone && (
                          <p className="text-xs text-muted-foreground">
                            📱 {activeBooking.customer_phone}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(
                              activeBooking.check_in_date
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(
                              activeBooking.check_out_date
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">
                              {activeBooking.number_of_rooms || 1} room(s)
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {(activeBooking.number_of_adults || 0) +
                                (activeBooking.number_of_children || 0)}{" "}
                              guests
                            </span>
                          </div>
                          <span className="font-semibold text-sm">
                            ₹
                            {activeBooking.total_amount?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <Separator />
        <div className="flex gap-2 pt-4">
          {availableCount > 0 && onWalkInBooking && (
            <Button
              className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]"
              onClick={() => {
                onOpenChange(false);
                onWalkInBooking(room);
              }}
            >
              Walk-in Booking
            </Button>
          )}
          {room.active_bookings &&
            room.active_bookings.length > 0 &&
            onManagePayment && (
              <Button
                className="flex-1 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-[hsl(var(--secondary-foreground))] font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  onManagePayment(room);
                }}
              >
                Manage Payments
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
