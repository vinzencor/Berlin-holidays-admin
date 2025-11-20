import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RoomTypesSection } from "@/components/admin/sections/RoomTypesSection";
import { BookingsSection } from "@/components/admin/sections/BookingsSection";
import { RoomAvailabilitySection } from "@/components/admin/sections/RoomAvailabilitySection";
import { PricingPlansSection } from "@/components/admin/sections/PricingPlansSection";
import { RatePlansSection } from "@/components/admin/sections/RatePlansSection";
import { ServiceCategoriesSection } from "@/components/admin/sections/ServiceCategoriesSection";
import { ServicesSection } from "@/components/admin/sections/ServicesSection";
import { SpecialOffersSection } from "@/components/admin/sections/SpecialOffersSection";
import { BlogPostsSection } from "@/components/admin/sections/BlogPostsSection";

// Import the existing dashboard
import Index from "./Index";

const Admin = () => {
  const [currentSection, setCurrentSection] = useState("dashboard");

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Index />;
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
      case "service-categories":
        return (
          <div className="p-6">
            <ServiceCategoriesSection />
          </div>
        );
      case "services":
        return (
          <div className="p-6">
            <ServicesSection />
          </div>
        );
      case "special-offers":
        return (
          <div className="p-6">
            <SpecialOffersSection />
          </div>
        );
      case "blog-posts":
        return (
          <div className="p-6">
            <BlogPostsSection />
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

