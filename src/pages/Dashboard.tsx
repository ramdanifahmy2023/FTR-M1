// src/pages/Dashboard.tsx

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // <-- Import useNavigate
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CategorySummaryTable } from "@/components/dashboard/CategorySummaryTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/utils/currency";
import { AIFinancialSuggestion } from "@/components/dashboard/AIFinancialSuggestion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Briefcase,
  Calendar,
  Plus, // <-- Import Plus
  Minus // <-- Import Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import Dialog components for Quick Add
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger // <-- Import DialogTrigger
} from "@/components/ui/dialog";
// Import Tabs and TransactionForm for Quick Add
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useChartData } from "@/hooks/useChartData.ts";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart.tsx";
import { ComparisonBarChart } from "@/components/dashboard/ComparisonBarChart.tsx";
import { DailyTrendLineChart } from "@/components/dashboard/DailyTrendLineChart.tsx";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [period, setPeriod] = useState<string>("this-month");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false); // <-- State for Quick Add modal
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // <-- Initialize useNavigate
  const { user } = useAuth();
  const { stats, isLoading: loadingStats } = useDashboardStats(period);
  const { chartData, isLoading: loadingCharts } = useChartData();
  const isDataLoading = loadingStats || loadingCharts;

  // --- Realtime Subscription Effect (Tetap Sama) ---
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        (_payload) => {
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
  // --- Akhir Realtime Subscription Effect ---

  // Fungsi untuk menutup modal Quick Add
  const closeQuickAddDialog = () => setIsQuickAddOpen(false);

  const statCards = [
    // ... (statCards array tetap sama) ...
    { title: "Total Income", value: stats.totalIncome, icon: TrendingUp, gradient: "gradient-success", textColor: "text-success" },
    { title: "Total Expense", value: stats.totalExpense, icon: TrendingDown, gradient: "gradient-danger", textColor: "text-danger" },
    { title: "Bank Balance", value: stats.totalBalance, icon: Wallet, gradient: "gradient-primary", textColor: "text-primary" },
    { title: "Total Assets", value: stats.totalAssets, icon: Briefcase, gradient: "gradient-primary", textColor: "text-primary" },
  ];

  // --- Skeleton Loading (Tetap Sama) ---
   if (isDataLoading && !chartData?.trendData.length && !stats.totalIncome && !stats.totalExpense) {
      // ... (kode skeleton tetap sama) ...
       return (
         <div className="space-y-6">
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
             <Skeleton className="h-9 w-48" />
             <Skeleton className="h-10 w-[180px]" />
           </div>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
           </div>
           <Skeleton className="h-96 w-full" />
           <Skeleton className="h-64 w-full" />
           <div className="grid gap-4 md:grid-cols-2">
             <Skeleton className="h-48 w-full" />
             <Skeleton className="h-48 w-full" />
           </div>
         </div>
       );
    }
    // --- Akhir Skeleton Loading ---


  return (
    <div className="space-y-6">
      {/* Header with period filter (Tetap Sama) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          {/* ... (Select component tetap sama) ... */}
           <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Stats Grid (Tetap Sama) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... (mapping statCards tetap sama) ... */}
         {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-medium hover:shadow-large transition-shadow animate-slide-up">
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
                {loadingStats ? <Skeleton className="h-8 w-3/4 inline-block" /> : formatCurrency(stat.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section Refactored (Tetap Sama) */}
      <div className="grid gap-4 lg:grid-cols-2">
         {/* ... (Kode Charts tetap sama) ... */}
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
          <div className={(chartData.incomePieData?.length || chartData.expensePieData?.length) ? "lg:col-span-1" : "lg:col-span-2"}>
            <ComparisonBarChart
                data={chartData.comparisonData}
                isLoading={loadingCharts && !chartData.comparisonData?.length}
            />
          </div>
          <div className="lg:col-span-2">
              <DailyTrendLineChart
                  data={chartData.trendData}
                  isLoading={loadingCharts && !chartData.trendData?.length}
              />
          </div>
      </div>

      {/* Tabel Ringkasan Kategori (Tetap Sama) */}
      <CategorySummaryTable period={period} />

      {/* Welcome Card & AI Suggestion (Tombol diperbaiki) */}
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
                 {/* --- PERBAIKAN TOMBOL --- */}
                 {/* 1. Tombol Tambah Transaksi (membuka modal) */}
                 <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary">
                            <Plus className="mr-2 h-4 w-4"/> Tambah Transaksi
                        </Button>
                    </DialogTrigger>
                    {/* Konten Modal Quick Add (sama seperti di FAB) */}
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

                 {/* 2. Tombol Lihat Laporan (navigasi) */}
                 <Button variant="outline" onClick={() => navigate('/reports')}>
                    Lihat Laporan
                 </Button>
                 {/* --- AKHIR PERBAIKAN TOMBOL --- */}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* AI Suggestion (Sudah berfungsi sebelumnya) */}
        <AIFinancialSuggestion />
      </div>

    </div>
  );
}