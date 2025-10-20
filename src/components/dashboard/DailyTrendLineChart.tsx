// src/components/dashboard/DailyTrendLineChart.tsx

import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, FileWarning, CalendarDays } from 'lucide-react';
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';
import { TrendChartData } from '@/hooks/useChartData';
import { cn } from "@/lib/utils";

interface DailyTrendLineChartProps {
    data: TrendChartData[];
    isLoading: boolean;
}

// Helper format currency singkat
const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(value) >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return formatCurrency(value);
};

export function DailyTrendLineChart({ data, isLoading }: DailyTrendLineChartProps) {
    const chartConfig: ChartConfig = {
        Income: { label: "Pemasukan", color: 'hsl(var(--success))', icon: TrendingUp },
        Expense: { label: "Pengeluaran", color: 'hsl(var(--danger))', icon: TrendingDown },
    };

    const title = "Tren Keuangan (30 Hari Terakhir)";
    const description = "Grafik pemasukan dan pengeluaran harian.";

    if (isLoading) {
        return <Skeleton className="h-80 w-full rounded-lg" />; // Ukuran disesuaikan
    }

    const showPlaceholder = !data || data.length < 2;

    return (
        <Card className="shadow-medium col-span-full flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
                {!showPlaceholder && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-0">
                {showPlaceholder ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                         <FileWarning className="h-10 w-10 mb-3 text-primary/50" />
                         <p className="font-medium">Belum Cukup Data</p>
                         <p className="text-sm">Minimal perlu 2 hari transaksi dalam 30 hari terakhir untuk menampilkan tren.</p>
                     </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-Income)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-Income)" stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-Expense)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-Expense)" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} width={70} />
                                <Tooltip
                                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    content={({ active, payload, label }) => (
                                        active && payload && payload.length ? (
                                            <ChartTooltipContent
                                                label={label}
                                                payload={payload}
                                                labelClassName="font-bold"
                                                formatter={(value, name, item) => (
                                                    <div className='flex justify-between items-center w-full gap-4'>
                                                         <div className="flex items-center gap-1.5">
                                                             <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}/>
                                                            <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                                                        </div>
                                                        <span className={cn("font-bold tabular-nums", name === 'Income' && 'text-success', name === 'Expense' && 'text-danger')}>
                                                            {formatCurrency(value as number)}
                                                        </span>
                                                    </div>
                                                )}
                                                className='min-w-[180px]'
                                                indicator="line"
                                            />
                                        ) : null
                                    )}
                                />
                                <Legend content={<ChartLegendContent />} verticalAlign="top" align="right"/>
                                <Area type="monotone" dataKey="Income" strokeWidth={0} fillOpacity={1} fill="url(#fillIncome)" />
                                <Area type="monotone" dataKey="Expense" strokeWidth={0} fillOpacity={1} fill="url(#fillExpense)" />
                                <Line dataKey="Income" type="monotone" stroke="var(--color-Income)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "hsl(var(--background))", stroke: "var(--color-Income)", strokeWidth: 2 }} />
                                <Line dataKey="Expense" type="monotone" stroke="var(--color-Expense)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "hsl(var(--background))", stroke: "var(--color-Expense)", strokeWidth: 2 }} />
                            </AreaChart>
                         </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}