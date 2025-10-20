// src/components/dashboard/ComparisonBarChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCcw, FileWarning } from 'lucide-react'; // Impor FileWarning
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComparisonChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils'; // Impor cn

interface ComparisonBarChartProps {
    data: ComparisonChartData[];
    isLoading: boolean;
}

// Helper format currency singkat
const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(value) >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return formatCurrency(value);
};

export function ComparisonBarChart({ data, isLoading }: ComparisonBarChartProps) {
    const chartConfig: ChartConfig = {
        currentMonth: {
            label: format(new Date(), 'MMMM yyyy', { locale: id }),
            color: 'hsl(var(--primary))',
        },
        previousMonth: {
            label: format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: id }),
            color: 'hsl(var(--muted-foreground))',
        },
    };

    if (isLoading) {
        return <Skeleton className="h-80 w-full rounded-lg" />; // Ukuran disesuaikan
    }

    const hasValidData = data?.some(d => d.name === 'Pemasukan' || d.name === 'Pengeluaran');

    return (
        <Card className="shadow-medium flex flex-col h-full">
            <CardHeader className="items-center pb-2">
                <RefreshCcw className="h-5 w-5 text-primary" />
                <CardTitle>Perbandingan Bulanan</CardTitle>
                <CardDescription>Pemasukan & Pengeluaran</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-2">
                {!hasValidData ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                         <FileWarning className="h-10 w-10 mb-3 text-primary/50" />
                         <p className="font-medium">Data Perbandingan Tidak Tersedia</p>
                         <p className="text-sm">Belum ada data transaksi yang cukup.</p>
                     </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                                barGap={4}
                                barSize={20}
                            >
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis type="number" tickFormatter={(value) => formatCurrencyShort(value)} hide axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
                                    content={({ active, payload, label }) => (
                                        active && payload && payload.length ? (
                                            <ChartTooltipContent
                                                label={label}
                                                payload={payload}
                                                formatter={(value, name, item) => (
                                                    <div className='flex justify-between items-center w-full gap-4'>
                                                        <span style={{ color: item.color }} className="font-medium flex items-center gap-1.5">
                                                             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}/>
                                                            {chartConfig[name as keyof typeof chartConfig]?.label || name}
                                                        </span>
                                                        <span className="font-bold tabular-nums">
                                                            {formatCurrency(value as number)}
                                                        </span>
                                                    </div>
                                                )}
                                                className='min-w-[180px]'
                                                indicator="dot"
                                                hideLabel
                                            />
                                        ) : null
                                    )}
                                />
                                 <Legend content={<ChartLegendContent />} verticalAlign="top" align="right"/>
                                <Bar dataKey="currentMonth" fill="var(--color-currentMonth)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="previousMonth" fill="var(--color-previousMonth)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}