import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, BarChart3, Users2, Target } from "lucide-react";
import { DynamicPricingSection } from "./rms/DynamicPricingSection";
import { DemandForecastSection } from "./rms/DemandForecastSection";
import { CompetitorPricingSection } from "./rms/CompetitorPricingSection";
import { RevenueReportsSection } from "./rms/RevenueReportsSection";

export const RMSDashboard = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Revenue Management System</h1>
          <p className="text-muted-foreground">
            Smart pricing, forecasting, and revenue optimization
          </p>
        </div>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Dynamic Pricing
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Demand Forecast
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Revenue Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <DynamicPricingSection />
        </TabsContent>

        <TabsContent value="forecast">
          <DemandForecastSection />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorPricingSection />
        </TabsContent>

        <TabsContent value="reports">
          <RevenueReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

