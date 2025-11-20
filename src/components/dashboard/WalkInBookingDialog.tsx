import { useState } from "react";
import { RoomTypeWithBookings } from "@/types/room";
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
import { useCreateBooking } from "@/hooks/useRooms";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WalkInBookingDialogProps {
  room: RoomTypeWithBookings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalkInBookingDialog = ({ room, open, onOpenChange }: WalkInBookingDialogProps) => {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [numberOfRooms, setNumberOfRooms] = useState("1");
  const [numberOfAdults, setNumberOfAdults] = useState("2");
  const [numberOfChildren, setNumberOfChildren] = useState("0");
  const [totalAmount, setTotalAmount] = useState("");

  const createBooking = useCreateBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!room || !checkInDate || !checkOutDate || !guestName) return;

    const total = parseFloat(totalAmount);
    const rooms = parseInt(numberOfRooms);
    const adults = parseInt(numberOfAdults);
    const children = parseInt(numberOfChildren);

    if (isNaN(total) || isNaN(rooms) || rooms <= 0) {
      return;
    }

    // Check if enough rooms are available
    const availableCount = room.available_count || room.total_rooms;
    if (rooms > availableCount) {
      alert(`Only ${availableCount} room(s) available!`);
      return;
    }

    await createBooking.mutateAsync({
      user_id: 'walk-in-' + Date.now(), // Generate a unique ID for walk-in
      customer_name: guestName,
      customer_email: guestEmail || null,
      customer_phone: guestPhone || null,
      room_id: room.id,
      room_name: room.name,
      check_in_date: format(checkInDate, 'yyyy-MM-dd'),
      check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
      number_of_rooms: rooms,
      number_of_adults: adults,
      number_of_children: children,
      total_guests: adults + children,
      special_requests: null,
      status: 'checked-in', // Walk-in customers are immediately checked in
      total_amount: total,
    });

    // Reset form
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setNumberOfRooms("1");
    setNumberOfAdults("2");
    setNumberOfChildren("0");
    setTotalAmount("");
    onOpenChange(false);
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Walk-in Booking - {room.name}</DialogTitle>
          <DialogDescription>
            Create a walk-in booking for {room.name}. Available: {room.available_count || room.total_rooms} room(s)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              placeholder="Enter guest name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Guest Email</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="guest@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestPhone">Guest Phone</Label>
            <Input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkOutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={setCheckOutDate}
                    initialFocus
                    disabled={(date) => checkInDate ? date <= checkInDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfRooms">Number of Rooms *</Label>
              <Input
                id="numberOfRooms"
                type="number"
                min="1"
                max={room.available_count || room.total_rooms}
                value={numberOfRooms}
                onChange={(e) => setNumberOfRooms(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfAdults">Adults *</Label>
              <Input
                id="numberOfAdults"
                type="number"
                min="1"
                value={numberOfAdults}
                onChange={(e) => setNumberOfAdults(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfChildren">Children</Label>
              <Input
                id="numberOfChildren"
                type="number"
                min="0"
                value={numberOfChildren}
                onChange={(e) => setNumberOfChildren(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (₹) *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Base rate: ₹{parseFloat(room.base_price).toLocaleString()}/night per room
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

