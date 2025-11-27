import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  categories: any[];
  onSuccess: () => void;
}

export const ExpenseDialog = ({ open, onOpenChange, item, categories, onSuccess }: ExpenseDialogProps) => {
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    amount: "",
    payment_method: "cash",
    vendor_name: "",
    receipt_number: "",
    notes: "",
    staff_id: "",
  });
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        expense_date: item.expense_date || new Date().toISOString().split('T')[0],
        category: item.category || "",
        description: item.description || "",
        amount: item.amount?.toString() || "",
        payment_method: item.payment_method || "cash",
        vendor_name: item.vendor_name || "",
        receipt_number: item.receipt_number || "",
        notes: item.notes || "",
        staff_id: item.staff_id || "",
      });
    } else {
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        category: "",
        description: "",
        amount: "",
        payment_method: "cash",
        vendor_name: "",
        receipt_number: "",
        notes: "",
        staff_id: "",
      });
    }
  }, [item, open]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("first_name");

    if (!error) {
      setStaffList(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      staff_id: formData.staff_id || null,
    };

    if (item) {
      const { error } = await supabase
        .from("expenses")
        .update(expenseData)
        .eq("id", item.id);

      if (error) {
        toast.error("Failed to update expense");
        console.error(error);
      } else {
        toast.success("Expense updated successfully");
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase
        .from("expenses")
        .insert([expenseData]);

      if (error) {
        toast.error("Failed to create expense");
        console.error(error);
      } else {
        toast.success("Expense created successfully");
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor_name">Vendor Name</Label>
              <Input
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="receipt_number">Receipt Number</Label>
              <Input
                id="receipt_number"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              />
            </div>
          </div>

          {formData.category === "Salary" && (
            <div>
              <Label htmlFor="staff_id">Staff Member</Label>
              <Select value={formData.staff_id} onValueChange={(value) => setFormData({ ...formData, staff_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? "Update" : "Create"} Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

