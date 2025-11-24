import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { InvoiceDialog } from "../../dialogs/pms/InvoiceDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const InvoicesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleDownload = (invoice: any) => {
    // Create invoice content
    const invoiceContent = `
INVOICE
========================================

Invoice Number: ${invoice.invoice_number}
Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

----------------------------------------

Total Amount: ₹${invoice.total_amount?.toFixed(2) || '0.00'}
Paid Amount: ₹${invoice.paid_amount?.toFixed(2) || '0.00'}
Balance: ₹${invoice.balance?.toFixed(2) || '0.00'}

Payment Status: ${invoice.payment_status?.toUpperCase()}

----------------------------------------

Notes: ${invoice.notes || 'N/A'}

========================================
Generated on: ${new Date().toLocaleString()}
    `.trim();

    // Create blob and download
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoice_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Invoice ${invoice.invoice_number} downloaded`);
  };

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "issue_date", label: "Issue Date" },
    { key: "due_date", label: "Due Date" },
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
        return <Badge variant={colors[value] || "outline"}>{value}</Badge>;
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
          Download
        </Button>
      )
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    const { data: invoiceData, error } = await supabase
      .from("invoices")
      .select("*")
      .order("issue_date", { ascending: false });

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

