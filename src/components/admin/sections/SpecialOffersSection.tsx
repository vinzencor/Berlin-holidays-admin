import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SpecialOfferDialog } from "../dialogs/SpecialOfferDialog";

export const SpecialOffersSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: offers, error } = await supabase
      .from("special_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch special offers");
      console.error(error);
    } else {
      setData(offers || []);
    }
    setIsLoading(false);
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
    if (!confirm("Are you sure you want to delete this special offer?")) return;

    const { error } = await supabase
      .from("special_offers")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete special offer");
      console.error(error);
    } else {
      toast.success("Special offer deleted successfully");
      fetchData();
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    {
      key: "discount_percentage",
      label: "Discount %",
      render: (value: number) => (value ? `${value}%` : "-"),
    },
    {
      key: "discount_amount",
      label: "Discount Amount",
      render: (value: string) =>
        value ? `₹${parseFloat(value).toLocaleString()}` : "-",
    },
    {
      key: "valid_from",
      label: "Valid From",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "valid_to",
      label: "Valid To",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Special Offers"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search offers..."
      />
      <SpecialOfferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={fetchData}
      />
    </>
  );
};

