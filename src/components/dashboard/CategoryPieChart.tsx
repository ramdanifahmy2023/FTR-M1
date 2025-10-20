import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Tag, FileText } from 'lucide-react';

import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils"; // <-- Import cn untuk class conditional

interface CategoryPieChartProps {
    data: PieChartData[];
    type: 'income' | 'expense';
    isLoading: boolean;
}

// Optional: Custom label render function (sama seperti sebelumnya)
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Jangan tampilkan label jika persentase terlalu kecil
    if (percent < 0.05) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold pointer-events-none">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function CategoryPieChart({ data, type, isLoading }: CategoryPieChartProps) {

    const chartConfig: ChartConfig = data.reduce((config, item) => {
        // Gunakan item.name sebagai key yang unik
        const key = item.name.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitasi nama untuk key CSS
        config[key] = {
            label: item.name,
            color: item.color,
            icon: Tag, // Anda bisa mengganti ini nanti jika ada ikon spesifik
        };
        return config;
    }, {} as ChartConfig);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const title = type === 'income' ? 'Distribusi Pemasukan' : 'Distribusi Pengeluaran';
    const Icon = type === 'income' ? TrendingUp : TrendingDown;
    const colorClass = type === 'income' ? 'text-success' : 'text-danger';

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <Card className="shadow-medium flex flex-col h-full"> {/* <-- Tambah flex flex-col h-full */}
            <CardHeader className="items-center pb-0">
                <Icon className={colorClass} />
                <CardTitle>{title}</CardTitle>
                {/* Deskripsi tidak ditampilkan jika total 0 */}
                {totalValue > 0 && <CardDescription>Total {formatCurrency(totalValue)}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-0"> {/* <-- Tambah flex-1 flex items-center justify-center */}
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground py-10"> {/* <-- Tambah text-center h-full py-10 */}
                        <FileText className="h-8 w-8 mb-2" />
                        <p>Tidak ada data {type} untuk ditampilkan pada periode ini.</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px] w-full"> {/* <-- Tambah w-full */}
                        {/* Ganti ResponsiveContainer dengan PieChart langsung */}
                        <PieChart>
                             <Tooltip
                                cursor={false} // Nonaktifkan cursor default tooltip
                                content={({ active, payload }) => (
                                    active && payload && payload.length ? (
                                        <ChartTooltipContent
                                            // label={payload[0].payload.name} // Label bisa diambil dari payload jika perlu
                                            payload={payload}
                                            hideLabel // Sembunyikan label default tooltip
                                            formatter={(value, name) =>
                                                <div className='flex justify-between w-full gap-4'>
                                                    <span className="text-muted-foreground mr-2">{name}</span>
                                                    <span className={`font-bold ${colorClass}`}>{formatCurrency(value as number)}</span>
                                                </div>
                                            }
                                            className='min-w-[150px]' // Sedikit lebih lebar
                                            indicator="dot" // Gunakan dot indicator
                                        />
                                    ) : null
                                )}
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70} // <-- PERBESAR innerRadius untuk efek Donut
                                outerRadius={100} // <-- Sedikit perbesar outerRadius
                                fill="#8884d8"
                                labelLine={false}
                                label={renderCustomizedLabel} // Gunakan fungsi render label custom
                                paddingAngle={5}
                                strokeWidth={2} // Tambah sedikit stroke antar irisan
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke={"hsl(var(--card))"} // Gunakan warna card background untuk stroke
                                        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" // Tambah style focus
                                    />
                                ))}

                                {/* --- TAMBAHKAN TEKS TOTAL DI TENGAH --- */}
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-foreground text-xl font-bold"
                                >
                                    {formatCurrency(totalValue)}
                                </text>
                                <text
                                    x="50%"
                                    y="50%"
                                    dy="1.2em" // Posisi sedikit di bawah total
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-muted-foreground text-xs"
                                >
                                    Total
                                </text>
                                {/* --- AKHIR TEKS TOTAL DI TENGAH --- */}
                            </Pie>
                             <Legend
                                content={<ChartLegendContent />}
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '15px' }} // Beri jarak dari chart
                            />
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}