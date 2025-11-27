import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { InvoiceDialog } from "../../dialogs/pms/InvoiceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const InvoicesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDownload = (invoice: any) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Wayanad, Kerala, India", 105, 27, { align: "center" });
      doc.text("Phone: +91 9876543210 | Email: info@berlinholidays.com", 105, 32, { align: "center" });

      // Invoice Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 105, 45, { align: "center" });

      // Invoice Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice Date: ${format(new Date(invoice.issue_date), "dd/MM/yyyy")}`, 20, 60);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 67);
      doc.text(`Due Date: ${format(new Date(invoice.due_date || invoice.issue_date), "dd/MM/yyyy")}`, 20, 74);

      // Customer Details
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, 90);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customer_name || "N/A", 20, 97);
      if (invoice.customer_email) doc.text(invoice.customer_email, 20, 104);
      if (invoice.customer_phone) doc.text(invoice.customer_phone, 20, 111);

      let yPos = 118;
      if (invoice.home_address) {
        doc.text(invoice.home_address, 20, yPos);
        yPos += 7;
      }
      if (invoice.city || invoice.state || invoice.pin_code) {
        const cityStatePin = [invoice.city, invoice.state, invoice.pin_code].filter(Boolean).join(", ");
        doc.text(cityStatePin, 20, yPos);
        yPos += 7;
      }
      if (invoice.country) {
        doc.text(invoice.country, 20, yPos);
        yPos += 7;
      }

      // Booking Details (if available)
      if (invoice.room_name) {
        doc.setFont("helvetica", "bold");
        doc.text("Booking Details:", 120, 90);
        doc.setFont("helvetica", "normal");
        doc.text(`Room: ${invoice.room_name}`, 120, 97);
        if (invoice.check_in_date) doc.text(`Check-in: ${format(new Date(invoice.check_in_date), "dd/MM/yyyy")}`, 120, 104);
        if (invoice.check_out_date) doc.text(`Check-out: ${format(new Date(invoice.check_out_date), "dd/MM/yyyy")}`, 120, 111);
        if (invoice.number_of_nights) doc.text(`Nights: ${invoice.number_of_nights}`, 120, 118);
      }

      // Table
      const tableData = [];
      if (invoice.base_amount && invoice.number_of_nights) {
        tableData.push(["Room Charges", `${invoice.number_of_nights} nights`, `₹${(invoice.base_amount / invoice.number_of_nights).toFixed(2)}`, `₹${invoice.base_amount.toFixed(2)}`]);
      } else if (invoice.base_amount) {
        tableData.push(["Services", "1", `₹${invoice.base_amount.toFixed(2)}`, `₹${invoice.base_amount.toFixed(2)}`]);
      }

      if (invoice.discount_amount > 0) {
        tableData.push(["Discount", "", "", `-₹${invoice.discount_amount.toFixed(2)}`]);
      }

      if (invoice.tax_amount > 0) {
        tableData.push(["Tax", "", "", `₹${invoice.tax_amount.toFixed(2)}`]);
      }

      autoTable(doc, {
        startY: 130,
        head: [["Description", "Quantity", "Rate", "Amount"]],
        body: tableData,
        foot: [
          ["", "", "Total Amount", `₹${invoice.total_amount.toFixed(2)}`],
          ["", "", "Paid Amount", `₹${invoice.paid_amount.toFixed(2)}`],
          ["", "", "Balance Due", `₹${invoice.balance.toFixed(2)}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [0, 105, 56] },
        footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      // Payment Details
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details:", 20, finalY + 15);
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Status: ${invoice.payment_status?.toUpperCase()}`, 20, finalY + 22);
      if (invoice.payment_method) doc.text(`Payment Method: ${invoice.payment_method}`, 20, finalY + 29);
      if (invoice.notes) {
        doc.text("Notes:", 20, finalY + 36);
        doc.text(invoice.notes, 20, finalY + 43, { maxWidth: 170 });
      }

      // Footer
      doc.setFontSize(10);
      doc.text("Thank you for choosing Berlin Holidays!", 105, finalY + 60, { align: "center" });
      doc.setFontSize(8);
      doc.text("This is a computer-generated invoice and does not require a signature.", 105, finalY + 67, { align: "center" });

      // Save PDF
      doc.save(`Invoice-${invoice.invoice_number}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "customer_name", label: "Customer" },
    {
      key: "issue_date",
      label: "Issue Date",
      render: (value: string) => value ? format(new Date(value), "dd/MM/yyyy") : "N/A"
    },
    {
      key: "total_amount",
      label: "Total",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      key: "paid_amount",
      label: "Paid",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      key: "balance",
      label: "Balance",
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      key: "payment_status",
      label: "Status",
      render: (value: string) => {
        const colors: any = {
          unpaid: "destructive",
          partial: "default",
          paid: "secondary",
          overdue: "destructive"
        };
        return <Badge variant={colors[value] || "outline"}>{value?.toUpperCase() || "UNPAID"}</Badge>;
      }
    },
    {
      key: "actions",
      label: "Download",
      render: (_value: any, row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload(row)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>
      )
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("invoices")
      .select("*");

    // Apply date filters if set
    if (startDate) {
      query = query.gte("issue_date", startDate);
    }
    if (endDate) {
      query = query.lte("issue_date", endDate);
    }

    const { data: invoiceData, error } = await query.order("issue_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch invoices");
      console.error(error);
    } else {
      setData(invoiceData || []);
    }
    setLoading(false);
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
    if (!confirm(`Are you sure you want to delete invoice ${item.invoice_number}?`)) return;

    const { error } = await supabase.from("invoices").delete().eq("id", item.id);

    if (error) {
      toast.error("Failed to delete invoice");
      console.error(error);
    } else {
      toast.success("Invoice deleted successfully");
      fetchData();
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="invoice-start-date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Start Date
          </Label>
          <Input
            id="invoice-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="invoice-end-date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            End Date
          </Label>
          <Input
            id="invoice-end-date"
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
        title="Invoices"
        columns={columns}
        data={data}
        isLoading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search invoices..."
      />

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
};

