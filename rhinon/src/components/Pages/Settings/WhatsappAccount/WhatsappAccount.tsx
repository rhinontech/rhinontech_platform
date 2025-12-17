"use client";

import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import EmbeddedSignup from "@/components/WhatsApp/EmbeddedSignup";
import AccountList from "@/components/WhatsApp/AccountList";
import MessageSender from "@/components/WhatsApp/MessageSender";
import { getWhatsAppAccounts, type WhatsAppAccount } from "@/services/settings/whatsappServices";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WhatsappAccountPage() {
  const { toggleSettingSidebar } = useSidebar();
  const [showSignup, setShowSignup] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await getWhatsAppAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshTrigger]);

  const handleSuccess = (account: any) => {
    console.log("Account connected:", account);
    setShowSignup(false);
    setShowHistory(true); // Show the list after connection
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleError = (error: string) => {
    console.error("Connection error:", error);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full rounded-lg border bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no accounts are connected and we are not in "history" mode or manual signup mode,
  // show the Embedded Signup directly as the default view.
  const isDefaultEmptyState = accounts.length === 0 && !showHistory && !showSignup;

  return (
    <div className="flex h-full w-full rounded-lg border bg-background">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          <div className="flex items-center gap-4">
            <PanelLeft onClick={toggleSettingSidebar} className="h-4 w-4 cursor-pointer" />
            <h2 className="text-base font-bold">WhatsApp Accounts</h2>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-0">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {isDefaultEmptyState ? (
              <div className="flex flex-col gap-6">
                 <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-6">Connect New Account</h3>
                    <EmbeddedSignup
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                 </div>
                 <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Want to see previously connected accounts?</p>
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                        View Previous Accounts
                    </button>
                 </div>
              </div>
            ) : showSignup ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Connect New Account</h3>
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <EmbeddedSignup
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </div>
            ) : (
              <>
                <AccountList
                  accounts={accounts}
                  isLoading={isLoading}
                  onConnect={() => setShowSignup(true)}
                  onRefresh={fetchAccounts}
                />
                
                {accounts.length === 0 && (
                     <div className="mt-4 text-center">
                        <button 
                            onClick={() => setShowHistory(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                        >
                            ← Back to Connect
                        </button>
                     </div>
                )}
              </>
            )}
          </div>
        </div>
        </ScrollArea>
      </div>
    </div>
  );
}
