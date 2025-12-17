"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Loading from "./loading";
import { getUserDetails } from "@/services/authServices";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";
import { useTokenManager } from "@/hooks/userTokenManager";
// import { getUser } from "@/services/settings/accountServices";
// import { useTokenManager } from "@/hooks/userTokenManager";

export default function Home() {
  const router = useRouter();
  const setUserData = useUserStore((state) => state.setUserData);

  // const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
  //   null
  // );
  // const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(
  //   null
  // );

  // const [microsoftAccessToken, setMicrosoftAccessToken] = useState<
  //   string | null
  // >(null);
  // const [microsoftRefreshToken, setMicrosoftRefreshToken] = useState<
  //   string | null
  // >(null);

  const redirectAccToUserRole = (userRole: string) => {
    router.push(`/${userRole}/dashboard`);
  };

  const getUserDetailsFn = async () => {
    try {
      const response = await getUserDetails();

      // console.log(response);
      if (!response?.current_role) {
        toast.error("You don't have any roles");
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        router.push("/auth/login");
        return;
      }

      Cookies.set("currentRole", response.current_role);
      // Save current role in cookie
      // Cookies.set("currentRole", response.current_role);

      // Calculate if plan is still valid
      const trialEndDate = new Date(response.subscription_end_date);
      const currentDate = new Date();
      const isPlanValid = trialEndDate > currentDate;

      Cookies.set("isPlanValid", isPlanValid ? "true" : "false");

      // Save in Zustand
      setUserData({
        userId: response.user_id,
        userEmail: response.email,
        assignedBy: response.assigned_by,
        userFirstName: response.first_name,
        userLastName: response.last_name,
        currentRole: response.current_role,
        assignedRoles: response.assigned_roles,
        assignedRolePermissions: response.permissions,
        orgId: response.organization_id,
        orgName: response.organization_name,
        companySize: response.company_size,
        isPlanValid,
        planExpiryDate: response.subscription_end_date,
        orgRoles: response.roles,
        orgRolesAccess: response.access,
        profilePic: response.image_url ?? null,
        orgPlan: response.subscription_tier,
        seoComplianceTriggerCount: response.seo_compliance_trigger_count,
        seoPerformanceTriggerCount: response.seo_performance_trigger_count,
        chatbotId: response.chatbot_id,
        newChatCount: response.chat_count,
        newTicketCount: response.ticket_count,
        trafficCount: response.totalVisitorsNow,
        onboarding: response.onboarding || {
          tours_completed: {},
          banners_seen: {},
          installation_guide: { syncWebsite: false, customizeChatbot: false },
          chatbot_installed: false,
        },
      });

      Cookies.set("roleAccess", JSON.stringify(response.access));
      redirectAccToUserRole(response.current_role);
    } catch (err) {
      console.error("Error fetching user details:", err);
      Cookies.remove("authToken");
      Cookies.remove("currentRole");
      router.push("/auth/login");
    }
  };

  // const getUserFn = async () => {
  //   // Google
  //   try {
  //     const googleResponse = await getUser({ provider: "GOOGLE" });
  //     const googleData = googleResponse.data;
  //     setGoogleAccessToken(googleData.access_token);
  //     setGoogleRefreshToken(googleData.refresh_token);
  //   } catch (error) {
  //     console.error("Failed to fetch Google token:", error);
  //   }

  //   // Microsoft
  //   try {
  //     const microsoftResponse = await getUser({ provider: "MICROSOFT" });
  //     const microsoftData = microsoftResponse.data;
  //     setMicrosoftAccessToken(microsoftData.access_token);
  //     setMicrosoftRefreshToken(microsoftData.refresh_token);
  //   } catch (error) {
  //     console.error("Failed to fetch Microsoft token:", error);
  //   }
  // };

  // const googleExpiry = localStorage.getItem("googleTokenExpiry");
  // const microsoftExpiry = localStorage.getItem("microsoftTokenExpiry");

  // useTokenManager("GOOGLE", googleRefreshToken || "", googleExpiry, () => {});
  // useTokenManager(
  //   "MICROSOFT",
  //   microsoftRefreshToken || "",
  //   microsoftExpiry,
  //   () => {}
  // );

  useTokenManager("GOOGLE", () => console.log("Google token updated:"));
  useTokenManager("MICROSOFT", () => console.log("Microsoft token updated"));
  useEffect(() => {
    const init = async () => {
      try {
        // await getUserFn(); // fetch both Google & Microsoft tokens
        await getUserDetailsFn(); // fetch user details
      } catch (error) {
        console.error("User is not authenticated", error);
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        router.push("/auth/login");
      }
    };

    init();
  }, []);

  return <Loading />;
}
