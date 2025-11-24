import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../../DataTable";
import { toast } from "sonner";
import { InvoiceDialog } from "../../dialogs/pms/InvoiceDialog";
import { Badge } from "@/components/ui/badge";

export const InvoicesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
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

