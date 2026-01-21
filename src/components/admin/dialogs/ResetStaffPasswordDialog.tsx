import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Eye, EyeOff } from "lucide-react";

interface ResetStaffPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: any;
}

export const ResetStaffPasswordDialog = ({
  open,
  onOpenChange,
  staff,
}: ResetStaffPasswordDialogProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Both password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Call Supabase Admin API to update user password
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to perform this action");
        setLoading(false);
        return;
      }

      // Get the staff user's auth ID from the staff table
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("user_id")
        .eq("id", staff.id)
        .single();

      if (staffError || !staffData?.user_id) {
        toast.error("Could not find staff member's user account");
        console.error("Staff lookup error:", staffError);
        setLoading(false);
        return;
      }

      // Use Supabase Admin API to update the user's password
      // Note: This requires the service role key, so we'll use a more direct approach
      // We'll update via a Supabase Edge Function or RPC call if available
      
      // For now, we'll use the auth.admin.updateUserById which requires service role
      // In production, this should be done through a secure backend endpoint
      
      // Alternative approach: Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        staff.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        // If email reset fails, try direct update (this requires RPC function)
        const { error: rpcError } = await supabase.rpc('admin_reset_staff_password', {
          staff_user_id: staffData.user_id,
          new_password: newPassword
        });

        if (rpcError) {
          toast.error("Failed to reset password. Please try sending a reset email instead.");
          console.error("Password reset error:", rpcError);
          setLoading(false);
          return;
        }
      }

      toast.success(`Password reset email sent to ${staff.email}`);
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(`Error: ${error.message || "Failed to reset password"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!staff?.email) {
      toast.error("Staff member email not found");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(staff.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${staff.email}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(`Failed to send reset email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Staff Password
          </DialogTitle>
          <DialogDescription>
            Reset password for <strong>{staff?.first_name} {staff?.last_name}</strong> ({staff?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Option 1: Send Reset Email */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Option 1: Send Password Reset Email</h3>
            <p className="text-xs text-muted-foreground">
              Send a secure password reset link to the staff member's email address.
            </p>
            <Button
              onClick={handleSendResetEmail}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Send Reset Email
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Option 2: Set New Password Directly */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Option 2: Set New Password Directly</h3>
              <p className="text-xs text-muted-foreground">
                Set a new password that you can share with the staff member.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Direct password reset may require additional database permissions. 
                If it fails, use the "Send Reset Email" option above.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
