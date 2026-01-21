import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  DollarSign,
  Calendar,
  Settings,
  Tag,
  Briefcase,
  FileText,
  Menu,
  X,
  LayoutDashboard,
  Percent,
  LogOut,
  User,
  Users,
  TrendingUp,
  Building2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

// All navigation items for super admin
const allNavigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "staff"] },
  { id: "pricing-calendar", label: "Pricing Calendar", icon: Calendar, roles: ["super_admin"] },
  { id: "bookings", label: "Bookings", icon: Calendar, roles: ["super_admin", "staff"] },
  { id: "pms", label: "Invoices", icon: FileText, roles: ["super_admin", "staff"] },
  // { id: "availability", label: "Room Availability", icon: Calendar, roles: ["super_admin", "staff"] },
  { id: "references", label: "References", icon: Users, roles: ["super_admin"] },
  { id: "expenses", label: "Expenses", icon: Receipt, roles: ["super_admin"] },
  { id: "reports", label: "Reports & Analytics", icon: TrendingUp, roles: ["super_admin"] },
  { id: "staff", label: "Staff Management", icon: Users, roles: ["super_admin"] },
  { id: "password", label: "Change Password", icon: Settings, roles: ["super_admin", "staff"] },
  { id: "rms", label: "Revenue Management", icon: TrendingUp, roles: ["super_admin"] },
  { id: "rooms", label: "Rooms", icon: Home, roles: ["super_admin"] },
  { id: "pricing-plans", label: "Pricing Plans", icon: DollarSign, roles: ["super_admin"] },
  // { id: "rate-plans", label: "Rate Plans", icon: Percent, roles: ["super_admin"] },
  // { id: "services", label: "Services", icon: Settings, roles: ["super_admin"] },
];

export const AdminLayout = ({ children, currentSection, onSectionChange }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userRole } = useUserRole();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Berlin Holidays Admin</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex pt-16 lg:pt-0">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-16 lg:top-0 left-0 z-40 h-[calc(100vh-4rem)] lg:h-screen w-64 bg-card border-r border-border transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-6 border-b border-border hidden lg:block">
            <h1 className="text-2xl font-bold text-primary">Berlin Holidays</h1>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>

          <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-12rem)] lg:h-[calc(100%-14rem)]">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center  gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-start">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

