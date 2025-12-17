"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getTransactionHistory } from "@/services/billing/transactionService";
import Loading from "@/app/loading";

export function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getTransactionHistory();
        setTransactions(res || []);
      } catch {
        console.log("Failed to load transactions");
      }
      setLoading(false);
    }

    load();
  }, []);

  const getStatusBadge = (status: string | null, date: string) => {
    if (status === "success") {
      return <Badge className="bg-green-600 text-white">Success</Badge>;
    }

    // Calculate time difference
    const createdAt = new Date(date).getTime();
    const now = Date.now();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);

    if (diffHours <= 1) {
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    }

    return <Badge className="bg-red-600 text-white">Failed</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex h-full w-full flex-col p-4">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>

      <div className="border rounded-lg bg-background h-full relative overflow-hidden">
        {loading && (
          <div className="flex absolute inset-0 items-center justify-center h-full w-full bg-background/50">
            <Loading areaOnly />
          </div>
        )}

        {!loading && (
          <ScrollArea className="h-full">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-muted/70 rounded-lg backdrop-blur-xl">
                <tr className="border-b">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Tier</th>
                  <th className="p-3 text-left">Cycle</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3 text-left">Payment ID</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}

                {transactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    className="border-b hover:bg-muted/40 transition">
                    {/* Custom TXN ID */}
                    <td className="p-3">{index + 1}</td>

                    <td className="p-3">{tx.subscription_tier}</td>
                    <td className="p-3 capitalize">{tx.subscription_cycle}</td>
                    <td className="p-3">₹{tx.payment_amount}</td>

                    {/* Time-based status */}
                    <td className="p-3">
                      {getStatusBadge(tx.payment_status, tx.created_at)}
                    </td>

                    <td className="p-3">{tx.payment_order_id}</td>
                    <td className="p-3">{tx.payment_id || "-"}</td>
                    <td className="p-3">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export default Transactions;
