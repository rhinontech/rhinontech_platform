"use client";

import { useEffect, useState } from "react";
import {
  getWhatsAppAccounts,
  disconnectWhatsAppAccount,
  setDefaultWhatsAppAccount,
  type WhatsAppAccount,
} from "@/services/settings/whatsappServices";

interface AccountListProps {
  onConnect?: () => void;
  refreshTrigger?: number;
  onAccountsLoaded?: (accounts: WhatsAppAccount[]) => void;
}

export default function AccountList({
  onConnect,
  refreshTrigger,
  onAccountsLoaded,
  accounts: externalAccounts,
  isLoading: externalIsLoading,
  onRefresh,
}: AccountListProps & {
  accounts?: WhatsAppAccount[];
  isLoading?: boolean;
  onRefresh?: () => void;
}) {
  const [internalAccounts, setInternalAccounts] = useState<WhatsAppAccount[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<number | null>(null);
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  const isControlled = typeof externalAccounts !== "undefined";
  const accounts = isControlled ? externalAccounts : internalAccounts;
  const isLoading = isControlled ? externalIsLoading : internalIsLoading;

  const fetchAccounts = async () => {
    if (isControlled) {
      onRefresh?.();
      return;
    }
    try {
      setInternalIsLoading(true);
      setError(null);
      const data = await getWhatsAppAccounts();
      setInternalAccounts(data);
      onAccountsLoaded?.(data);
    } catch (err: any) {
      setError(err.message || "Failed to load WhatsApp accounts");
    } finally {
      setInternalIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isControlled) {
      fetchAccounts();
    }
  }, [refreshTrigger, isControlled]);

  const handleDisconnect = async (accountId: number) => {
    if (
      !confirm("Are you sure you want to disconnect this WhatsApp account?")
    ) {
      return;
    }

    try {
      setDisconnecting(accountId);
      await disconnectWhatsAppAccount(accountId);
      await fetchAccounts(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSetDefault = async (accountId: number) => {
    try {
      setSettingDefault(accountId);
      await setDefaultWhatsAppAccount(accountId);
      await fetchAccounts(); // Refresh list to show updated default
    } catch (err: any) {
      alert(err.message || "Failed to set default account");
    } finally {
      setSettingDefault(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.688" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No WhatsApp Accounts Connected
        </h3>
        <p className="text-gray-600 mb-4">
          Connect your WhatsApp Business account to start messaging
        </p>
        {onConnect && (
          <button
            onClick={onConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Connect WhatsApp Account
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        {onConnect && (
          <button
            onClick={onConnect}
            className="bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Add Another Account
          </button>
        )}
      </div>

      {accounts.map((account) => (
        <div
          key={account.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.688" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white/70">
                    {account.verified_name}
                  </h4>
                  {account.is_default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      ⭐ Default
                    </span>
                  )}
                  {account.status === "active" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                  {account.status === "disconnected" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {account.display_phone_number}
                </p>
                {account.quality_rating && (
                  <p className="text-xs text-gray-500 mt-1">
                    Quality: {account.quality_rating}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Connected on{" "}
                  {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {account.status === "active" && (
                <>
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      disabled={settingDefault === account.id}
                      className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {settingDefault === account.id
                        ? "Setting..."
                        : "Set as Default"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {disconnecting === account.id
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
