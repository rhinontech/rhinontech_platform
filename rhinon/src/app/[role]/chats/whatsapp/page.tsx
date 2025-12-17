"use client";

import { useState, useEffect } from "react";
import WhatsAppChat from "@/components/Pages/Chats/WhatsApp/WhatsAppChat";
import { getWhatsAppAccounts, type WhatsAppAccount } from "@/services/settings/whatsappServices";
import Loading from "@/app/loading";

export default function WhatsAppPage() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      // Start timer to enforce minimum loading time
      const startTime = Date.now();

      try {
        const data = await getWhatsAppAccounts();

        // Calculate remaining time to meet 1s minimum
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Filter and Sort Accounts
        const filteredAndSorted = (data || [])
          .filter((acc) => acc.status === "active") // Only show active accounts
          .sort((a, b) => {
            // Default account comes first
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return 0;
          });

        setAccounts(filteredAndSorted);
      } catch (error) {
        console.error("Failed to fetch accounts", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  if (isLoading) {
    return <Loading areaOnly />;
  }

  return (
    <div className="h-full w-full">
      <WhatsAppChat accounts={accounts} />
    </div>
  );
}
