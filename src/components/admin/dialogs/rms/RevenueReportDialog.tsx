import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RevenueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  onSuccess: () => void;
}

export const RevenueReportDialog = ({ open, onOpenChange, report, onSuccess }: RevenueReportDialogProps) => {
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    total_revenue: "0",
    room_revenue: "0",
    service_revenue: "0",
    other_revenue: "0",
    total_bookings: "0",
    total_rooms_available: "0",
    total_rooms_occupied: "0",
    occupancy_rate: "0",
    adr: "0",
    revpar: "0",
  });

  useEffect(() => {
    if (report) {
      setFormData({
        report_date: report.report_date || new Date().toISOString().split('T')[0],
        total_revenue: report.total_revenue?.toString() || "0",
        room_revenue: report.room_revenue?.toString() || "0",
        service_revenue: report.service_revenue?.toString() || "0",
        other_revenue: report.other_revenue?.toString() || "0",
        total_bookings: report.total_bookings?.toString() || "0",
        total_rooms_available: report.total_rooms_available?.toString() || "0",
        total_rooms_occupied: report.total_rooms_occupied?.toString() || "0",
        occupancy_rate: report.occupancy_rate?.toString() || "0",
        adr: report.adr?.toString() || "0",
        revpar: report.revpar?.toString() || "0",
      });
    } else {
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        total_revenue: "0",
        room_revenue: "0",
        service_revenue: "0",
        other_revenue: "0",
        total_bookings: "0",
        total_rooms_available: "0",
        total_rooms_occupied: "0",
        occupancy_rate: "0",
        adr: "0",
        revpar: "0",
      });
    }
  }, [report, open]);

  const calculateMetrics = () => {
    const roomsOccupied = parseFloat(formData.total_rooms_occupied) || 0;
    const roomsAvailable = parseFloat(formData.total_rooms_available) || 1;
    const roomRevenue = parseFloat(formData.room_revenue) || 0;

    const occupancyRate = (roomsOccupied / roomsAvailable) * 100;
    const adr = roomsOccupied > 0 ? roomRevenue / roomsOccupied : 0;
    const revpar = roomRevenue / roomsAvailable;

    setFormData(prev => ({
      ...prev,
      occupancy_rate: occupancyRate.toFixed(2),
      adr: adr.toFixed(2),
      revpar: revpar.toFixed(2),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      report_date: formData.report_date,
      total_revenue: parseFloat(formData.total_revenue) || 0,
      room_revenue: parseFloat(formData.room_revenue) || 0,
      service_revenue: parseFloat(formData.service_revenue) || 0,
      other_revenue: parseFloat(formData.other_revenue) || 0,
      total_bookings: parseInt(formData.total_bookings) || 0,
      total_rooms_available: parseInt(formData.total_rooms_available) || 0,
      total_rooms_occupied: parseInt(formData.total_rooms_occupied) || 0,
      occupancy_rate: parseFloat(formData.occupancy_rate) || 0,
      adr: parseFloat(formData.adr) || 0,
      revpar: parseFloat(formData.revpar) || 0,
    };

    if (report) {
      const { error } = await supabase
        .from("revenue_reports")
        .update(dataToSubmit)
        .eq("id", report.id);

      if (error) {
        toast.error("Failed to update revenue report");
        console.error(error);
      } else {
        toast.success("Revenue report updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("revenue_reports").insert([dataToSubmit]);

      if (error) {
        toast.error("Failed to create revenue report");
        console.error(error);
      } else {
        toast.success("Revenue report created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report ? "Edit Revenue Report" : "Create New Revenue Report"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="report_date">Report Date *</Label>
            <Input
              id="report_date"
              type="date"
              value={formData.report_date}
              onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="room_revenue">Room Revenue (₹) *</Label>
              <Input
                id="room_revenue"
                type="number"
                step="0.01"
                value={formData.room_revenue}
                onChange={(e) => setFormData({ ...formData, room_revenue: e.target.value })}
                onBlur={calculateMetrics}
                required
              />
            </div>
            <div>
              <Label htmlFor="service_revenue">Service Revenue (₹)</Label>
              <Input
                id="service_revenue"
                type="number"
                step="0.01"
                value={formData.service_revenue}
                onChange={(e) => setFormData({ ...formData, service_revenue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="other_revenue">Other Revenue (₹)</Label>
              <Input
                id="other_revenue"
                type="number"
                step="0.01"
                value={formData.other_revenue}
                onChange={(e) => setFormData({ ...formData, other_revenue: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="total_revenue">Total Revenue (₹) *</Label>
              <Input
                id="total_revenue"
                type="number"
                step="0.01"
                value={formData.total_revenue}
                onChange={(e) => setFormData({ ...formData, total_revenue: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_bookings">Total Bookings *</Label>
              <Input
                id="total_bookings"
                type="number"
                value={formData.total_bookings}
                onChange={(e) => setFormData({ ...formData, total_bookings: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="total_rooms_available">Rooms Available *</Label>
              <Input
                id="total_rooms_available"
                type="number"
                value={formData.total_rooms_available}
                onChange={(e) => setFormData({ ...formData, total_rooms_available: e.target.value })}
                onBlur={calculateMetrics}
                required
              />
            </div>
            <div>
              <Label htmlFor="total_rooms_occupied">Rooms Occupied *</Label>
              <Input
                id="total_rooms_occupied"
                type="number"
                value={formData.total_rooms_occupied}
                onChange={(e) => setFormData({ ...formData, total_rooms_occupied: e.target.value })}
                onBlur={calculateMetrics}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-muted p-4 rounded-lg">
            <div>
              <Label htmlFor="occupancy_rate">Occupancy Rate (%)</Label>
              <Input
                id="occupancy_rate"
                type="number"
                step="0.01"
                value={formData.occupancy_rate}
                readOnly
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="adr">ADR (₹)</Label>
              <Input
                id="adr"
                type="number"
                step="0.01"
                value={formData.adr}
                readOnly
                className="bg-background"
              />
            </div>
            <div>
              <Label htmlFor="revpar">RevPAR (₹)</Label>
              <Input
                id="revpar"
                type="number"
                step="0.01"
                value={formData.revpar}
                readOnly
                className="bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {report ? "Update" : "Create"} Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

