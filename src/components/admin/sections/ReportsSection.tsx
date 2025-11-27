import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, DollarSign, TrendingUp, TrendingDown, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const ReportsSection = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [bookingsData, setBookingsData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [referencesData, setReferencesData] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch sales data
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59");

      if (bookingsError) throw bookingsError;

      // Calculate sales metrics
      const totalSales = bookings?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;
      const totalGST = bookings?.reduce((sum, b) => sum + (parseFloat(b.gst_amount) || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const avgBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;

      setSalesData({
        totalSales,
        totalGST,
        totalBookings,
        avgBookingValue,
        bookings,
      });

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);

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

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Sales Report", 105, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 38, { align: "center" });
    
    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 50);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Sales: ₹${salesData.totalSales.toLocaleString()}`, 20, 58);
    doc.text(`Total GST: ₹${salesData.totalGST.toLocaleString()}`, 20, 65);
    doc.text(`Total Bookings: ${salesData.totalBookings}`, 20, 72);
    doc.text(`Average Booking Value: ₹${salesData.avgBookingValue.toFixed(2)}`, 20, 79);
    
    // Bookings table
    const tableData = salesData.bookings.map((b: any) => [
      format(new Date(b.created_at), 'dd/MM/yyyy'),
      b.customer_name,
      b.room_name || 'N/A',
      `₹${parseFloat(b.total_amount || 0).toLocaleString()}`,
      `₹${parseFloat(b.gst_amount || 0).toLocaleString()}`,
      b.status,
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Customer', 'Room', 'Amount', 'GST', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
    });
    
    doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("Sales report downloaded successfully!");
  };

  const downloadGSTReport = () => {
    if (!gstData) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("GST Report", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 38, { align: "center" });
    doc.text(`GST Number: 12345678901122`, 105, 45, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total GST Collected: ₹${gstData.totalGSTCollected.toLocaleString()}`, 20, 63);
    doc.text(`Number of Transactions: ${gstData.gstBookings.length}`, 20, 70);

    // GST table
    const tableData = gstData.gstBookings.map((b: any) => [
      format(new Date(b.created_at), 'dd/MM/yyyy'),
      b.customer_name,
      b.customer_phone || 'N/A',
      `₹${parseFloat(b.total_amount || 0).toLocaleString()}`,
      `₹${parseFloat(b.gst_amount || 0).toLocaleString()}`,
      `₹${(parseFloat(b.total_amount || 0) + parseFloat(b.gst_amount || 0)).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Customer', 'Phone', 'Base Amount', 'GST', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
    });

    doc.save(`GST_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("GST report downloaded successfully!");
  };

  const downloadExpenseReport = () => {
    if (!expensesData) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("Expense Report", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 38, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Expenses: ₹${expensesData.totalExpenses.toLocaleString()}`, 20, 58);

    // Category breakdown
    let yPos = 68;
    doc.text("Expenses by Category:", 20, yPos);
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
      `₹${parseFloat(e.amount || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Date', 'Category', 'Description', 'Vendor', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
    });

    doc.save(`Expense_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("Expense report downloaded successfully!");
  };

  const downloadReferencesReport = () => {
    if (!referencesData) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.text("References Report", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 38, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Bookings from References: ${referencesData.totalBookings}`, 20, 58);
    doc.text(`Total Revenue: ₹${referencesData.totalRevenue.toLocaleString()}`, 20, 65);
    doc.text(`Total Commission: ₹${referencesData.totalCommission.toLocaleString()}`, 20, 72);

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
    });

    doc.save(`References_Report_${startDate}_to_${endDate}.pdf`);
    toast.success("References report downloaded successfully!");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business reports and insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
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

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="bookings">Bookings Report</TabsTrigger>
          <TabsTrigger value="references">References Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses Report</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{salesData?.totalSales.toLocaleString() || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total GST</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{salesData?.totalGST.toLocaleString() || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.totalBookings || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{salesData?.avgBookingValue.toFixed(2) || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Details</CardTitle>
                <Button onClick={downloadSalesReport} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Click download to generate detailed sales report
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookingsData?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{bookingsData?.confirmed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{bookingsData?.checkedIn || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{bookingsData?.checkedOut || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{bookingsData?.cancelled || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="references">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referencesData?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">From references</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{referencesData?.totalRevenue.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">From references</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{referencesData?.totalCommission.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Payable to references</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>References Performance</CardTitle>
                <Button onClick={downloadReferencesReport} disabled={loading || !referencesData}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : referencesData?.references.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Reference Name</th>
                        <th className="text-left p-2">Contact Person</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-right p-2">Bookings</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Commission %</th>
                        <th className="text-right p-2">Commission Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referencesData.references.map((ref: any) => (
                        <tr key={ref.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{ref.name}</td>
                          <td className="p-2">{ref.contact_person || 'N/A'}</td>
                          <td className="p-2">{ref.phone || 'N/A'}</td>
                          <td className="p-2 text-right">{ref.bookingsCount}</td>
                          <td className="p-2 text-right">₹{ref.totalRevenue.toLocaleString()}</td>
                          <td className="p-2 text-right">{ref.commission_percentage}%</td>
                          <td className="p-2 text-right text-red-600 font-semibold">₹{ref.commission.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No reference bookings found for the selected date range
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{expensesData?.totalExpenses.toLocaleString() || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{((salesData?.totalSales || 0) - (expensesData?.totalExpenses || 0)).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Details</CardTitle>
                <Button onClick={downloadExpenseReport} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Click download to generate detailed expense report
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total GST Collected</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{gstData?.totalGSTCollected.toLocaleString() || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GST Transactions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gstData?.gstBookings.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>GST Report</CardTitle>
                <Button onClick={downloadGSTReport} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><strong>GST Number:</strong> 12345678901122</p>
                <p className="text-sm text-muted-foreground">
                  Click download to generate detailed GST report with customer details
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

