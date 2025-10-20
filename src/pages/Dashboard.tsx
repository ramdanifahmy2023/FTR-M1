// src/pages/Dashboard.tsx

import { useState, useEffect } from "react"; // <-- IMPORT useEffect
import { useQueryClient } from "@tanstack/react-query"; // <-- IMPORT useQueryClient
import { supabase } from "@/integrations/supabase/client"; // <-- IMPORT supabase client
import { useAuth } from "@/contexts/AuthContext"; // <-- IMPORT useAuth

// ... (Import komponen lainnya tetap sama) ...
import { CategorySummaryTable } from "@/components/dashboard/CategorySummaryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/currency";
import { AIFinancialSuggestion } from "@/components/dashboard/AIFinancialSuggestion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useChartData } from "@/hooks/useChartData.ts";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart.tsx";
import { ComparisonBarChart } from "@/components/dashboard/ComparisonBarChart.tsx";
import { DailyTrendLineChart } from "@/components/dashboard/DailyTrendLineChart.tsx";


export default function Dashboard() {

  const [period, setPeriod] = useState<string>("this-month");
  const queryClient = useQueryClient(); // <-- Dapatkan query client
  const { user } = useAuth(); // <-- Dapatkan user info

  // Hook untuk Summary Stats
  const { stats, isLoading: loadingStats } = useDashboardStats(period); // Ganti nama variabel loading

  // Hook untuk Chart Data
  const { chartData, isLoading: loadingCharts } = useChartData(); // Ganti nama variabel loading

  const isDataLoading = loadingStats || loadingCharts; // Gunakan nama baru

  // --- Realtime Subscription Effect ---
  useEffect(() => {
    // Pastikan user sudah ada sebelum membuat subscription
    if (!user) return;

    // Definisikan channel subscription
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Dengarkan semua event (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions',
          // Filter hanya untuk transaksi milik user yang sedang login
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Perubahan terdeteksi pada transaksi:', payload);
          // Invalidate query data chart agar React Query mengambil data baru
          queryClient.invalidateQueries({ queryKey: ['dashboard_charts'] });
          // Invalidate juga query stats jika diperlukan (misalnya jika stats berubah signifikan)
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats', period] });
          // Invalidate query ringkasan kategori
          queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Asumsi tabel ringkasan pakai query 'transactions'
        }
      )
      .subscribe();

    console.log("Subscribing to transactions changes...");

    // Cleanup function: Hapus subscription saat komponen unmount
    return () => {
      console.log("Unsubscribing from transactions changes...");
      supabase.removeChannel(channel);
    };

    // Jalankan effect ini ketika queryClient atau user berubah
  }, [queryClient, user, period]);
  // --- Akhir Realtime Subscription Effect ---


  const statCards = [
     // ... (Definisi statCards tetap sama) ...
    {
      title: "Total Income",
      value: stats.totalIncome,
      icon: TrendingUp,
      gradient: "gradient-success",
      textColor: "text-success",
    },
    {
      title: "Total Expense",
      value: stats.totalExpense,
      icon: TrendingDown,
      gradient: "gradient-danger",
      textColor: "text-danger",
    },
    {
      title: "Bank Balance",
      value: stats.totalBalance,
      icon: Wallet,
      gradient: "gradient-primary",
      textColor: "text-primary",
    },
    {
      title: "Total Assets",
      value: stats.totalAssets,
      icon: Briefcase,
      gradient: "gradient-primary",
      textColor: "text-primary",
    },
  ];

  if (isDataLoading && !chartData) { // Tampilkan loading hanya jika belum ada data chart awal
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // --- Render JSX (Struktur Umum Tetap Sama) ---
  return (
    <div className="space-y-6">
      {/* Header with period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
           {/* ... (Select options tetap sama) ... */}
           <SelectTrigger className="w-[180px]">
             <Calendar className="mr-2 h-4 w-4" />
             <SelectValue placeholder="Select period" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="today">Today</SelectItem>
             <SelectItem value="this-week">This Week</SelectItem>
             <SelectItem value="this-month">This Month</SelectItem>
             <SelectItem value="this-year">This Year</SelectItem>
             {/* <SelectItem value="custom-range" disabled>Custom Range</SelectItem> */}
           </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          // Card rendering tetap sama, tapi gunakan loadingStats jika ingin skeleton per card
          <Card key={stat.title} className="shadow-medium hover:shadow-large transition-shadow animate-slide-up">
            {/* ... (Card content tetap sama) ... */}
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 {stat.title}
               </CardTitle>
               <div className={`rounded-full p-2 ${stat.gradient}`}>
                 <stat.icon className="h-4 w-4 text-white" />
               </div>
             </CardHeader>
             <CardContent>
               <div className={`text-2xl font-bold ${stat.textColor}`}>
                 {loadingStats ? "..." : formatCurrency(stat.value)} {/* Tampilkan loading kecil */}
               </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      {/* Chart akan otomatis update karena data dari useChartData berubah */}
       {(period === 'this-month' || period === 'this-year') && chartData ? (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Visualisasi Keuangan</h2>
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Komponen Chart tetap sama, isLoading diambil dari loadingCharts */}
                <CategoryPieChart
                    data={chartData.incomePieData}
                    type="income"
                    isLoading={loadingCharts && !chartData.incomePieData} // Tampilkan skeleton hanya jika data belum ada
                />
                <CategoryPieChart
                    data={chartData.expensePieData}
                    type="expense"
                    isLoading={loadingCharts && !chartData.expensePieData}
                />
                <ComparisonBarChart
                    data={chartData.comparisonData}
                    isLoading={loadingCharts && !chartData.comparisonData}
                />
                <div className="lg:col-span-2">
                    <DailyTrendLineChart
                        data={chartData.trendData}
                        isLoading={loadingCharts && !chartData.trendData} // Tampilkan skeleton hanya jika data belum ada
                    />
                </div>
            </div>
        </div>
      ) : (
         // ... (Card placeholder tetap sama) ...
          <Card>
             <CardHeader>
                  <CardTitle className="text-lg">Financial Overview</CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="pt-4 text-sm text-muted-foreground">
                     Grafik detail tersedia untuk periode <strong>This Month</strong> atau <strong>This Year</strong>.
                 </div>
             </CardContent>
           </Card>
      )}


      {/* Tabel Ringkasan Kategori */}
      <div className="mt-6">
          {/* Komponen Tabel tetap sama, ia akan re-render jika data dari useTransactions berubah */}
          <CategorySummaryTable period={period} />
      </div>

      {/* Welcome Card & AI Suggestion */}
      {/* ... (Bagian ini tetap sama) ... */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-medium">
          {/* ... Welcome Card content ... */}
           <CardContent className="pt-6">
             <div className="text-center space-y-4">
               <h2 className="text-2xl font-semibold">Selamat Datang di Fintrack M7! 🎉</h2>
               <p className="text-muted-foreground">
                 Mulai lacak keuangan Anda dengan menambahkan transaksi, mengelola kategori,
                 dan memantau aset Anda.
               </p>
               {/* Anda bisa menambahkan Link atau onClick handler di sini */}
               <div className="flex gap-3 justify-center flex-wrap">
                 <Button className="gradient-primary" >Tambah Transaksi</Button> {/* Tambahkan onClick jika perlu */}
                 <Button variant="outline" >Lihat Laporan</Button> {/* Tambahkan onClick jika perlu */}
               </div>
             </div>
           </CardContent>
        </Card>

        <AIFinancialSuggestion />
      </div>

    </div>
  );
}