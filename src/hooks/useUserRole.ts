import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>("staff");
  const { user } = useAuth();

  // Super admin allowlist so privileged users keep full access even if staff row is missing
  const superAdminEmails = useMemo(() => [
    "berlinholidays@gmail.com",
    "rahulpradeepan77@gmail.com",
  ], []);

  useEffect(() => {
    const fetchUserRole = async () => {
      // 1) Auth metadata hint
      const metadataRole = user?.user_metadata?.access_role as string | undefined;
      if (metadataRole === "super_admin") {
        setUserRole("super_admin");
        return;
      }

      // 2) Staff table lookup
      if (user) {
        const { data, error } = await supabase
          .from("staff")
          .select("access_role")
          .eq("user_id", user.id)
          .single();

        if (data && !error) {
          setUserRole(data.access_role || "staff");
          return;
        }
      }

      // 3) Email allowlist fallback for super admins without staff linkage
      if (user?.email && superAdminEmails.includes(user.email.toLowerCase())) {
        setUserRole("super_admin");
      }
    };

    fetchUserRole();
  }, [user, superAdminEmails]);

  return { userRole, isSuperAdmin: userRole === "super_admin", isStaff: userRole === "staff" };
};
