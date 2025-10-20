import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // <-- Tambah AreaChart, Area, ResponsiveContainer
import { TrendingUp, TrendingDown, FileWarning, CalendarDays } from 'lucide-react'; // <-- Ganti ikon FileWarning -> CalendarDays (opsional)
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';
import { TrendChartData } from '@/hooks/useChartData';
import { cn } from "@/lib/utils"; // <-- Import cn jika belum

interface DailyTrendLineChartProps {
    data: TrendChartData[];
    isLoading: boolean;
}

export function DailyTrendLineChart({ data, isLoading }: DailyTrendLineChartProps) {
    const chartConfig: ChartConfig = {
        Income: {
            label: "Pemasukan",
            color: 'hsl(var(--success))', // Gunakan warna success dari CSS variable
            icon: TrendingUp,
        },
        Expense: {
            label: "Pengeluaran",
            color: 'hsl(var(--danger))', // Gunakan warna danger dari CSS variable
            icon: TrendingDown,
        },
    };

    const title = "Tren Keuangan (30 Hari Terakhir)";
    const description = "Grafik pemasukan dan pengeluaran harian.";

    if (isLoading) {
        return <Skeleton className="h-80 w-full" />;
    }

    const showPlaceholder = !data || data.length < 2;

    return (
        <Card className="shadow-medium col-span-full flex flex-col h-full"> {/* <-- Tambah flex flex-col h-full */}
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" /> {/* <-- Ganti ikon header */}
                    {title}
                </CardTitle>
                {!showPlaceholder && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-0"> {/* <-- Tambah flex-1 */}
                {showPlaceholder ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10"> {/* <-- Tambah text-center h-full py-10 */}
                         <FileWarning className="h-8 w-8 mb-2" />
                         <p>Belum cukup data transaksi (minimal 2 hari) di 30 hari terakhir untuk menampilkan tren.</p> {/* <-- Pesan lebih jelas */}
                     </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        {/* Ganti LineChart menjadi AreaChart */}
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }} // Sesuaikan margin
                            >
                                {/* --- Definisi Gradien untuk Area Fill --- */}
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
                                {/* --- Akhir Definisi Gradien --- */}

                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" /> {/* <-- Warna grid lebih halus */}
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8} // Beri jarak antara label dan chart
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} // Style tick X
                                    // interval={'preserveStartEnd'} // Opsional: Tampilkan lebih sedikit label
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8} // Beri jarak
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} // Style tick Y
                                    tickFormatter={(value) => formatCurrency(value, true)} // Gunakan format singkat
                                    width={70} // Sedikit lebih lebar untuk format singkat
                                />
                                <Tooltip
                                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }} // Custom cursor
                                    content={({ active, payload, label }) => (
                                        active && payload && payload.length ? (
                                            <ChartTooltipContent
                                                label={label} // Tampilkan tanggal di header tooltip
                                                payload={payload}
                                                labelClassName="font-bold" // Buat tanggal tebal
                                                formatter={(value, name, item) => (
                                                    <div className='flex justify-between items-center w-full gap-4'>
                                                         <div className="flex items-center gap-1.5">
                                                             <span
                                                                 className="w-2.5 h-2.5 rounded-full"
                                                                 style={{ backgroundColor: item.color }}
                                                             />
                                                            <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                                                        </div>
                                                        <span className={cn(
                                                            "font-bold tabular-nums",
                                                            name === 'Income' && 'text-success',
                                                            name === 'Expense' && 'text-danger'
                                                        )}>
                                                            {formatCurrency(value as number)}
                                                        </span>
                                                    </div>
                                                )}
                                                className='min-w-[180px]'
                                                indicator="line" // Gunakan line indicator (atau 'dot')
                                            />
                                        ) : null
                                    )}
                                />
                                <Legend content={<ChartLegendContent />} verticalAlign="top" align="right"/> {/* Pindah legend ke atas */}

                                {/* --- Area Fill --- */}
                                <Area type="monotone" dataKey="Income" strokeWidth={0} fillOpacity={1} fill="url(#fillIncome)" />
                                <Area type="monotone" dataKey="Expense" strokeWidth={0} fillOpacity={1} fill="url(#fillExpense)" />
                                {/* --- Akhir Area Fill --- */}

                                {/* --- Garis (di atas Area) --- */}
                                <Line
                                    dataKey="Income"
                                    type="monotone"
                                    stroke="var(--color-Income)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "var(--color-Income)", strokeWidth: 1, stroke: 'hsl(var(--background))' }} // <-- Active dot lebih besar
                                />
                                <Line
                                    dataKey="Expense"
                                    type="monotone"
                                    stroke="var(--color-Expense)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "var(--color-Expense)", strokeWidth: 1, stroke: 'hsl(var(--background))' }} // <-- Active dot lebih besar
                                />
                                {/* --- Akhir Garis --- */}
                            </AreaChart>
                         </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

// Helper function format currency singkat (jika belum ada di utils/currency.ts)
const formatCurrencyShort = (value: number): string => {
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(value) >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return `Rp ${value}`;
};

// Pastikan fungsi formatCurrency di utils/currency.ts mendukung opsi 'short' jika Anda menggunakannya di YAxis
/*
// src/utils/currency.ts
export function formatCurrency(amount: number, short: boolean = false): string {
  if (short) {
    if (Math.abs(amount) >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
    if (Math.abs(amount) >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
    if (Math.abs(amount) >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`;
    // return `Rp ${amount}`; // Kembalikan tanpa format jika di bawah 1000? Atau format biasa?
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
*/