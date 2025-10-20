// src/hooks/useDashboardStats.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
}

export interface DashboardStats {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number; // Saldo dari semua bank_accounts
    totalAssets: number;  // Nilai dari semua assets
}

// Function to calculate start/end date based on period
export const calculateDateRange = (period: string): DateRange => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "this-week":
        // Start of week (Sunday is 0, set to Sunday)
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Default ke 'this-month'
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    };
};

/**
 * Hook untuk mengambil data statistik dashboard
 */
export function useDashboardStats(period: string) {
    const { user } = useAuth();
    const userId = user?.id;
    const dateRange = calculateDateRange(period);

    // Pastikan query key bergantung pada periode filter
    const queryKey = ["dashboard_stats", period];

    const { data: stats, isLoading } = useQuery({
        queryKey,
        queryFn: async (): Promise<DashboardStats> => {
            if (!userId) return { totalIncome: 0, totalExpense: 0, totalBalance: 0, totalAssets: 0 };
            
            // 1. Fetch Transaksi (Income & Expense)
            const { data: transactions, error: transError } = await supabase
                .from("transactions")
                .select("amount, type")
                .eq("user_id", userId)
                .gte("transaction_date", dateRange.start)
                .lte("transaction_date", dateRange.end);

            if (transError) throw new Error(transError.message);

            const totalIncome = transactions
                .filter((t: any) => t.type === "income")
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            const totalExpense = transactions
                .filter((t: any) => t.type === "expense")
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);


            // 2. Fetch Total Balance (Semua Bank Accounts)
            const { data: bankAccounts, error: accError } = await supabase
                .from("bank_accounts")
                .select("balance")
                .eq("user_id", userId);

            if (accError) throw new Error(accError.message);
            
            const totalBalance = bankAccounts.reduce((sum: number, acc: any) => sum + Number(acc.balance), 0);

            
            // 3. Fetch Total Assets Value
            const { data: assets, error: assetError } = await supabase
                .from("assets")
                .select("current_value")
                .eq("user_id", userId);

            if (assetError) throw new Error(assetError.message);

            const totalAssets = assets.reduce((sum: number, asset: any) => sum + Number(asset.current_value), 0);

            
            return {
                totalIncome,
                totalExpense,
                totalBalance,
                totalAssets,
            };
        },
        enabled: !!userId,
    });

    return {
        stats: stats || { totalIncome: 0, totalExpense: 0, totalBalance: 0, totalAssets: 0 },
        isLoading,
        dateRange,
    };
}