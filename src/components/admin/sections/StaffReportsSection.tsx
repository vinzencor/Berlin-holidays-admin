import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, User } from "lucide-react";
import { DataTable } from "../DataTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface StaffReportsSectionProps {
  staffId?: string;
}

export const StaffReportsSection = ({ staffId }: StaffReportsSectionProps) => {
  const [staffData, setStaffData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (staffId) {
      fetchStaffReport();
    }
  }, [staffId]);

  const fetchStaffReport = async () => {
    if (!staffId) return;
    
    setLoading(true);
    try {
      // Fetch staff details
      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("id", staffId)
        .single();

      if (staffError) throw staffError;
      setStaffData(staff);

      // Fetch bookings made by this staff
      const { data: staffBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("staff_id", staffId)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(staffBookings || []);

    } catch (error) {
      console.error("Error fetching staff report:", error);
      toast.error("Failed to fetch staff report");
    } finally {
      setLoading(false);
    }
  };

  const downloadStaffReport = () => {
    if (!staffData || !bookings) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Staff Performance Report", 105, 30, { align: "center" });
    
    // Staff Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Staff Details", 20, 45);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${staffData.first_name} ${staffData.last_name}`, 20, 53);
    doc.text(`Email: ${staffData.email}`, 20, 60);
    doc.text(`Role: ${staffData.role}`, 20, 67);
    doc.text(`Department: ${staffData.department || 'N/A'}`, 20, 74);
    
    // Summary
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Summary", 20, 85);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Bookings: ${totalBookings}`, 20, 93);
    doc.text(`Total Revenue Generated: ₹${totalRevenue.toLocaleString()}`, 20, 100);
    doc.text(`Average Booking Value: ₹${avgBookingValue.toFixed(2)}`, 20, 107);
    
    // Bookings table
    const tableData = bookings.map((b: any) => [
      format(new Date(b.created_at), 'dd/MM/yyyy'),
      b.customer_name,
      b.room_name || 'N/A',
      format(new Date(b.check_in_date), 'dd/MM/yyyy'),
      format(new Date(b.check_out_date), 'dd/MM/yyyy'),
      `₹${parseFloat(b.total_amount || 0).toLocaleString()}`,
      b.status,
    ]);
    
    autoTable(doc, {
      startY: 120,
      head: [['Date', 'Customer', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 105, 56] },
      styles: { fontSize: 8 },
    });
    
    doc.save(`Staff_Report_${staffData.first_name}_${staffData.last_name}.pdf`);
    toast.success("Staff report downloaded successfully!");
  };

  const columns = [
    {
      key: "created_at",
      label: "Booking Date",
      render: (value: string) => format(new Date(value), 'dd MMM yyyy'),
    },
    { key: "customer_name", label: "Customer" },
    { key: "room_name", label: "Room" },
    {
      key: "check_in_date",
      label: "Check-in",
      render: (value: string) => format(new Date(value), 'dd MMM yyyy'),
    },
    {
      key: "check_out_date",
      label: "Check-out",
      render: (value: string) => format(new Date(value), 'dd MMM yyyy'),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (value: string) => `₹${parseFloat(value || '0').toLocaleString()}`,
    },
    { key: "status", label: "Status" },
  ];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!staffData) {
    return <div className="p-6">Staff not found</div>;
  }

  const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{staffData.first_name} {staffData.last_name}</h1>
            <p className="text-muted-foreground">{staffData.role} - {staffData.department}</p>
          </div>
        </div>
        <Button onClick={downloadStaffReport}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgBookingValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bookings}
            columns={columns}
            isLoading={loading}
            searchPlaceholder="Search bookings..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

