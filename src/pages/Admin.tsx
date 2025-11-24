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

// Import the existing dashboard
import Index from "./Index";

const Admin = () => {
  const [currentSection, setCurrentSection] = useState("dashboard");

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Index />;
      case "staff":
        return (
          <div className="p-6">
            <StaffSection />
          </div>
        );
      case "pms":
        return <PMSDashboard />;
      case "rms":
        return <RMSDashboard />;
      case "room-types":
        return (
          <div className="p-6">
            <RoomTypesSection />
          </div>
        );
      case "bookings":
        return (
          <div className="p-6">
            <BookingsSection />
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
      default:
        return <Index />;
    }
  };

  return (
    <AdminLayout currentSection={currentSection} onSectionChange={setCurrentSection}>
      {renderSection()}
    </AdminLayout>
  );
};

export default Admin;

