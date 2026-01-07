import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, ClipboardList, Receipt, CheckSquare, UserCircle } from "lucide-react";
import { GuestProfilesSection } from "./pms/GuestProfilesSection";
import { HousekeepingTasksSection } from "./pms/HousekeepingTasksSection";
import { FrontDeskSection } from "./pms/FrontDeskSection";
import { InvoicesSection } from "./pms/InvoicesSection";
import { StaffTasksSection } from "./pms/StaffTasksSection";

interface PMSDashboardProps {
  userRole?: string;
}

export const PMSDashboard = ({ userRole = "staff" }: PMSDashboardProps) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Building2 className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Property Management System</h1>
          <p className="text-muted-foreground">
            Manage front desk, housekeeping, billing, and guest services
          </p>
        </div>
      </div>

      <Tabs defaultValue="guests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Guest Profiles
          </TabsTrigger>
          <TabsTrigger value="frontdesk" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Front Desk
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Housekeeping
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guests">
          <GuestProfilesSection />
        </TabsContent>

        <TabsContent value="frontdesk">
          <FrontDeskSection />
        </TabsContent>

        <TabsContent value="housekeeping">
          <HousekeepingTasksSection />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesSection userRole={userRole} />
        </TabsContent>

        <TabsContent value="tasks">
          <StaffTasksSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

