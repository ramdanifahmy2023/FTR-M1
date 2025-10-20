// src/components/dashboard/DailyTrendLineChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, FileWarning } from 'lucide-react'; // Import FileWarning
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';
import { TrendChartData } from '@/hooks/useChartData'; // Import tipe data

interface DailyTrendLineChartProps {
    data: TrendChartData[]; // Gunakan tipe yang sudah dibuat
    isLoading: boolean;
}

export function DailyTrendLineChart({ data, isLoading }: DailyTrendLineChartProps) {
    const chartConfig: ChartConfig = {
        Income: { /* ... Konfigurasi tetap sama ... */ },
        Expense: { /* ... Konfigurasi tetap sama ... */ },
    };

    const title = "Tren Keuangan (30 Hari Terakhir)"; // <-- UBAH JUDUL
    const description = "Grafik pemasukan dan pengeluaran harian selama 30 hari terakhir."; // <-- UBAH DESKRIPSI (opsional)


    if (isLoading) {
        return <Skeleton className="h-80 w-full" />;
    }

    // Jika data ada tapi kurang dari beberapa hari (misal < 2), tampilkan pesan
    const showPlaceholder = !data || data.length < 2;

    return (
        <Card className="shadow-medium col-span-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {/* Tampilkan deskripsi hanya jika ada data */}
                {!showPlaceholder && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {showPlaceholder ? (
                     <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                         <FileWarning className="h-8 w-8 mb-2" />
                         <p>Belum cukup data transaksi (minimal 2 hari) di 30 hari terakhir.</p>
                     </div>
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-[16/9] h-[300px] w-full">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            {/* ... Konfigurasi LineChart lainnya tetap sama ... */}
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                className="text-xs"
                                // Optional: Tampilkan lebih sedikit label jika terlalu padat
                                // interval={'preserveStartEnd'}
                                // tickFormatter={(value, index) => index % 3 === 0 ? value : ''} // Tampilkan label tiap 3 hari
                             />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                className="text-xs"
                                tickFormatter={(value) => formatCurrency(value)}
                                // Optional: Atur domain jika perlu
                                // domain={['auto', 'auto']}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => (
                                    <ChartTooltipContent
                                        label={label} // Tampilkan tanggal di tooltip
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
                                 dot={false} // Hilangkan titik agar tidak terlalu ramai
                                 activeDot={{ r: 5, fill: "var(--color-Income)", strokeWidth: 0 }}
                             />
                             <Line
                                 dataKey="Expense"
                                 stroke="var(--color-Expense)"
                                 type="monotone"
                                 strokeWidth={2}
                                 dot={false} // Hilangkan titik
                                 activeDot={{ r: 5, fill: "var(--color-Expense)", strokeWidth: 0 }}
                             />
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}