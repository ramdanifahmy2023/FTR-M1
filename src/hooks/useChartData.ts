import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useCategories } from "./useCategories.ts";

// Tipe untuk Pie Chart (Pendapatan/Pengeluaran per Kategori)
export interface PieChartData {
    name: string;
    value: number;
    color: string;
    icon: string | null;
}

// Tipe untuk Bar Chart (Perbandingan Bulan)
export interface ComparisonChartData {
    name: string;
    currentMonth: number;
    previousMonth: number;
}

/**
 * Hook untuk mengambil data yang spesifik untuk Chart di Dashboard.
 * Data dihitung berdasarkan periode "this-month".
 */
export function useChartData() {
    const { user } = useAuth();
    const userId = user?.id;

    // Ambil semua kategori untuk mapping nama dan warna
    const { categories: allIncomeCategories } = useCategories("income");
    const { categories: allExpenseCategories } = useCategories("expense");
    const allUniqueCategories = [...allIncomeCategories, ...allExpenseCategories];

    const queryKey = ["dashboard_charts"];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!userId) return null;

            const now = new Date();
            const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
            const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");

            const lastMonth = subMonths(now, 1);
            const prevMonthStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
            const prevMonthEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");
            
            // 1. Fetch Transaksi Bulan Ini dan Bulan Lalu
            const { data: transactions, error: transError } = await supabase
                .from("transactions")
                .select("amount, type, category_id, transaction_date")
                .eq("user_id", userId)
                .gte("transaction_date", prevMonthStart)
                .lte("transaction_date", currentMonthEnd);

            if (transError) throw new Error(transError.message);

            const allTransactions = transactions || [];

            // --- HITUNG DATA PIE CHART (Current Month) ---
            const currentMonthTransactions = allTransactions.filter(t => 
                t.transaction_date >= currentMonthStart && t.transaction_date <= currentMonthEnd
            );
            
            // Menggunakan Map dengan ID unik (atau string unik) sebagai key
            const incomeMap = new Map<string, number>();
            const expenseMap = new Map<string, number>();

            currentMonthTransactions.forEach(t => {
                const amount = Number(t.amount);
                const isIncome = t.type === 'income';
                const map = isIncome ? incomeMap : expenseMap;
                
                // Gunakan category_id atau string unik untuk uncategorized
                const mapKey = t.category_id || (isIncome ? "UNCAT_INCOME_KEY" : "UNCAT_EXPENSE_KEY");

                const current = map.get(mapKey) || 0;
                map.set(mapKey, current + amount);
            });
            
            const mapToPieData = (map: Map<string, number>, transactionType: 'income' | 'expense'): PieChartData[] => {
                return Array.from(map.entries())
                    .map(([mapKey, amount]) => {
                        const typeLabel = transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran';
                        let name: string;
                        let color: string;
                        let icon: string | null = null;
                        
                        if (mapKey === "UNCAT_INCOME_KEY" || mapKey === "UNCAT_EXPENSE_KEY") {
                            // Data Uncategorized
                            name = `Uncategorized (${typeLabel})`;
                            color = transactionType === 'income' ? 'hsl(142 76% 56%)' : 'hsl(0 84% 70%)'; // Warna default
                        } else {
                            // Data Terkategori
                            const category = allUniqueCategories.find(c => c.id === mapKey);
                            name = category?.name || `Uncategorized (${typeLabel})`;
                            color = category?.color || (transactionType === 'income' ? 'hsl(142 76% 56%)' : 'hsl(0 84% 70%)');
                            icon = category?.icon || null;
                        }

                        return {
                            name: name,
                            value: amount,
                            color: color,
                            icon: icon,
                        };
                    })
                    .filter(item => item.value > 0) // Pastikan hanya data bernilai > 0 yang masuk
                    .sort((a, b) => b.value - a.value); // Sort descending
            };

            const incomePieData = mapToPieData(incomeMap, 'income');
            const expensePieData = mapToPieData(expenseMap, 'expense');

            // --- HITUNG DATA COMPARISON CHART (Pemasukan vs Pengeluaran per Bulan) ---
            
            const currentIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
            const currentExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

            const prevMonthTransactions = allTransactions.filter(t => 
                t.transaction_date >= prevMonthStart && t.transaction_date <= prevMonthEnd
            );

            const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
            const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
            
            const comparisonData: ComparisonChartData[] = [
                {
                    name: 'Pemasukan',
                    currentMonth: currentIncome,
                    previousMonth: prevIncome,
                },
                {
                    name: 'Pengeluaran',
                    currentMonth: currentExpense,
                    previousMonth: prevExpense,
                },
            ];

            // --- HITUNG DATA TREND LINE CHART (30 Hari Terakhir) ---

            const dayMap = new Map<string, { income: number, expense: number }>();
            const today = new Date();
            
            // Populate map dengan 30 hari terakhir
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateKey = format(date, "yyyy-MM-dd");
                dayMap.set(dateKey, { income: 0, expense: 0 });
            }

            allTransactions
                .filter(t => {
                    const transDate = new Date(t.transaction_date);
                    // Filter hanya transaksi dalam 30 hari terakhir
                    return transDate >= subMonths(today, 1) && transDate <= today; 
                })
                .forEach(t => {
                    const dateKey = t.transaction_date;
                    const amount = Number(t.amount);
                    if (dayMap.has(dateKey)) {
                        const current = dayMap.get(dateKey)!;
                        if (t.type === 'income') {
                            current.income += amount;
                        } else {
                            current.expense += amount;
                        }
                    }
                });
            
            const trendData = Array.from(dayMap.entries())
                .map(([date, values]) => ({
                    date: format(new Date(date), 'dd/MM'),
                    Income: values.income,
                    Expense: values.expense,
                }))
                .slice(-15); // Ambil 15 data terakhir untuk tampilan yang ringkas

            return {
                incomePieData,
                expensePieData,
                comparisonData,
                trendData,
            };
        },
        enabled: !!userId,
    });

    return {
        chartData: data,
        isLoading,
    };
}