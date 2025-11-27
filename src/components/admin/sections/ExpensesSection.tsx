import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "../DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExpenseDialog } from "../dialogs/ExpenseDialog";
import { ExpenseCategoryDialog } from "../dialogs/ExpenseCategoryDialog";
import { Calendar, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ExpensesSection = () => {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchCategories = async () => {
    const { data: cats, error } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error) {
      setCategories(cats || []);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    let query = supabase
      .from("expenses")
      .select("*, staff:staff_id(first_name, last_name)");

    // Apply date filters
    if (startDate) {
      query = query.gte("expense_date", startDate);
    }
    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data: expenses, error } = await query.order("expense_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch expenses");
      console.error(error);
    } else {
      setData(expenses || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedCategory]);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete expense");
      console.error(error);
    } else {
      toast.success("Expense deleted successfully");
      fetchData();
    }
  };

  const columns = [
    {
      key: "expense_date",
      label: "Date",
      render: (value: string) => format(new Date(value), "dd/MM/yyyy"),
    },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    {
      key: "amount",
      label: "Amount",
      render: (value: number) => `₹${parseFloat(value?.toString() || "0").toLocaleString()}`,
    },
    { key: "vendor_name", label: "Vendor" },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (value: string) => (
        <Badge variant="outline">{value?.toUpperCase() || "N/A"}</Badge>
      ),
    },
    {
      key: "staff",
      label: "Staff",
      render: (value: any) => value ? `${value.first_name} ${value.last_name}` : "N/A",
    },
  ];

  return (
    <>
      <div className="mb-4 space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setCategoryDialogOpen(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="expense-start-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              id="expense-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="expense-end-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date
            </Label>
            <Input
              id="expense-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="category-filter" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <DataTable
        title="Expenses"
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder="Search expenses..."
      />

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        categories={categories}
        onSuccess={() => {
          fetchData();
          fetchCategories();
        }}
      />

      <ExpenseCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={fetchCategories}
      />
    </>
  );
};

