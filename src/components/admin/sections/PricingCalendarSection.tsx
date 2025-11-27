import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const PricingCalendarSection = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [dateSpecificPrices, setDateSpecificPrices] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [priceData, setPriceData] = useState({ price: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchDateSpecificPrices();
    }
  }, [selectedRoom, currentMonth]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("room_types")
      .select("id, name, base_price")
      .order("name");

    if (!error && data) {
      setRooms(data);
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0].id);
      }
    }
  };

  const fetchDateSpecificPrices = async () => {
    if (!selectedRoom) return;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from("date_specific_pricing")
      .select("*")
      .eq("room_type_id", selectedRoom)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"));

    if (!error) {
      setDateSpecificPrices(data || []);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Check if there's already a price for this date
    const existingPrice = dateSpecificPrices.find(
      (p) => isSameDay(new Date(p.date), date)
    );

    if (existingPrice) {
      setPriceData({
        price: existingPrice.price.toString(),
        notes: existingPrice.notes || "",
      });
    } else {
      // Get base price for the selected room
      const room = rooms.find((r) => r.id === selectedRoom);
      setPriceData({
        price: room?.base_price?.toString() || "",
        notes: "",
      });
    }

    setDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedDate || !selectedRoom || !priceData.price) {
      toast.error("Please enter a valid price");
      return;
    }

    setLoading(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingPrice = dateSpecificPrices.find(
      (p) => isSameDay(new Date(p.date), selectedDate)
    );

    const pricePayload = {
      room_type_id: selectedRoom,
      date: dateStr,
      price: parseFloat(priceData.price),
      notes: priceData.notes,
    };

    if (existingPrice) {
      const { error } = await supabase
        .from("date_specific_pricing")
        .update(pricePayload)
        .eq("id", existingPrice.id);

      if (error) {
        toast.error("Failed to update price");
        console.error(error);
      } else {
        toast.success("Price updated successfully");
        fetchDateSpecificPrices();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("date_specific_pricing")
        .insert([pricePayload]);

      if (error) {
        toast.error("Failed to set price");
        console.error(error);
      } else {
        toast.success("Price set successfully");
        fetchDateSpecificPrices();
        setDialogOpen(false);
      }
    }

    setLoading(false);
  };

  const handleDeletePrice = async () => {
    if (!selectedDate || !selectedRoom) return;

    const existingPrice = dateSpecificPrices.find(
      (p) => isSameDay(new Date(p.date), selectedDate)
    );

    if (!existingPrice) {
      toast.error("No custom price set for this date");
      return;
    }

    if (!confirm("Are you sure you want to remove the custom price for this date?")) return;

    setLoading(true);

    const { error } = await supabase
      .from("date_specific_pricing")
      .delete()
      .eq("id", existingPrice.id);

    if (error) {
      toast.error("Failed to delete price");
      console.error(error);
    } else {
      toast.success("Custom price removed");
      fetchDateSpecificPrices();
      setDialogOpen(false);
    }

    setLoading(false);
  };

  const getPriceForDate = (date: Date) => {
    const specificPrice = dateSpecificPrices.find(
      (p) => isSameDay(new Date(p.date), date)
    );

    if (specificPrice) {
      return specificPrice.price;
    }

    const room = rooms.find((r) => r.id === selectedRoom);
    return room?.base_price || 0;
  };

  const hasCustomPrice = (date: Date) => {
    return dateSpecificPrices.some((p) => isSameDay(new Date(p.date), date));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();

  // Create empty cells for days before the month starts
  const emptyCells = Array(firstDayOfWeek).fill(null);

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Dynamic Pricing Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Room Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Select Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} (Base: ₹{room.base_price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoomData && (
              <div className="text-sm text-muted-foreground">
                Base Price: <span className="font-semibold">₹{selectedRoomData.base_price}</span>
              </div>
            )}
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-semibold">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {emptyCells.map((_, index) => (
                <div key={`empty-${index}`} className="p-2 border-t border-r min-h-[80px] bg-muted/20" />
              ))}
              {daysInMonth.map((date) => {
                const price = getPriceForDate(date);
                const isCustom = hasCustomPrice(date);
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    disabled={isPast}
                    className={`p-2 border-t border-r min-h-[80px] text-left hover:bg-accent transition-colors ${
                      isPast ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    } ${isCustom ? "bg-green-50 border-green-200" : ""}`}
                  >
                    <div className="text-sm font-medium">{format(date, "d")}</div>
                    <div className={`text-xs mt-1 ${isCustom ? "text-green-700 font-semibold" : "text-muted-foreground"}`}>
                      ₹{price}
                    </div>
                    {isCustom && (
                      <div className="text-xs text-green-600 mt-1">Custom</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Click on any date to set a custom price</p>
            <p>• Green highlighted dates have custom pricing</p>
            <p>• Past dates cannot be modified</p>
          </div>
        </CardContent>
      </Card>

      {/* Price Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Set Price for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={priceData.price}
                onChange={(e) => setPriceData({ ...priceData, price: e.target.value })}
                placeholder="Enter price"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={priceData.notes}
                onChange={(e) => setPriceData({ ...priceData, notes: e.target.value })}
                placeholder="Optional notes (e.g., Holiday pricing, Special event)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {hasCustomPrice(selectedDate!) && (
              <Button
                variant="destructive"
                onClick={handleDeletePrice}
                disabled={loading}
              >
                Remove Custom Price
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice} disabled={loading}>
              {loading ? "Saving..." : "Save Price"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

