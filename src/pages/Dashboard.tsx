// src/pages/Dashboard.tsx

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CategorySummaryTable } from "@/components/dashboard/CategorySummaryTable"; // Impor tabel ringkasan
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/utils/currency";
import { AIFinancialSuggestion } from "@/components/dashboard/AIFinancialSuggestion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  Calendar,
  Plus,
  Minus,
  FileWarning // Impor FileWarning untuk skeleton
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useChartData } from "@/hooks/useChartData.ts";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart.tsx"; // Impor Pie Chart
import { ComparisonBarChart } from "@/components/dashboard/ComparisonBarChart.tsx"; // Impor Bar Chart
import { DailyTrendLineChart } from "@/components/dashboard/DailyTrendLineChart.tsx"; // Impor Line/Area Chart
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [period, setPeriod] = useState<string>("this-month");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading: loadingStats } = useDashboardStats(period);
  const { chartData, isLoading: loadingCharts } = useChartData();
  // Kombinasikan state loading
  const isDataLoading = loadingStats || loadingCharts;

  // Realtime Subscription Effect (untuk update data otomatis)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        (_payload) => {
          // Invalidate queries untuk refresh data saat ada perubahan transaksi
          queryClient.invalidateQueries({ queryKey: ['dashboard_charts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats', period] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['bank_accounts']});
          queryClient.invalidateQueries({ queryKey: ['assets']});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user, period]);

  // Fungsi untuk menutup modal Quick Add
  const closeQuickAddDialog = () => setIsQuickAddOpen(false);

  // Data untuk kartu ringkasan
  const statCards = [
    { title: "Total Income", value: stats.totalIncome, icon: TrendingUp, gradient: "gradient-success", textColor: "text-success" },
    { title: "Total Expense", value: stats.totalExpense, icon: TrendingDown, gradient: "gradient-danger", textColor: "text-danger" },
    { title: "Bank Balance", value: stats.totalBalance, icon: Wallet, gradient: "gradient-primary", textColor: "text-primary" },
    { title: "Total Assets", value: stats.totalAssets, icon: Briefcase, gradient: "gradient-primary", textColor: "text-primary" },
  ];

  // --- Skeleton Loading State ---
   if (isDataLoading && !chartData?.trendData.length && !stats.totalIncome && !stats.totalExpense) {
      return (
        <div className="space-y-6 animate-pulse"> {/* Tambah animasi pulse */}
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-full sm:w-[180px]" /> {/* Lebar penuh di mobile */}
          </div>
          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
          {/* Charts Skeleton (Contoh 3 chart) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg lg:col-span-2" /> {/* Chart Trend */}
          </div>
          {/* Table Skeleton */}
          <Skeleton className="h-64 w-full rounded-lg" />
          {/* Welcome & AI Skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      );
    }
  // --- Akhir Skeleton Loading State ---

  return (
    <div className="space-y-6">
      {/* Header with period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
           <SelectTrigger className="w-full sm:w-[180px]"> {/* Lebar penuh di mobile */}
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hari Ini</SelectItem>
            <SelectItem value="this-week">Minggu Ini</SelectItem>
            <SelectItem value="this-month">Bulan Ini</SelectItem>
            <SelectItem value="this-year">Tahun Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-medium hover:shadow-large transition-shadow animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-1.5 ${stat.gradient}`}> {/* Padding sedikit dikurangi */}
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {/* Tampilkan skeleton di dalam card jika hanya loadingStats */}
                {loadingStats ? <Skeleton className="h-8 w-3/4 inline-block" /> : formatCurrency(stat.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid gap-4 lg:grid-cols-2">
         {/* Pie Charts */}
         <CategoryPieChart
              data={chartData.incomePieData}
              type="income"
              isLoading={loadingCharts && !chartData.incomePieData?.length}
          />
          <CategoryPieChart
              data={chartData.expensePieData}
              type="expense"
              isLoading={loadingCharts && !chartData.expensePieData?.length}
          />
          {/* Comparison Bar Chart (Lebar penuh jika salah satu pie kosong?) */}
           {/* Tampilkan Comparison jika ada data, atau jika masih loading */}
           {(chartData.comparisonData?.some(d => d.currentMonth > 0 || d.previousMonth > 0) || loadingCharts) && (
               <div className="lg:col-span-1">
                   <ComparisonBarChart
                       data={chartData.comparisonData}
                       isLoading={loadingCharts && !chartData.comparisonData?.length}
                   />
               </div>
           )}

          {/* Daily Trend Line/Area Chart (selalu lebar penuh di bawah) */}
          <div className="lg:col-span-2">
              <DailyTrendLineChart
                  data={chartData.trendData}
                  isLoading={loadingCharts && !chartData.trendData?.length}
              />
          </div>
      </div>

      {/* Tabel Ringkasan Kategori (Sudah dibuat mobile-friendly) */}
      <CategorySummaryTable period={period} />

      {/* Welcome Card & AI Suggestion */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Selamat Datang di Fintrack M7! 🎉</h2>
              <p className="text-muted-foreground">
                Mulai lacak keuangan Anda dengan menambahkan transaksi, mengelola kategori,
                dan memantau aset Anda.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                 {/* Tombol Tambah Transaksi (membuka modal) */}
                 <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary">
                            <Plus className="mr-2 h-4 w-4"/> Tambah Transaksi
                        </Button>
                    </DialogTrigger>
                    {/* Konten Modal Quick Add */}
                    <DialogContent className="sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle>Tambah Transaksi Cepat</DialogTitle>
                        <DialogDescription>
                            Pilih tipe dan masukkan detail transaksi Anda.
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="expense" className="w-full pt-2">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="expense" className="text-danger data-[state=active]:bg-danger/10 data-[state=active]:text-danger">
                            <Minus className="h-4 w-4 mr-1" /> Pengeluaran
                          </TabsTrigger>
                          <TabsTrigger value="income" className="text-success data-[state=active]:bg-success/10 data-[state=active]:text-success">
                            <Plus className="h-4 w-4 mr-1" /> Pemasukan
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="expense" className="pt-4">
                          <TransactionForm defaultType="expense" onClose={closeQuickAddDialog} />
                        </TabsContent>
                        <TabsContent value="income" className="pt-4">
                          <TransactionForm defaultType="income" onClose={closeQuickAddDialog} />
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                 </Dialog>

                 {/* Tombol Lihat Laporan (navigasi) */}
                 <Button variant="outline" onClick={() => navigate('/reports')}>
                    Lihat Laporan
                 </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* AI Suggestion */}
        <AIFinancialSuggestion />
      </div>
    </div>
  );
}