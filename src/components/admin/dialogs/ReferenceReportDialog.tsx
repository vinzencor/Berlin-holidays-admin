import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, DollarSign, FileText, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReferenceReportDialogProps {
  reference: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferenceReportDialog = ({
  reference,
  open,
  onOpenChange,
}: ReferenceReportDialogProps) => {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (open && reference) {
      fetchReferenceReport();
    }
  }, [open, reference, startDate, endDate]);

  const fetchReferenceReport = async () => {
    if (!reference) return;

    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("reference_id", reference.id)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;
      const commission = (totalRevenue * (reference.commission_percentage || 0)) / 100;
      const paidAmount = bookings?.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0) || 0;
      const pendingAmount = totalRevenue - paidAmount;

      // Group by status
      const confirmedBookings = bookings?.filter(b => b.status === "confirmed").length || 0;
      const checkedInBookings = bookings?.filter(b => b.status === "checked-in").length || 0;
      const checkedOutBookings = bookings?.filter(b => b.status === "checked-out").length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === "cancelled").length || 0;

      setReportData({
        bookings,
        totalBookings,
        totalRevenue,
        commission,
        paidAmount,
        pendingAmount,
        confirmedBookings,
        checkedInBookings,
        checkedOutBookings,
        cancelledBookings,
      });
    } catch (error: any) {
      console.error("Error fetching reference report:", error);
      toast.error("Failed to fetch reference report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData || !reference) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Reference Performance Report", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text(reference.name, 105, 38, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Period: ${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}`,
      105,
      46,
      { align: "center" }
    );

    // Reference Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Reference Details", 20, 58);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 66;
    doc.text(`Contact Person: ${reference.contact_person || "N/A"}`, 20, yPos);
    yPos += 7;
    doc.text(`Phone: ${reference.phone || "N/A"}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${reference.email || "N/A"}`, 20, yPos);
    yPos += 7;
    doc.text(`Commission Rate: ${reference.commission_percentage}%`, 20, yPos);

    // Summary
    yPos += 12;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Summary", 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Bookings: ${reportData.totalBookings}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Revenue: ₹${reportData.totalRevenue.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Commission Amount: ₹${reportData.commission.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Paid Amount: ₹${reportData.paidAmount.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Pending Amount: ₹${reportData.pendingAmount.toLocaleString()}`, 20, yPos);

    // Bookings table
    const tableData = reportData.bookings.map((b: any) => [
      format(new Date(b.created_at), "dd/MM/yyyy"),
      b.customer_name,
      b.room_name || "N/A",
      `₹${parseFloat(b.total_amount || 0).toLocaleString()}`,
      b.status,
    ]);

    autoTable(doc, {
      startY: yPos + 10,
      head: [["Date", "Customer", "Room", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 105, 56] },
    });

    doc.save(`${reference.name}_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("Reference report downloaded successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Reference Report: {reference?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reference Details */}
          <Card>
            <CardHeader>
              <CardTitle>Reference Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-semibold">{reference?.contact_person || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{reference?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{reference?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="font-semibold">{reference?.commission_percentage}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : reportData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalBookings}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{reportData.totalRevenue.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commission Amount</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ₹{reportData.commission.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Confirmed</p>
                      <p className="text-2xl font-bold text-blue-600">{reportData.confirmedBookings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Checked In</p>
                      <p className="text-2xl font-bold text-green-600">{reportData.checkedInBookings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Checked Out</p>
                      <p className="text-2xl font-bold text-gray-600">{reportData.checkedOutBookings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Cancelled</p>
                      <p className="text-2xl font-bold text-red-600">{reportData.cancelledBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold">₹{reportData.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Paid Amount</p>
                      <p className="text-xl font-bold text-green-600">₹{reportData.paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Amount</p>
                      <p className="text-xl font-bold text-orange-600">₹{reportData.pendingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bookings List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Booking Details</CardTitle>
                    <Button onClick={downloadReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportData.bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Customer</th>
                            <th className="text-left p-2">Room</th>
                            <th className="text-right p-2">Amount</th>
                            <th className="text-right p-2">Paid</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.bookings.map((booking: any) => (
                            <tr key={booking.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{format(new Date(booking.created_at), "dd MMM yyyy")}</td>
                              <td className="p-2">{booking.customer_name}</td>
                              <td className="p-2">{booking.room_name || "N/A"}</td>
                              <td className="p-2 text-right">₹{parseFloat(booking.total_amount || 0).toLocaleString()}</td>
                              <td className="p-2 text-right">₹{parseFloat(booking.paid_amount || 0).toLocaleString()}</td>
                              <td className="p-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    booking.status === "confirmed"
                                      ? "bg-blue-100 text-blue-800"
                                      : booking.status === "checked-in"
                                      ? "bg-green-100 text-green-800"
                                      : booking.status === "checked-out"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No bookings found for this date range</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};


