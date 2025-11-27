import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookingDialog } from "../dialogs/BookingDialog";
import { BookingSettlementModal } from "@/components/dashboard/BookingSettlementModal";
import { Download, DollarSign, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const BookingsSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [settlementBooking, setSettlementBooking] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    let query = supabase
      .from("bookings")
      .select("*");

    // Apply date filters if set
    if (startDate) {
      query = query.gte("check_in_date", startDate);
    }
    if (endDate) {
      query = query.lte("check_out_date", endDate);
    }

    const { data: bookings, error } = await query.order("created_at", { ascending: false});

    if (error) {
      toast.error("Failed to fetch bookings");
      console.error(error);
    } else {
      setData(bookings || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      // First, get all rooms associated with this booking
      const { data: bookingRooms, error: bookingRoomsError } = await supabase
        .from("booking_rooms")
        .select("room_type_id")
        .eq("booking_id", item.id);

      if (bookingRoomsError) throw bookingRoomsError;

      // Delete the booking
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      // Free up all rooms associated with this booking
      if (bookingRooms && bookingRooms.length > 0) {
        const roomIds = bookingRooms.map(br => br.room_type_id);
        await supabase
          .from("room_types")
          .update({ status: "available" })
          .in("id", roomIds);
      } else if (item.room_id) {
        // Fallback: If no booking_rooms entries, use the primary room_id
        await supabase
          .from("room_types")
          .update({ status: "available" })
          .eq("id", item.room_id);
      }

      toast.success("Booking deleted successfully and rooms freed up");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete booking");
      console.error(error);
    }
  };

  const handleDownloadInvoice = async (booking: any) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(0, 105, 56);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text("Premium Resort & Spa", 105, 28, { align: "center" });

      // Invoice title
      doc.setFontSize(16);
      doc.setTextColor(196, 157, 113);
      doc.text("BOOKING INVOICE", 105, 50, { align: "center" });

      // Invoice details
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 60);
      doc.text(`Booking ID: ${booking.id?.substring(0, 8).toUpperCase()}`, 20, 67);

      // Customer details
      doc.setFontSize(12);
      doc.setTextColor(0, 105, 56);
      doc.text("Customer Details:", 20, 80);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${booking.customer_name}`, 20, 88);
      doc.text(`Email: ${booking.customer_email}`, 20, 95);
      doc.text(`Phone: ${booking.customer_phone}`, 20, 102);

      // Booking details
      doc.setFontSize(12);
      doc.setTextColor(0, 105, 56);
      doc.text("Booking Details:", 20, 115);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Room: ${booking.room_name}`, 20, 123);
      doc.text(`Check-in: ${new Date(booking.check_in_date).toLocaleDateString()}`, 20, 130);
      doc.text(`Check-out: ${new Date(booking.check_out_date).toLocaleDateString()}`, 20, 137);
      doc.text(`Guests: ${booking.number_of_adults} Adults, ${booking.number_of_children} Children`, 20, 144);
      doc.text(`Payment Method: ${booking.payment_method?.toUpperCase()}`, 20, 151);

      // Payment table
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      const tableData: any[] = [
        ["Room Charges", `${nights} night(s) × ₹${(booking.room_price || 0).toFixed(2)}`, `₹${((booking.room_price || 0) * nights).toFixed(2)}`],
      ];

      if (booking.discount_amount > 0) {
        tableData.push(["Discount", "", `-₹${booking.discount_amount.toFixed(2)}`]);
      }

      tableData.push(
        ["", "Total Amount", `₹${booking.total_amount.toFixed(2)}`],
        ["", "Paid Amount", `₹${(booking.paid_amount || 0).toFixed(2)}`],
        ["", "Balance Due", `₹${(booking.total_amount - (booking.paid_amount || 0)).toFixed(2)}`]
      );

      autoTable(doc, {
        startY: 160,
        head: [["Description", "Details", "Amount"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [0, 105, 56] },
        styles: { fontSize: 10 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for choosing Berlin Holidays!", 105, finalY + 15, { align: "center" });
      doc.text("For queries, contact: info@berlinholidays.com | +91-XXXXXXXXXX", 105, finalY + 20, { align: "center" });

      doc.save(`Invoice_${booking.id?.substring(0, 8)}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleSettlePayment = (booking: any) => {
    setSettlementBooking(booking);
    setSettlementOpen(true);
  };

  const columns = [
    { key: "customer_name", label: "Customer" },
    { key: "customer_email", label: "Email" },
    { key: "customer_phone", label: "Phone" },
    { key: "room_name", label: "Room" },
    {
      key: "check_in_date",
      label: "Check-in",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "check_out_date",
      label: "Check-out",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (value: number) => `₹${value?.toLocaleString() || 0}`,
    },
    {
      key: "paid_amount",
      label: "Paid",
      render: (value: number, row: any) => (
        <div className="flex flex-col gap-1">
          <span className="text-green-600 font-semibold">₹{(value || 0).toLocaleString()}</span>
          {row.total_amount - (value || 0) > 0 && (
            <span className="text-xs text-red-600">
              Due: ₹{(row.total_amount - (value || 0)).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (value: string) => {
        const variants: any = {
          paid: "default",
          partial: "secondary",
          unpaid: "destructive",
        };
        return (
          <Badge variant={variants[value] || "outline"}>
            {value || "Unpaid"}
          </Badge>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => {
        const variants: any = {
          confirmed: "default",
          "checked-in": "destructive",
          "checked-out": "secondary",
          cancelled: "outline",
        };
        return (
          <Badge variant={variants[value] || "default"}>
            {value || "Confirmed"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadInvoice(row)}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Invoice
          </Button>
          {row.payment_status !== "paid" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleSettlePayment(row)}
              className="flex items-center gap-1 bg-[#006938] hover:bg-[#005030]"
            >
              <DollarSign className="w-4 h-4" />
              Settle
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="start-date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="end-date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            End Date
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
        >
          Clear Filters
        </Button>
      </div>
      <DataTable
        title="Bookings"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search bookings..."
      />
      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
      <BookingSettlementModal
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        booking={settlementBooking}
        onSuccess={fetchData}
      />
    </>
  );
};

