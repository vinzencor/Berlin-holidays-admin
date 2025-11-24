import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { RevenueReportDialog } from "../../dialogs/rms/RevenueReportDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, BarChart3 } from "lucide-react";

export const RevenueReportsSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    avgOccupancy: 0,
    avgADR: 0,
    avgRevPAR: 0,
  });

  const columns = [
    { key: "report_date", label: "Date" },
    { 
      key: "total_revenue", 
      label: "Total Revenue",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: "room_revenue", 
      label: "Room Revenue",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: "service_revenue", 
      label: "Service Revenue",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { key: "total_bookings", label: "Bookings" },
    { key: "occupancy_rate", label: "Occupancy", render: (value: number) => `${value}%` },
    { 
      key: "adr", 
      label: "ADR",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: "revpar", 
      label: "RevPAR",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: revenueData, error } = await supabase
      .from("revenue_reports")
      .select("*")
      .order("report_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch revenue reports");
      console.error(error);
    } else {
      setData(revenueData || []);
      calculateStats(revenueData || []);
    }
    setLoading(false);
  };

  const calculateStats = (reports: any[]) => {
    if (reports.length === 0) return;

    const totalRevenue = reports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
    const avgOccupancy = reports.reduce((sum, r) => sum + (r.occupancy_rate || 0), 0) / reports.length;
    const avgADR = reports.reduce((sum, r) => sum + (r.adr || 0), 0) / reports.length;
    const avgRevPAR = reports.reduce((sum, r) => sum + (r.revpar || 0), 0) / reports.length;

    setStats({
      totalRevenue,
      avgOccupancy,
      avgADR,
      avgRevPAR,
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete report for ${item.report_date}?`)) return;

    const { error } = await supabase.from("revenue_reports").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete report");
      console.error(error);
    } else {
      toast.success("Report deleted successfully");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Occupancy</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOccupancy.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ADR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.avgADR.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg RevPAR</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.avgRevPAR.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RevenueReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

