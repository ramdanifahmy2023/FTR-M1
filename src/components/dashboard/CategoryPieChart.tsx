// src/components/dashboard/CategoryPieChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Tag, FileText } from 'lucide-react'; // <-- TAMBAHKAN FileText DI SINI

import { ChartContainer, ChartConfig, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChartData } from '@/hooks/useChartData';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryPieChartProps {
    data: PieChartData[];
    type: 'income' | 'expense';
    isLoading: boolean;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Jangan tampilkan label jika persentase terlalu kecil
    if (percent < 0.05) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function CategoryPieChart({ data, type, isLoading }: CategoryPieChartProps) {
    
    const chartConfig: ChartConfig = data.reduce((config, item) => {
        config[item.name] = {
            label: item.name,
            color: item.color,
            icon: Tag,
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
        <Card className="shadow-medium">
            <CardHeader className="items-center pb-0">
                <Icon className={colorClass} />
                <CardTitle>{title}</CardTitle>
                <CardDescription>Total {formatCurrency(totalValue)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>Tidak ada data {type} untuk ditampilkan.</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                paddingAngle={5}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        stroke={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                content={({ active, payload, label }) => (
                                    <ChartTooltipContent 
                                        label={label}
                                        payload={payload} 
                                        hideLabel
                                        formatter={(value, name) => 
                                            <div className='flex justify-between w-full'>
                                                <span className="text-muted-foreground mr-4">{name}</span>
                                                <span className={`font-bold ${colorClass}`}>{formatCurrency(value as number)}</span>
                                            </div>
                                        }
                                        className='min-w-[12rem]'
                                    />
                                )} 
                            />
                            <Legend 
                                content={<ChartLegendContent />} 
                                layout="vertical"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}