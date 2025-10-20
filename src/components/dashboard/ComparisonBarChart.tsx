// src/components/dashboard/ComparisonBarChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // <-- Tambah ResponsiveContainer
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
            color: 'hsl(var(--muted-foreground))', // <-- Ganti warna bulan lalu agar lebih kontras
        },
    };

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <Card className="shadow-medium flex flex-col h-full"> {/* <-- Tambah flex flex-col h-full */}
            <CardHeader className="items-center pb-2"> {/* <-- Kurangi padding bottom */}
                <RefreshCcw className="h-5 w-5 text-primary" /> {/* <-- Sedikit perkecil ikon */}
                <CardTitle>Perbandingan Bulan Ini vs Lalu</CardTitle> {/* <-- Judul lebih jelas */}
                <CardDescription>Pemasukan & Pengeluaran</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-2"> {/* <-- Tambah flex-1 & pt-2 */}
               {/* Gunakan ChartContainer langsung sebagai wrapper chart */}
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                   {/* Gunakan ResponsiveContainer */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ left: 10, right: 30, top: 10, bottom: 10 }} // Tambah margin kanan untuk label
                            barGap={4} // Beri jarak antar grup bar
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => formatCurrency(value, true)} // Gunakan format singkat (misal: 1jt)
                                hide // Sembunyikan axis X
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} // Style tick Y
                                width={80} // Lebar area label Y
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--accent) / 0.3)' }} // Efek hover pada bar
                                content={({ active, payload, label }) => (
                                    active && payload && payload.length ? (
                                        <ChartTooltipContent
                                            label={label} // Label: Pemasukan / Pengeluaran
                                            payload={payload}
                                            formatter={(value, name, item) => (
                                                <div className='flex justify-between items-center w-full gap-4'>
                                                    {/* Tampilkan label bulan dari config */}
                                                    <span style={{ color: item.color }} className="font-medium">
                                                        {chartConfig[name as keyof typeof chartConfig]?.label || name}
                                                    </span>
                                                    <span className="font-bold tabular-nums">
                                                        {formatCurrency(value as number)}
                                                    </span>
                                                </div>
                                            )}
                                            className='min-w-[180px]' // Lebih lebar
                                            indicator="dot"
                                            hideLabel // Sembunyikan label default (Pemasukan/Pengeluaran) di atas
                                        />
                                    ) : null
                                )}
                            />
                             <Legend content={<ChartLegendContent />} verticalAlign="top" align="right"/> {/* Pindah legend ke atas */}
                            <Bar
                                dataKey="currentMonth"
                                fill="var(--color-currentMonth)"
                                radius={[0, 4, 4, 0]} // Radius di ujung kanan bar
                                barSize={20} // Ukuran bar
                            />
                            <Bar
                                dataKey="previousMonth"
                                fill="var(--color-previousMonth)"
                                radius={[0, 4, 4, 0]} // Radius di ujung kanan bar
                                barSize={20} // Ukuran bar
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// Helper function untuk format currency singkat (opsional, bisa ditaruh di utils/currency.ts)
const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${value}`;
};

// Modifikasi fungsi formatCurrency di utils/currency.ts jika ingin menambahkan opsi 'short'
/*
export function formatCurrency(amount: number, short: boolean = false): string {
  if (short) {
      // Logika format singkat di sini (mirip formatCurrencyShort di atas)
  }
  return new Intl.NumberFormat("id-ID", {
    // ... format standar
  }).format(amount);
}
*/