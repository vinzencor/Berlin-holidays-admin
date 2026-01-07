import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoomTypesSection } from "@/components/admin/sections/RoomTypesSection";
import { BookingsSection } from "@/components/admin/sections/BookingsSection";
import { RoomAvailabilitySection } from "@/components/admin/sections/RoomAvailabilitySection";
import { PricingPlansSection } from "@/components/admin/sections/PricingPlansSection";
import { RatePlansSection } from "@/components/admin/sections/RatePlansSection";
import { ServicesSection } from "@/components/admin/sections/ServicesSection";
import { StaffSection } from "@/components/admin/sections/StaffSection";
import { PMSDashboard } from "@/components/admin/sections/PMSDashboard";
import { RMSDashboard } from "@/components/admin/sections/RMSDashboard";
import { ReportsSection } from "@/components/admin/sections/ReportsSection";
import { ExpensesSection } from "@/components/admin/sections/ExpensesSection";
import { PricingCalendarSection } from "@/components/admin/sections/PricingCalendarSection";
import ReferencesSection from "@/components/admin/sections/ReferencesSection";
import { useUserRole } from "@/hooks/useUserRole";

// Import the new calendar-based dashboard
import NewDashboard from "./NewDashboard";

const Admin = () => {
  const [currentSection, setCurrentSection] = useState("dashboard");
  const { userRole } = useUserRole();

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <NewDashboard />;
      case "staff":
        return (
          <div className="p-6">
            <StaffSection />
          </div>
        );
      case "pms":
        return <PMSDashboard userRole={userRole} />;
      case "rms":
        return <RMSDashboard />;
      case "bookings":
        return (
          <div className="p-6">
            <BookingsSection userRole={userRole} />
          </div>
        );
      case "availability":
        return (
          <div className="p-6">
            <RoomAvailabilitySection />
          </div>
        );
      case "pricing-plans":
        return (
          <div className="p-6">
            <PricingPlansSection />
          </div>
        );
      case "rate-plans":
        return (
          <div className="p-6">
            <RatePlansSection />
          </div>
        );
      case "services":
        return (
          <div className="p-6">
            <ServicesSection />
          </div>
        );
      case "reports":
        return <ReportsSection />;
      case "rooms":
        return (
          <div className="p-6">
            <RoomTypesSection />
          </div>
        );
      case "expenses":
        return (
          <div className="p-6">
            <ExpensesSection />
          </div>
        );
      case "pricing-calendar":
        return (
          <div className="p-6">
            <PricingCalendarSection />
          </div>
        );
      case "references":
        return (
          <div className="p-6">
            <ReferencesSection />
          </div>
        );
      default:
        return <NewDashboard />;
    }
  };

  return (
    <AdminLayout currentSection={currentSection} onSectionChange={setCurrentSection}>
      {renderSection()}
    </AdminLayout>
  );
};

export default Admin;

