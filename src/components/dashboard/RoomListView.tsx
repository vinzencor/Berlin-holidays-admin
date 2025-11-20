import { RoomTypeWithBookings } from "@/types/room";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomListViewProps {
  rooms: RoomTypeWithBookings[];
  onViewDetails: (room: RoomTypeWithBookings) => void;
  onWalkInBooking?: (room: RoomTypeWithBookings) => void;
}

export const RoomListView = ({ rooms, onViewDetails, onWalkInBooking }: RoomListViewProps) => {
  const getStatusBadge = (bookedCount: number, totalRooms: number) => {
    if (bookedCount === 0) {
      return { variant: "default" as const, className: "bg-green-500 text-white", label: "Available" };
    } else if (bookedCount >= totalRooms) {
      return { variant: "default" as const, className: "bg-red-500 text-white", label: "Fully Booked" };
    } else {
      return { variant: "default" as const, className: "bg-yellow-500 text-white", label: "Partially Booked" };
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Room Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Total Rooms</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Booked</TableHead>
            <TableHead>Rate/Night</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => {
            const bookedCount = room.booked_count || 0;
            const availableCount = room.available_count || room.total_rooms;
            const statusBadge = getStatusBadge(bookedCount, room.total_rooms);

            return (
              <TableRow key={room.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell className="capitalize">{room.category_label || 'Standard'}</TableCell>
                <TableCell>{room.total_rooms}</TableCell>
                <TableCell className="text-green-600 font-semibold">{availableCount}</TableCell>
                <TableCell className="text-red-600 font-semibold">{bookedCount}</TableCell>
                <TableCell>₹{parseFloat(room.base_price).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={statusBadge.variant} className={cn(statusBadge.className)}>
                    {statusBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {availableCount > 0 && onWalkInBooking && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onWalkInBooking(room)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(room)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
