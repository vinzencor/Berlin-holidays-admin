import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, DollarSign, TrendingUp, TrendingDown, FileText, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const ReportsSection = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [bookingsData, setBookingsData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [referencesData, setReferencesData] = useState<any>(null);
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, paymentMethodFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch sales data with payment method filter
      let bookingsQuery = supabase
        .from("bookings")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");

      // Apply payment method filter if any selected
      if (paymentMethodFilter.length > 0) {
        bookingsQuery = bookingsQuery.in("payment_method", paymentMethodFilter);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) throw bookingsError;

      // Calculate sales metrics - using paid_amount (received amount)
      const totalSales = bookings?.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0) || 0;
      const totalGST = bookings?.reduce((sum, b) => sum + (parseFloat(b.gst_amount) || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const avgBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;

      // Calculate pending amounts
      const totalPendingAmount = bookings?.reduce((sum, b) => {
        const totalAmt = parseFloat(b.total_amount) || 0;
        const paidAmt = parseFloat(b.paid_amount) || 0;
        return sum + (totalAmt - paidAmt);
      }, 0) || 0;

      const bookingsWithPending = bookings?.filter(b => {
        const totalAmt = parseFloat(b.total_amount) || 0;
        const paidAmt = parseFloat(b.paid_amount) || 0;
        return totalAmt > paidAmt;
      }) || [];

      setSalesData({
        totalSales,
        totalGST,
        totalBookings,
        avgBookingValue,
        bookings,
      });
      
      setPendingData({
        totalPending: totalPendingAmount,
        bookingsWithPending,
        count: bookingsWithPending.length,
      });

      // Fetch expenses with payment method filter
      let expensesQuery = supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);

      // Apply payment method filter if any selected
      if (paymentMethodFilter.length > 0) {
        expensesQuery = expensesQuery.in("payment_method", paymentMethodFilter);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;

      if (expensesError) throw expensesError;

      const totalExpenses = expenses?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
      const expensesByCategory = expenses?.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
        return acc;
      }, {});

      setExpensesData({
        totalExpenses,
        expensesByCategory,
        expenses,
      });

      // Calculate GST report
      const gstBookings = bookings?.filter(b => b.gst_amount && b.gst_amount > 0) || [];
      setGstData({
        totalGSTCollected: totalGST,
        gstBookings,
      });

      // Calculate bookings data
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const checkedInBookings = bookings?.filter(b => b.status === 'checked-in').length || 0;
      const checkedOutBookings = bookings?.filter(b => b.status === 'checked-out').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;

      setBookingsData({
        total: totalBookings,
        confirmed: confirmedBookings,
        checkedIn: checkedInBookings,
        checkedOut: checkedOutBookings,
        cancelled: cancelledBookings,
      });

      // Fetch references data
      const { data: references, error: referencesError } = await supabase
        .from("booking_references")
        .select("*")
        .eq("is_active", true);

      if (referencesError) throw referencesError;

      // Fetch bookings with reference details
      const { data: referenceBookings, error: refBookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          booking_references (
            id,
            name,
            contact_person,
            phone,
            commission_percentage
          )
        `)
        .not("reference_id", "is", null)
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");

      if (refBookingsError) throw refBookingsError;

      // Group bookings by reference
      const referenceStats = references?.map((ref: any) => {
        const refBookings = referenceBookings?.filter(b => b.reference_id === ref.id) || [];
        const totalRevenue = refBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        const commission = (totalRevenue * (ref.commission_percentage || 0)) / 100;

        return {
          ...ref,
          bookingsCount: refBookings.length,
          totalRevenue,
          commission,
          bookings: refBookings,
        };
      }).filter((ref: any) => ref.bookingsCount > 0) || [];

      setReferencesData({
        references: referenceStats,
        totalBookings: referenceBookings?.length || 0,
        totalRevenue: referenceBookings?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0,
        totalCommission: referenceStats.reduce((sum: number, ref: any) => sum + ref.commission, 0),
      });

    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const downloadSalesReport = () => {
    if (!salesData) return;

    const doc = new jsPDF('landscape');

    // Add logo
    const logoImg = new Image();
    logoImg.src = '/BERL logo .png';
    try {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo not loaded, continuing without it');
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 148, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Sales Report", 148, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 148, 38, { align: "center" });

    // Add payment method filter info
    let paymentMethodText = "All Payment Methods";
    if (Array.isArray(paymentMethodFilter) && paymentMethodFilter.length > 0) {
      paymentMethodText = paymentMethodFilter.map((m) => typeof m === 'string' ? m.toUpperCase() : '').join(", ");
    }
    doc.text(`Payment Method: ${paymentMethodText}`, 148, 45, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Revenue: ₹${salesData.totalSales.toLocaleString()}`, 20, 63);
    doc.text(`Total GST Collected: ₹${salesData.totalGST.toLocaleString()}`, 20, 70);
    doc.text(`Total Bookings: ${salesData.totalBookings}`, 20, 77);
    doc.text(`Average Booking Value: ₹${salesData.avgBookingValue.toFixed(2)}`, 20, 84);

    // Bookings table
    const tableData = salesData.bookings.map((b: any) => [
      format(new Date(b.created_at), 'dd/MM/yyyy'),
      b.customer_name,
      b.room_name || 'N/A',
      `₹${parseFloat(b.paid_amount || 0).toLocaleString()}`,
      `₹${parseFloat(b.gst_amount || 0).toLocaleString()}`,
      b.payment_method ? b.payment_method.toUpperCase() : 'N/A',
      b.status,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Date', 'Customer', 'Room', 'Amount Received', 'GST', 'Payment Method', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
      styles: { fontSize: 9 },
    });

    const filterSuffix = paymentMethodFilter.length > 0 ? `_${paymentMethodFilter.join('_')}` : "";
    doc.save(`Sales_Report_${startDate}_to_${endDate}${filterSuffix}.pdf`);
    toast.success("Sales report downloaded successfully!");
  };

  const downloadGSTReport = () => {
    if (!gstData) return;

    const doc = new jsPDF('landscape');

    // Add logo
    const logoImg = new Image();
    logoImg.src = '/BERL logo .png';
    try {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo not loaded, continuing without it');
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 148, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("GST Report", 148, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 148, 38, { align: "center" });
    doc.text(`GST Number: 12345678901122`, 148, 45, { align: "center" });

    // Add payment method filter info
    const paymentMethodText = paymentMethodFilter.length === 0 
      ? "All Payment Methods" 
      : paymentMethodFilter.map(m => m.toUpperCase()).join(", ");
    doc.text(`Payment Method: ${paymentMethodText}`, 148, 52, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total GST Collected: ₹${gstData.totalGSTCollected.toLocaleString()}`, 20, 70);
    doc.text(`Number of GST Transactions: ${gstData.gstBookings.length}`, 20, 77);

    // GST table
    const tableData = gstData.gstBookings.map((b: any) => [
      format(new Date(b.created_at), 'dd/MM/yyyy'),
      b.customer_name,
      b.customer_phone || 'N/A',
      `₹${parseFloat(b.total_amount || 0).toLocaleString()}`,
      `₹${parseFloat(b.gst_amount || 0).toLocaleString()}`,
      `₹${(parseFloat(b.total_amount || 0) + parseFloat(b.gst_amount || 0)).toLocaleString()}`,
      b.payment_method ? b.payment_method.toUpperCase() : 'N/A',
    ]);

    autoTable(doc, {
      startY: 87,
      head: [['Date', 'Customer', 'Phone', 'Base Amount', 'GST', 'Total Amount', 'Payment Method']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
      styles: { fontSize: 9 },
    });

    const filterSuffix = paymentMethodFilter.length > 0 ? `_${paymentMethodFilter.join('_')}` : "";
    doc.save(`GST_Report_${startDate}_to_${endDate}${filterSuffix}.pdf`);
    toast.success("GST report downloaded successfully!");
  };

  const downloadExpenseReport = () => {
    if (!expensesData) return;

    const doc = new jsPDF('landscape');

    // Add logo
    const logoImg = new Image();
    logoImg.src = '/BERL logo .png';
    try {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo not loaded, continuing without it');
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 148, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Expense Report", 148, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 148, 38, { align: "center" });

    // Add payment method filter info
    let paymentMethodText = "All Payment Methods";
    if (Array.isArray(paymentMethodFilter) && paymentMethodFilter.length > 0) {
      paymentMethodText = paymentMethodFilter.map((m) => typeof m === 'string' ? m.toUpperCase() : '').join(", ");
    }
    doc.text(`Payment Method: ${paymentMethodText}`, 148, 45, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Expenses: ₹${expensesData.totalExpenses.toLocaleString()}`, 20, 63);

    // Category breakdown
    let yPos = 73;
    doc.text("Category-wise Breakdown:", 20, yPos);
    yPos += 7;
    Object.entries(expensesData.expensesByCategory || {}).forEach(([category, amount]: any) => {
      doc.text(`  ${category}: ₹${amount.toLocaleString()}`, 25, yPos);
      yPos += 6;
    });

    // Expenses table
    const tableData = expensesData.expenses.map((e: any) => [
      format(new Date(e.expense_date), 'dd/MM/yyyy'),
      e.category,
      e.description || 'N/A',
      e.vendor_name || 'N/A',
      e.payment_method ? e.payment_method.toUpperCase() : 'N/A',
      `₹${parseFloat(e.amount || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Date', 'Category', 'Description', 'Vendor', 'Payment Method', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
      styles: { fontSize: 9 },
    });

    const filterSuffix = paymentMethodFilter.length > 0 ? `_${paymentMethodFilter.join('_')}` : "";
    doc.save(`Expense_Report_${startDate}_to_${endDate}${filterSuffix}.pdf`);
    toast.success("Expense report downloaded successfully!");
  };

  const downloadReferencesReport = () => {
    if (!referencesData) return;

    const doc = new jsPDF('landscape');

    // Add logo
    const logoImg = new Image();
    logoImg.src = '/BERL logo .png';
    try {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo not loaded, continuing without it');
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 148, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("References & Commission Report", 148, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 148, 38, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Bookings from References: ${referencesData.totalBookings}`, 20, 58);
    doc.text(`Total Revenue Generated: ₹${referencesData.totalRevenue.toLocaleString()}`, 20, 65);
    doc.text(`Total Commission Payable: ₹${referencesData.totalCommission.toLocaleString()}`, 20, 72);

    // References table
    const tableData = referencesData.references.map((ref: any) => [
      ref.name,
      ref.contact_person || 'N/A',
      ref.phone || 'N/A',
      ref.bookingsCount,
      `₹${ref.totalRevenue.toLocaleString()}`,
      `${ref.commission_percentage}%`,
      `₹${ref.commission.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Reference Name', 'Contact Person', 'Phone', 'Bookings', 'Revenue', 'Commission %', 'Commission Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
      styles: { fontSize: 9 },
    });

    doc.save(`References_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("References report downloaded successfully!");
  };

  const downloadPendingReport = () => {
    if (!pendingData) return;

    const doc = new jsPDF('landscape');

    // Add logo
    const logoImg = new Image();
    logoImg.src = '/BERL logo .png';
    try {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo not loaded, continuing without it');
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 148, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Pending Payments Report", 148, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 148, 38, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Pending Amount: ₹${pendingData.totalPending.toLocaleString()}`, 20, 58);
    doc.text(`Number of Bookings with Pending: ${pendingData.count}`, 20, 65);

    // Pending payments table
    const tableData = pendingData.bookingsWithPending.map((b: any) => {
      const totalAmt = parseFloat(b.total_amount || 0);
      const paidAmt = parseFloat(b.paid_amount || 0);
      const pendingAmt = totalAmt - paidAmt;

      return [
        format(new Date(b.created_at), 'dd/MM/yyyy'),
        b.customer_name,
        b.customer_phone || 'N/A',
        b.room_name || 'N/A',
        `₹${totalAmt.toLocaleString()}`,
        `₹${paidAmt.toLocaleString()}`,
        `₹${pendingAmt.toLocaleString()}`,
        b.status,
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Date', 'Customer', 'Phone', 'Room', 'Total Amount', 'Paid', 'Pending', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 9 },
    });

    doc.save(`Pending_Payments_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("Pending payments report downloaded successfully!");
  };

  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground">Comprehensive business reports and insights</p>
        </div>
      </div>

      {/* Date Range & Payment Method Filter */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label>Payment Methods</Label>
              <div className="border rounded-md p-3 space-y-2 bg-background">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-cash"
                    checked={paymentMethodFilter.includes("cash")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "cash"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "cash"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-cash" className="text-sm font-normal cursor-pointer">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-card"
                    checked={paymentMethodFilter.includes("card")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "card"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "card"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-card" className="text-sm font-normal cursor-pointer">Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-upi"
                    checked={paymentMethodFilter.includes("upi")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "upi"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "upi"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-upi" className="text-sm font-normal cursor-pointer">UPI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-netbanking"
                    checked={paymentMethodFilter.includes("netbanking")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "netbanking"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "netbanking"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-netbanking" className="text-sm font-normal cursor-pointer">Net Banking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-bank-transfer"
                    checked={paymentMethodFilter.includes("bank_transfer")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "bank_transfer"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "bank_transfer"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-bank-transfer" className="text-sm font-normal cursor-pointer">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pm-cheque"
                    checked={paymentMethodFilter.includes("cheque")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethodFilter([...paymentMethodFilter, "cheque"]);
                      } else {
                        setPaymentMethodFilter(paymentMethodFilter.filter(m => m !== "cheque"));
                      }
                    }}
                  />
                  <Label htmlFor="pm-cheque" className="text-sm font-normal cursor-pointer">Cheque</Label>
                </div>
                {paymentMethodFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setPaymentMethodFilter([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {paymentMethodFilter.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {paymentMethodFilter.map(m => m.toUpperCase()).join(", ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-4">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <TabsList className="grid w-full min-w-[600px] md:min-w-0 grid-cols-6 mx-3 md:mx-0">
            <TabsTrigger value="sales" className="text-xs md:text-sm">Sales</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs md:text-sm">Bookings</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="references" className="text-xs md:text-sm">References</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs md:text-sm">Expenses</TabsTrigger>
            <TabsTrigger value="gst" className="text-xs md:text-sm">GST</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sales">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[600px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Received</CardTitle>
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">₹{salesData?.totalSales.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Amount received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total GST</CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">₹{salesData?.totalGST.toLocaleString() || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Bookings</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">{salesData?.totalBookings || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Avg Booking Value</CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">₹{salesData?.avgBookingValue.toFixed(2) || 0}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base md:text-lg">Sales Details</CardTitle>
                <Button onClick={downloadSalesReport} disabled={loading} size="sm" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm">Loading...</p>
              ) : (
                <div className="text-xs md:text-sm text-muted-foreground">
                  Click download to generate detailed sales report with payment methods
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[600px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">{bookingsData?.total || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Confirmed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">{bookingsData?.confirmed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Checked In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-green-600">{bookingsData?.checkedIn || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Checked Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-gray-600">{bookingsData?.checkedOut || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-red-600">{bookingsData?.cancelled || 0}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[600px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Pending</CardTitle>
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-red-600">₹{pendingData?.totalPending.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Amount not yet received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Bookings with Pending</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">{pendingData?.count || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Partial/unpaid bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Average Pending</CardTitle>
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">
                    ₹{pendingData?.count > 0 ? (pendingData.totalPending / pendingData.count).toFixed(2) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per booking</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base md:text-lg">Pending Payments Details</CardTitle>
                <Button onClick={downloadPendingReport} disabled={loading || !pendingData?.count} size="sm" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm">Loading...</p>
              ) : pendingData?.bookingsWithPending.length > 0 ? (
                <div className="overflow-x-auto -mx-3 md:mx-0">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-xs md:text-sm">Date</th>
                        <th className="text-left p-2 text-xs md:text-sm">Customer</th>
                        <th className="text-left p-2 text-xs md:text-sm">Phone</th>
                        <th className="text-left p-2 text-xs md:text-sm">Room</th>
                        <th className="text-right p-2 text-xs md:text-sm">Total Amount</th>
                        <th className="text-right p-2 text-xs md:text-sm">Paid</th>
                        <th className="text-right p-2 text-xs md:text-sm">Pending</th>
                        <th className="text-left p-2 text-xs md:text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingData.bookingsWithPending.map((booking: any) => {
                        const totalAmt = parseFloat(booking.total_amount || 0);
                        const paidAmt = parseFloat(booking.amount_paid || 0);
                        const pendingAmt = totalAmt - paidAmt;
                        
                        return (
                          <tr key={booking.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-xs md:text-sm">{format(new Date(booking.created_at), 'dd/MM/yyyy')}</td>
                            <td className="p-2 font-medium text-xs md:text-sm">{booking.customer_name}</td>
                            <td className="p-2 text-xs md:text-sm">{booking.customer_phone || 'N/A'}</td>
                            <td className="p-2 text-xs md:text-sm">{booking.room_name || 'N/A'}</td>
                            <td className="p-2 text-right text-xs md:text-sm">₹{totalAmt.toLocaleString()}</td>
                            <td className="p-2 text-right text-green-600 text-xs md:text-sm">₹{paidAmt.toLocaleString()}</td>
                            <td className="p-2 text-right text-red-600 font-semibold text-xs md:text-sm">₹{pendingAmt.toLocaleString()}</td>
                            <td className="p-2 text-xs md:text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                                booking.status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs md:text-sm text-muted-foreground text-center py-8">
                  No pending payments found for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[600px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Bookings</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">{referencesData?.totalBookings || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">From references</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">₹{referencesData?.totalRevenue.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">From references</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Commission</CardTitle>
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-red-600">₹{referencesData?.totalCommission.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Payable to references</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mb-4 md:mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base md:text-lg">References Performance</CardTitle>
                <Button onClick={downloadReferencesReport} disabled={loading || !referencesData} size="sm" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm">Loading...</p>
              ) : referencesData?.references.length > 0 ? (
                <div className="overflow-x-auto -mx-3 md:mx-0">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-xs md:text-sm">Reference Name</th>
                        <th className="text-left p-2 text-xs md:text-sm">Contact Person</th>
                        <th className="text-left p-2 text-xs md:text-sm">Phone</th>
                        <th className="text-right p-2 text-xs md:text-sm">Bookings</th>
                        <th className="text-right p-2 text-xs md:text-sm">Revenue</th>
                        <th className="text-right p-2 text-xs md:text-sm">Commission %</th>
                        <th className="text-right p-2 text-xs md:text-sm">Commission Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referencesData.references.map((ref: any) => (
                        <tr key={ref.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium text-xs md:text-sm">{ref.name}</td>
                          <td className="p-2 text-xs md:text-sm">{ref.contact_person || 'N/A'}</td>
                          <td className="p-2 text-xs md:text-sm">{ref.phone || 'N/A'}</td>
                          <td className="p-2 text-right text-xs md:text-sm">{ref.bookingsCount}</td>
                          <td className="p-2 text-right text-xs md:text-sm">₹{ref.totalRevenue.toLocaleString()}</td>
                          <td className="p-2 text-right text-xs md:text-sm">{ref.commission_percentage}%</td>
                          <td className="p-2 text-right text-red-600 font-semibold text-xs md:text-sm">₹{ref.commission.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs md:text-sm text-muted-foreground text-center py-8">
                  No reference bookings found for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[400px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold text-red-600">₹{expensesData?.totalExpenses.toLocaleString() || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Net Income</CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-lg md:text-2xl font-bold ${((salesData?.totalSales || 0) - (expensesData?.totalExpenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{((salesData?.totalSales || 0) - (expensesData?.totalExpenses || 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Received - Expenses</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base md:text-lg">Expense Details</CardTitle>
                <Button onClick={downloadExpenseReport} disabled={loading} size="sm" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm">Loading...</p>
              ) : (
                <div className="text-xs md:text-sm text-muted-foreground">
                  Click download to generate detailed expense report with payment methods
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 min-w-[400px] md:min-w-0 px-3 md:px-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total GST Collected</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">₹{gstData?.totalGSTCollected.toLocaleString() || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">GST Transactions</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-2xl font-bold">{gstData?.gstBookings.length || 0}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <CardTitle className="text-base md:text-lg">GST Report</CardTitle>
                <Button onClick={downloadGSTReport} disabled={loading} size="sm" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs md:text-sm"><strong>GST Number:</strong> 12345678901122</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Click download to generate detailed GST report with customer details and payment methods
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

