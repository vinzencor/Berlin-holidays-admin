import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: any;
  onSuccess: () => void;
}

export const StaffDialog = ({ open, onOpenChange, staff, onSuccess }: StaffDialogProps) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "housekeeper",
    department: "housekeeping",
    hire_date: new Date().toISOString().split('T')[0],
    salary: "",
    status: "active",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    access_role: "staff",
    password: "",
    create_login: false,
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        first_name: staff.first_name || "",
        last_name: staff.last_name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role || "housekeeper",
        department: staff.department || "housekeeping",
        hire_date: staff.hire_date || new Date().toISOString().split('T')[0],
        salary: staff.salary || "",
        status: staff.status || "active",
        address: staff.address || "",
        emergency_contact_name: staff.emergency_contact_name || "",
        emergency_contact_phone: staff.emergency_contact_phone || "",
        notes: staff.notes || "",
        access_role: staff.access_role || "staff",
        password: "",
        create_login: false,
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "housekeeper",
        department: "housekeeping",
        hire_date: new Date().toISOString().split('T')[0],
        salary: "",
        status: "active",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        notes: "",
        access_role: "staff",
        password: "",
        create_login: false,
      });
    }
  }, [staff, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let userId = null;

      // Create auth user if create_login is checked and it's a new staff member
      if (!staff && formData.create_login && formData.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              access_role: formData.access_role,
            },
          },
        });

        if (authError) {
          toast.error("Failed to create login credentials: " + authError.message);
          console.error(authError);
          return;
        }

        userId = authData.user?.id;
        toast.success("Login credentials created successfully");
      }

      const dataToSubmit = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        hire_date: formData.hire_date,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        status: formData.status,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        notes: formData.notes,
        access_role: formData.access_role,
        user_id: userId,
        is_active: true,
      };

      if (staff) {
        const { error } = await supabase
          .from("staff")
          .update(dataToSubmit)
          .eq("id", staff.id);

        if (error) {
          toast.error("Failed to update staff member");
          console.error(error);
        } else {
          toast.success("Staff member updated successfully");
          onSuccess();
          onOpenChange(false);
        }
      } else {
        const { error } = await supabase.from("staff").insert([dataToSubmit]);

        if (error) {
          toast.error("Failed to create staff member");
          console.error(error);
        } else {
          toast.success("Staff member created successfully");
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      toast.error("An error occurred: " + error.message);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="housekeeper">Housekeeper</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front_desk">Front Desk</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Login Credentials Section */}
          {!staff && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create_login"
                  checked={formData.create_login}
                  onChange={(e) => setFormData({ ...formData, create_login: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="create_login" className="cursor-pointer">
                  Create login credentials for this staff member
                </Label>
              </div>

              {formData.create_login && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="access_role">Access Role *</Label>
                    <Select
                      value={formData.access_role}
                      onValueChange={(value) => setFormData({ ...formData, access_role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff (Limited Access)</SelectItem>
                        <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={formData.create_login}
                      minLength={6}
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {staff ? "Update" : "Create"} Staff Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

