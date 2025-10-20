// src/components/dashboard/ComparisonBarChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { RefreshCcw } from 'lucide-react';
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComparisonChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface ComparisonBarChartProps {
    data: ComparisonChartData[];
    isLoading: boolean;
}

export function ComparisonBarChart({ data, isLoading }: ComparisonBarChartProps) {
    const chartConfig: ChartConfig = {
        currentMonth: {
            label: format(new Date(), 'MMMM yyyy', { locale: id }),
            color: 'hsl(var(--primary))',
        },
        previousMonth: {
            label: format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: id }),
            color: 'hsl(var(--secondary))',
        },
    };

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <Card className="shadow-medium">
            <CardHeader className="items-center pb-0">
                <RefreshCcw className="text-primary" />
                <CardTitle>Perbandingan Bulan ke Bulan</CardTitle>
                <CardDescription>Pemasukan vs Pengeluaran</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <ChartContainer config={chartConfig} className="aspect-video h-[250px]">
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis 
                            type="number" 
                            tickFormatter={(value) => formatCurrency(value)}
                            hide
                        />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false}
                            className="text-xs"
                            width={100}
                        />
                        <Tooltip 
                            content={({ active, payload }) => (
                                <ChartTooltipContent 
                                    payload={payload} 
                                    formatter={(value) => formatCurrency(value as number)}
                                    className='min-w-[12rem]'
                                    indicator="line"
                                />
                            )} 
                        />
                        <Legend content={<ChartLegendContent />} />
                        <Bar 
                            dataKey="currentMonth" 
                            fill="var(--color-currentMonth)" 
                            radius={[4, 4, 0, 0]}
                            name={chartConfig.currentMonth.label}
                        />
                        <Bar 
                            dataKey="previousMonth" 
                            fill="var(--color-previousMonth)" 
                            radius={[4, 4, 0, 0]}
                            name={chartConfig.previousMonth.label}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}