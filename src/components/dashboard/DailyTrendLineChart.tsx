// src/components/dashboard/DailyTrendLineChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';

interface DailyTrendLineChartProps {
    data: { date: string, Income: number, Expense: number }[];
    isLoading: boolean;
}

export function DailyTrendLineChart({ data, isLoading }: DailyTrendLineChartProps) {
    const chartConfig: ChartConfig = {
        Income: {
            label: "Pemasukan",
            color: 'hsl(var(--success))',
            icon: TrendingUp,
        },
        Expense: {
            label: "Pengeluaran",
            color: 'hsl(var(--danger))',
            icon: TrendingDown,
        },
    };

    if (isLoading) {
        return <Skeleton className="h-80 w-full" />;
    }
    
    if (data.length === 0) {
        return (
            <Card className="shadow-medium col-span-full">
                <CardHeader>
                    <CardTitle>Tren Keuangan (15 Hari Terakhir)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <p>Tidak cukup data transaksi di 15 hari terakhir.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-medium col-span-full">
            <CardHeader>
                <CardTitle>Tren Keuangan (15 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-[16/9] h-[300px] w-full">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                        <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            className="text-xs"
                            tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                            content={({ active, payload }) => (
                                <ChartTooltipContent 
                                    payload={payload} 
                                    formatter={(value) => formatCurrency(value as number)}
                                    className='min-w-[12rem]'
                                />
                            )} 
                        />
                        <Legend content={<ChartLegendContent />} />
                        <Line 
                            dataKey="Income" 
                            stroke="var(--color-Income)" 
                            type="monotone"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-Income)" }}
                            activeDot={{ r: 6, fill: "var(--color-Income)" }}
                        />
                        <Line 
                            dataKey="Expense" 
                            stroke="var(--color-Expense)" 
                            type="monotone"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-Expense)" }}
                            activeDot={{ r: 6, fill: "var(--color-Expense)" }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}