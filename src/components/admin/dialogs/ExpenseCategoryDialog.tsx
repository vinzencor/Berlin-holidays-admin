import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpenseCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ExpenseCategoryDialog = ({ open, onOpenChange, onSuccess }: ExpenseCategoryDialogProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .order("name");

    if (!error) {
      setCategories(data || []);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("expense_categories")
      .insert([newCategory]);

    if (error) {
      toast.error("Failed to add category");
      console.error(error);
    } else {
      toast.success("Category added successfully");
      setNewCategory({ name: "", description: "" });
      fetchCategories();
      onSuccess();
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

    const { error } = await supabase
      .from("expense_categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
      console.error(error);
    } else {
      toast.success("Category deleted successfully");
      fetchCategories();
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Category */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Add New Category</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category_name">Category Name *</Label>
                <Input
                  id="category_name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Transportation"
                />
              </div>
              <div>
                <Label htmlFor="category_description">Description</Label>
                <Input
                  id="category_description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <Button onClick={handleAddCategory} disabled={loading} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Existing Categories */}
          <div className="space-y-2">
            <h3 className="font-semibold">Existing Categories</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.name}</span>
                      {cat.is_active && <Badge variant="secondary" className="text-xs">Active</Badge>}
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

