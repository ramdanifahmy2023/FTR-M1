// src/components/dashboard/CategoryPieChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Tag, FileText } from 'lucide-react';

import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils"; // <-- Pastikan cn diimpor

interface CategoryPieChartProps {
    data: PieChartData[];
    type: 'income' | 'expense';
    isLoading: boolean;
}

// Custom label render function
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Jangan tampilkan label jika persentase terlalu kecil
    if (percent < 0.05) return null;

    return (
        <text
            x={x}
            y={y}
            fill="white" // Warna teks label (bisa disesuaikan)
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] font-semibold pointer-events-none" // Lebih kecil & bold
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function CategoryPieChart({ data, type, isLoading }: CategoryPieChartProps) {

    const chartConfig: ChartConfig = data.reduce((config, item) => {
        // Sanitasi nama untuk key CSS (ganti karakter non-alphanumeric dengan _)
        const key = item.name.replace(/[^a-zA-Z0-9]/g, '_');
        config[key] = {
            label: item.name,
            color: item.color,
            icon: Tag, // Default icon, bisa diganti jika data punya ikon spesifik
        };
        return config;
    }, {} as ChartConfig);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const title = type === 'income' ? 'Distribusi Pemasukan' : 'Distribusi Pengeluaran';
    const Icon = type === 'income' ? TrendingUp : TrendingDown;
    const colorClass = type === 'income' ? 'text-success' : 'text-danger';

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />; // Skeleton tetap sama
    }

    return (
        <Card className="shadow-medium flex flex-col h-full"> {/* <-- Layout flex kolom, tinggi penuh */}
            <CardHeader className="items-center pb-0"> {/* Padding bawah dikurangi */}
                <Icon className={cn("h-5 w-5", colorClass)} /> {/* Ukuran ikon konsisten */}
                <CardTitle>{title}</CardTitle>
                {/* Deskripsi hanya jika ada total > 0 */}
                {totalValue > 0 && <CardDescription>Total {formatCurrency(totalValue)}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-0"> {/* <-- Konten mengisi sisa ruang & center */}
                {data.length === 0 ? (
                    // --- Empty State Lebih Baik ---
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground py-10">
                        <FileText className="h-10 w-10 mb-3 text-primary/50" /> {/* Ikon lebih besar */}
                        <p className="font-medium">Tidak ada data {type === 'income' ? 'pemasukan' : 'pengeluaran'}</p>
                        <p className="text-sm">Belum ada transaksi untuk periode ini.</p>
                    </div>
                    // --- Akhir Empty State ---
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square h-[250px] w-full max-w-[250px] sm:max-w-[300px]" // Maksimum lebar ditambahkan
                    >
                        <PieChart> {/* Ganti ResponsiveContainer ke PieChart langsung jika ChartContainer sudah responsif */}
                             <Tooltip
                                cursor={false}
                                content={({ active, payload }) =>
                                    active && payload && payload.length ? (
                                        <ChartTooltipContent
                                            payload={payload}
                                            hideLabel // Sembunyikan label default
                                            formatter={(value, name) => ( // Custom formatter
                                                <div className='flex justify-between items-center w-full gap-4'>
                                                    {/* Nama kategori dari config (label) */}
                                                    <span className="text-muted-foreground mr-2">{chartConfig[name]?.label || name}</span>
                                                    {/* Nilai dengan warna sesuai tipe */}
                                                    <span className={cn('font-bold tabular-nums', colorClass)}>
                                                        {formatCurrency(value as number)}
                                                    </span>
                                                </div>
                                            )}
                                            className='min-w-[150px]' // Sedikit lebih lebar
                                            indicator="dot" // Gunakan dot
                                        />
                                    ) : null
                                }
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name" // Pastikan nameKey sesuai dengan key di data
                                cx="50%"
                                cy="50%"
                                innerRadius={70} // Lubang lebih besar
                                outerRadius={100} // Radius luar sedikit lebih besar
                                paddingAngle={5} // Jarak antar irisan
                                labelLine={false}
                                label={renderCustomizedLabel} // Label custom
                                strokeWidth={2} // Stroke antar irisan
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke={"hsl(var(--card))"} // Warna stroke = background card
                                        className="focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background" // Style focus
                                    />
                                ))}
                            </Pie>

                            {/* --- Teks Total di Tengah --- */}
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground text-xl font-bold" // Lebih besar & bold
                            >
                                {formatCurrency(totalValue)}
                            </text>
                            <text
                                x="50%"
                                y="50%"
                                dy="1.2em" // Posisi di bawah total
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-muted-foreground text-xs" // Warna muted
                            >
                                Total
                            </text>
                            {/* --- Akhir Teks Total --- */}

                            <Legend
                                content={<ChartLegendContent />}
                                verticalAlign="top" // Pindah ke atas
                                align="center" // Tetap di tengah
                                wrapperStyle={{ paddingTop: '5px', paddingBottom: '15px' }} // Atur padding
                            />
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}