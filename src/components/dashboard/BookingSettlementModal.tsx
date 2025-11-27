import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { Download, CreditCard } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  home_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pin_code?: string;
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

interface BookingSettlementModalProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BookingSettlementModal = ({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: BookingSettlementModalProps) => {
  const [discountAmount, setDiscountAmount] = useState(0);
  const [additionalPayment, setAdditionalPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking && open) {
      setDiscountAmount(booking.discount_amount || 0);
      // Calculate remaining balance and auto-populate
      const baseAmt = booking.total_amount + (booking.discount_amount || 0);
      const finalAmt = baseAmt - (booking.discount_amount || 0);
      const remainingBalance = finalAmt - (booking.paid_amount || 0);
      setAdditionalPayment(remainingBalance > 0 ? remainingBalance : 0);
    }
  }, [booking, open]);

  if (!booking) return null;

  const numberOfNights = differenceInDays(
    parseISO(booking.check_out_date),
    parseISO(booking.check_in_date)
  );

  const baseAmount = booking.total_amount + (booking.discount_amount || 0);
  const finalAmount = baseAmount - discountAmount;
  const alreadyPaid = booking.paid_amount || 0;
  const totalPaidAmount = alreadyPaid + additionalPayment;
  const balance = finalAmount - totalPaidAmount;

  const handleSettlePayment = async () => {
    setLoading(true);
    try {
      const isFullyPaid = balance <= 0;

      // Update booking with payment details
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          discount_amount: discountAmount,
          paid_amount: totalPaidAmount,
          payment_status: isFullyPaid ? "paid" : totalPaidAmount > 0 ? "partial" : "pending",
          is_settled: isFullyPaid,
          settled_at: isFullyPaid ? new Date().toISOString() : null,
          total_amount: finalAmount,
        })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // If fully paid, free up all rooms
      if (isFullyPaid) {
        // Get all rooms associated with this booking
        const { data: bookingRooms, error: bookingRoomsError } = await supabase
          .from("booking_rooms")
          .select("room_type_id")
          .eq("booking_id", booking.id);

        if (!bookingRoomsError && bookingRooms && bookingRooms.length > 0) {
          // Update all room_types status to available
          const roomIds = bookingRooms.map(br => br.room_type_id);
          await supabase
            .from("room_types")
            .update({ status: "available" })
            .in("id", roomIds);

          toast.success(`${roomIds.length} room(s) have been freed up and are now available!`);
        } else if (booking.room_id) {
          // Fallback: If no booking_rooms entries, use the primary room_id
          await supabase
            .from("room_types")
            .update({ status: "available" })
            .eq("id", booking.room_id);

          toast.success("Room has been freed up and is now available!");
        }
      }

      // Generate invoice and download PDF
      await generateInvoice();
      await downloadInvoicePDF();

      toast.success("Payment settled successfully! Invoice downloaded.");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error settling payment:", error);
      toast.error("Failed to settle payment");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    try {
      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now()}-${booking.id.substring(0, 8).toUpperCase()}`;

      // Create invoice record in database
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          booking_id: booking.id,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone,
          customer_address: booking.customer_address || "",
          home_address: booking.home_address || "",
          city: booking.city || "",
          state: booking.state || "",
          country: booking.country || "",
          pin_code: booking.pin_code || "",
          room_name: booking.room_name,
          room_address: "Berlin Holidays Resort, Wayanad, Kerala",
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          number_of_nights: numberOfNights,
          base_amount: baseAmount,
          discount_amount: discountAmount,
          tax_amount: 0,
          total_amount: finalAmount,
          paid_amount: totalPaidAmount,
          balance: balance,
          payment_status: balance <= 0 ? "paid" : totalPaidAmount > 0 ? "partial" : "unpaid",
          payment_method: paymentMethod,
          notes: notes,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update booking with invoice number
      await supabase
        .from("bookings")
        .update({ invoice_number: invoiceNumber })
        .eq("id", booking.id);

      return invoiceData;
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      throw error;
    }
  };

  const downloadInvoicePDF = async () => {
    try {
      // Fetch the invoice for this booking
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("*")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const invoiceNumber = invoiceData?.invoice_number || `INV-${booking.id.substring(0, 8).toUpperCase()}`;

      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Wayanad, Kerala, India", 105, 27, { align: "center" });
      doc.text("Phone: +91 XXXXXXXXXX | Email: info@berlinholidays.com", 105, 32, { align: "center" });

      // Invoice Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 105, 45, { align: "center" });

      // Invoice Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice Date: ${format(new Date(), "dd/MM/yyyy")}`, 20, 60);
      doc.text(`Invoice #: ${invoiceNumber}`, 20, 67);

    // Customer Details
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 80);
    doc.setFont("helvetica", "normal");
    doc.text(booking.customer_name, 20, 87);
    doc.text(booking.customer_email, 20, 94);
    doc.text(booking.customer_phone, 20, 101);

    let yPos = 108;
    if (booking.home_address) {
      doc.text(booking.home_address, 20, yPos);
      yPos += 7;
    }
    if (booking.city || booking.state || booking.pin_code) {
      const cityStatePin = [booking.city, booking.state, booking.pin_code].filter(Boolean).join(", ");
      doc.text(cityStatePin, 20, yPos);
      yPos += 7;
    }
    if (booking.country) {
      doc.text(booking.country, 20, yPos);
      yPos += 7;
    }

    // Booking Details
    doc.setFont("helvetica", "bold");
    doc.text("Booking Details:", 120, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Room: ${booking.room_name}`, 120, 87);
    doc.text(`Room No: ${booking.room_number || "N/A"}`, 120, 94);
    doc.text(`Check-in: ${format(parseISO(booking.check_in_date), "dd/MM/yyyy")}`, 120, 101);
    doc.text(`Check-out: ${format(parseISO(booking.check_out_date), "dd/MM/yyyy")}`, 120, 108);
    doc.text(`Nights: ${numberOfNights}`, 120, 115);

    // Table
    autoTable(doc, {
      startY: 130,
      head: [["Description", "Quantity", "Rate", "Amount"]],
      body: [
        ["Room Charges", `${numberOfNights} nights`, `₹${(baseAmount / numberOfNights).toFixed(2)}`, `₹${baseAmount.toFixed(2)}`],
        ["Discount", "", "", `-₹${discountAmount.toFixed(2)}`],
      ],
      foot: [
        ["", "", "Subtotal", `₹${finalAmount.toFixed(2)}`],
        ["", "", "Paid Amount", `₹${totalPaidAmount.toFixed(2)}`],
        ["", "", "Balance Due", `₹${balance.toFixed(2)}`],
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: "bold" },
    });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.text("Thank you for choosing Berlin Holidays!", 105, finalY + 20, { align: "center" });
      doc.setFontSize(8);
      doc.text("This is a computer-generated invoice and does not require a signature.", 105, finalY + 27, { align: "center" });

      // Save PDF
      doc.save(`Invoice-${invoiceNumber}-${booking.customer_name}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Settlement & Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-semibold">Customer</p>
              <p className="text-sm">{booking.customer_name}</p>
              <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
              <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Room Details</p>
              <p className="text-sm">{booking.room_name}</p>
              <p className="text-xs text-muted-foreground">Room: {booking.room_number}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(booking.check_in_date), "MMM dd")} - {format(parseISO(booking.check_out_date), "MMM dd, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">{numberOfNights} nights</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseAmount">Base Amount</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  value={baseAmount}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount Amount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={baseAmount}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="finalAmount">Final Amount</Label>
                <Input
                  id="finalAmount"
                  type="number"
                  value={finalAmount}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="alreadyPaid">Already Paid (₹)</Label>
                <Input
                  id="alreadyPaid"
                  type="number"
                  value={alreadyPaid}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="additionalPayment">Additional Payment (₹)</Label>
                <Input
                  id="additionalPayment"
                  type="number"
                  value={additionalPayment}
                  onChange={(e) => setAdditionalPayment(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={finalAmount - alreadyPaid}
                />
              </div>
              <div>
                <Label htmlFor="totalPaid">Total Paid (₹)</Label>
                <Input
                  id="totalPaid"
                  type="number"
                  value={totalPaidAmount}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="balance">Remaining Balance</Label>
              <Input
                id="balance"
                type="number"
                value={balance}
                disabled
                className={`bg-muted font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge variant={balance <= 0 ? "secondary" : "destructive"}>
              {balance <= 0 ? "Fully Paid" : `Balance: ₹${balance.toFixed(2)}`}
            </Badge>
            {booking.is_settled && <Badge variant="outline">Settled</Badge>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={downloadInvoicePDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>
          <Button
            onClick={handleSettlePayment}
            disabled={loading}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? "Processing..." : "Settle Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

