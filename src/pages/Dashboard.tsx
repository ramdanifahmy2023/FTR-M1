import { useState } from "react";
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


export default function Dashboard() {
  
  const [period, setPeriod] = useState<string>("this-month");
  
  // Menggunakan hook baru untuk mendapatkan data dan loading state
  const { stats, isLoading: loading, dateRange } = useDashboardStats(period);
  

  const statCards = [
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
            <SelectItem value="custom-range" disabled>Custom Range</SelectItem> {/* Disabled for later implementation */}
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
              <div className={`rounded-full p-2 ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {formatCurrency(stat.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Welcome Card & AI Suggestion */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Fintrack M7! 🎉</h2>
              <p className="text-muted-foreground">
                Start tracking your finances by adding transactions, managing categories, 
                and monitoring your assets.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="gradient-primary">Add Transaction</Button>
                <Button variant="outline">View Reports</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AIFinancialSuggestion />
      </div>
      
      {/* Placeholder for Charts and Summary Table */}
      <Card>
        <CardHeader>
             <CardTitle className="text-lg">Financial Overview ({period})</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Menampilkan data dari: {dateRange.start} hingga {dateRange.end}
            </p>
            <div className="pt-4 text-sm text-muted-foreground">
                Placeholder untuk Pie Chart (Income/Expense per Category) dan Bar Chart (Comparison).
            </div>
        </CardContent>
      </Card>
    </div>
  );
}