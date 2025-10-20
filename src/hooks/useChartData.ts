// src/hooks/useChartData.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Ganti subMonths dengan subDays dan tambahkan fungsi date-fns lainnya
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns";
import { useCategories } from "./useCategories"; // Pastikan path benar
import { useMemo } from 'react'; // <-- TAMBAHKAN IMPORT INI

// Tipe untuk Pie Chart
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

// Tipe untuk Trend Line Chart
export interface TrendChartData {
    date: string; // Format 'dd/MM'
    Income: number;
    Expense: number;
}


/**
 * Hook untuk mengambil data yang spesifik untuk Chart di Dashboard.
 */
export function useChartData() {
    const { user } = useAuth();
    const userId = user?.id;

    // Ambil semua kategori untuk mapping nama dan warna
    const { categories: allIncomeCategories } = useCategories("income");
    const { categories: allExpenseCategories } = useCategories("expense");
    // Gabungkan kategori sekali saja untuk efisiensi
    const allUniqueCategories = useMemo(() => {
        const categoriesMap = new Map<string, typeof allIncomeCategories[0]>();
        [...allIncomeCategories, ...allExpenseCategories].forEach(cat => {
            if (cat?.id) { // Pastikan id ada
                categoriesMap.set(cat.id, cat);
            }
        });
        return Array.from(categoriesMap.values());
    }, [allIncomeCategories, allExpenseCategories]);


    const queryKey = ["dashboard_charts"];

    const { data, isLoading } = useQuery<{
        incomePieData: PieChartData[];
        expensePieData: PieChartData[];
        comparisonData: ComparisonChartData[];
        trendData: TrendChartData[];
    } | null>({ // Tambahkan tipe return eksplisit
        queryKey,
        queryFn: async () => {
            if (!userId) return null;

            const now = new Date();
            // --- Tanggal untuk Trend Data (30 hari terakhir) ---
            const trendEndDate = endOfDay(now);
            const trendStartDate = startOfDay(subDays(now, 29)); // 30 hari termasuk hari ini

            // --- Tanggal untuk Comparison dan Pie (Bulan ini dan lalu) ---
            const currentMonthStart = startOfMonth(now);
            const currentMonthEnd = endOfMonth(now);
            const lastMonth = subMonths(now, 1);
            const prevMonthStart = startOfMonth(lastMonth);
            const prevMonthEnd = endOfMonth(lastMonth);

            // Tentukan tanggal paling awal yang dibutuhkan untuk semua chart
            const earliestDateNeeded = format(prevMonthStart < trendStartDate ? prevMonthStart : trendStartDate, "yyyy-MM-dd");
            const latestDateNeeded = format(trendEndDate, "yyyy-MM-dd");

            // Fetch transaksi dari tanggal paling awal hingga hari ini
            const { data: transactions, error: transError } = await supabase
                .from("transactions")
                .select("amount, type, category_id, transaction_date")
                .eq("user_id", userId)
                .gte("transaction_date", earliestDateNeeded)
                .lte("transaction_date", latestDateNeeded);

            if (transError) throw new Error(transError.message);
            const allTransactions = transactions || [];

            // --- HITUNG DATA PIE CHART (Current Month) ---
            const currentMonthStartStr = format(currentMonthStart, "yyyy-MM-dd");
            const currentMonthEndStr = format(currentMonthEnd, "yyyy-MM-dd");
            const currentMonthTransactions = allTransactions.filter(t =>
                t.transaction_date >= currentMonthStartStr && t.transaction_date <= currentMonthEndStr
            );

            const incomeMap = new Map<string, number>();
            const expenseMap = new Map<string, number>();
            currentMonthTransactions.forEach(t => {
                const amount = Number(t.amount);
                const isIncome = t.type === 'income';
                const map = isIncome ? incomeMap : expenseMap;
                // Gunakan category_id atau string unik "UNCATEGORIZED"
                const mapKey = t.category_id || "UNCATEGORIZED";
                const current = map.get(mapKey) || 0;
                map.set(mapKey, current + amount);
            });

            const mapToPieData = (map: Map<string, number>, transactionType: 'income' | 'expense'): PieChartData[] => {
                return Array.from(map.entries())
                    .map(([mapKey, amount]) => {
                        let name: string;
                        let color: string;
                        let icon: string | null = null;

                        if (mapKey === "UNCATEGORIZED") {
                            name = `Uncategorized (${transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'})`;
                            color = transactionType === 'income' ? 'hsl(142 76% 56%)' : 'hsl(0 84% 70%)'; // Default color
                        } else {
                            const category = allUniqueCategories.find(c => c.id === mapKey);
                            name = category?.name || `Kategori Dihapus (${mapKey.substring(0, 4)}...)`; // Handle deleted category
                            color = category?.color || (transactionType === 'income' ? 'hsl(142 76% 56%)' : 'hsl(0 84% 70%)');
                            icon = category?.icon || null;
                        }

                        return { name, value: amount, color, icon };
                    })
                    .filter(item => item.value > 0)
                    .sort((a, b) => b.value - a.value);
            };

            const incomePieData = mapToPieData(incomeMap, 'income');
            const expensePieData = mapToPieData(expenseMap, 'expense');


            // --- HITUNG DATA COMPARISON CHART ---
            const currentIncome = incomePieData.reduce((sum, item) => sum + item.value, 0);
            const currentExpense = expensePieData.reduce((sum, item) => sum + item.value, 0);

            const prevMonthStartStr = format(prevMonthStart, "yyyy-MM-dd");
            const prevMonthEndStr = format(prevMonthEnd, "yyyy-MM-dd");
            const prevMonthTransactions = allTransactions.filter(t =>
                t.transaction_date >= prevMonthStartStr && t.transaction_date <= prevMonthEndStr
            );

            const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
            const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

            const comparisonData: ComparisonChartData[] = [
                { name: 'Pemasukan', currentMonth: currentIncome, previousMonth: prevIncome },
                { name: 'Pengeluaran', currentMonth: currentExpense, previousMonth: prevExpense },
            ];


            // --- HITUNG DATA TREND LINE CHART (30 Hari Terakhir) ---
            const trendDataMap = new Map<string, { income: number, expense: number }>();
            const dateInterval = eachDayOfInterval({ start: trendStartDate, end: trendEndDate });

            // Inisialisasi map dengan semua tanggal
            dateInterval.forEach(date => {
                const dateKey = format(date, "yyyy-MM-dd");
                trendDataMap.set(dateKey, { income: 0, expense: 0 });
            });

            // Filter transaksi hanya dalam 30 hari terakhir
            const trendStartDateStr = format(trendStartDate, "yyyy-MM-dd");
            const trendEndDateStr = format(trendEndDate, "yyyy-MM-dd");
             const trendTransactions = allTransactions.filter(t =>
                 t.transaction_date >= trendStartDateStr && t.transaction_date <= trendEndDateStr
             );


            // Akumulasi data
            trendTransactions.forEach(t => {
                const dateKey = t.transaction_date; // Sudah dalam format YYYY-MM-DD
                const amount = Number(t.amount);
                const entry = trendDataMap.get(dateKey);
                if (entry) {
                    if (t.type === 'income') {
                        entry.income += amount;
                    } else {
                        entry.expense += amount;
                    }
                }
                // Jika dateKey tidak ada di map (seharusnya tidak terjadi), abaikan
            });

            // Konversi map ke array format chart
            const trendData: TrendChartData[] = Array.from(trendDataMap.entries())
                // Urutkan berdasarkan tanggal (kunci map) sebelum mapping
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([date, values]) => ({
                    // Format tanggal menjadi DD/MM untuk tampilan chart
                    date: format(new Date(date + 'T00:00:00'), 'dd/MM'), // Pastikan parse sbg local
                    Income: values.income,
                    Expense: values.expense,
                }));
             // Tidak perlu .slice() lagi karena kita ingin semua 30 hari

            return {
                incomePieData,
                expensePieData,
                comparisonData,
                trendData,
            };
        },
        enabled: !!userId && allUniqueCategories.length > 0, // Aktifkan hanya jika user ada DAN kategori sudah dimuat
        staleTime: 5 * 60 * 1000, // Cache data selama 5 menit
    });

    // Kembalikan data default jika masih loading atau error
    const defaultData = {
        incomePieData: [],
        expensePieData: [],
        comparisonData: [{ name: 'Pemasukan', currentMonth: 0, previousMonth: 0 }, { name: 'Pengeluaran', currentMonth: 0, previousMonth: 0 }],
        trendData: [],
    };


    return {
        // Jika data ada, gunakan data. Jika tidak (null atau undefined), gunakan defaultData
        chartData: data ?? defaultData,
        isLoading: isLoading && !data, // Anggap tidak loading jika sudah ada data lama (meskipun sedang refetch)
    };
}