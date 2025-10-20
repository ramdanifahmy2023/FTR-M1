import { useMemo } from 'react'; // <-- Pastikan useMemo diimport dari 'react'
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { calculateDateRange } from '@/hooks/useDashboardStats';
import { formatCurrency } from '@/utils/currency';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySummaryTableProps {
    period: string;
}

interface CategorySummary {
    id: string | null;
    name: string;
    color: string | null;
    totalIncome: number;
    totalExpense: number;
    net: number;
}

export function CategorySummaryTable({ period }: CategorySummaryTableProps) {
    // --- HOOKS (PANGGIL SEMUA DI ATAS SEBELUM KONDISIONAL) ---
    const dateRange = useMemo(() => calculateDateRange(period), [period]);
    const { categories: incomeCategories, isLoading: incomeLoading } = useCategories('income');
    const { categories: expenseCategories, isLoading: expenseLoading } = useCategories('expense');
    const { transactions, isLoading: transactionsLoading } = useTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
    });

    // Kalkulasi isLoading setelah semua hook data dipanggil
    const isLoading = incomeLoading || expenseLoading || transactionsLoading;

    // Kalkulasi summary (bergantung pada data dari hooks di atas)
    const categorySummary = useMemo((): CategorySummary[] => {
        // Jangan jalankan kalkulasi kompleks jika masih loading dependencies
        if (incomeLoading || expenseLoading || transactionsLoading) return [];

        const summaryMap = new Map<string | null, CategorySummary>();
        const allCategories = [...incomeCategories, ...expenseCategories];

        allCategories.forEach(cat => {
            if (cat?.id) { // Pastikan id ada sebelum set
                summaryMap.set(cat.id, {
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    totalIncome: 0,
                    totalExpense: 0,
                    net: 0,
                });
            }
        });
        if (!summaryMap.has(null)) {
            summaryMap.set(null, { id: null, name: 'Uncategorized', color: '#888888', totalIncome: 0, totalExpense: 0, net: 0 });
        }

        transactions.forEach(t => {
            let categoryId: string | null = t.category_id;
            let entry = summaryMap.get(categoryId);

            if (t.category_id && !entry) {
                 categoryId = null;
                 entry = summaryMap.get(null);
            }
             // Ensure entry exists before modifying (safety check)
             if (!entry) {
                 entry = { id: categoryId, name: categoryId ? `Unknown (${categoryId.substring(0,4)}...)` : 'Uncategorized', color: '#888888', totalIncome: 0, totalExpense: 0, net: 0 };
                 summaryMap.set(categoryId, entry);
             }

            if (t.type === 'income') {
                entry.totalIncome += t.amount;
            } else {
                entry.totalExpense += t.amount;
            }
            entry.net = entry.totalIncome - entry.totalExpense;
        });

        return Array.from(summaryMap.values())
            .filter(summary => summary.totalIncome > 0 || summary.totalExpense > 0)
            .sort((a, b) => (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, incomeCategories, expenseCategories, incomeLoading, expenseLoading, transactionsLoading]); // Tambah dependency loading

    // Hitung Grand Total (bergantung pada categorySummary)
    const grandTotal = useMemo(() => {
        return categorySummary.reduce(
            (totals, current) => {
                totals.income += current.totalIncome;
                totals.expense += current.totalExpense;
                totals.net += current.net;
                return totals;
            },
            { income: 0, expense: 0, net: 0 }
        );
    }, [categorySummary]);

    // Kalkulasi periodName
     const periodName = useMemo(() => {
        switch (period) {
            case 'today': return 'Hari Ini';
            case 'this-week': return 'Minggu Ini';
            case 'this-month': return 'Bulan Ini';
            case 'this-year': return 'Tahun Ini';
            default: return period;
        }
     }, [period]);
    // --- AKHIR HOOKS ---


    // --- KONDISIONAL RETURN (Setelah semua hook dipanggil) ---
    if (isLoading) {
        return (
             <Card className="shadow-medium">
                <CardHeader>
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full mt-4" />
                    </div>
                </CardContent>
             </Card>
        );
    }
    // --- AKHIR KONDISIONAL RETURN ---


    // --- Render JSX Utama ---
    return (
        <Card className="shadow-medium col-span-full">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                     <List className="h-5 w-5 text-primary" />
                     Ringkasan per Kategori
                 </CardTitle>
                 <CardDescription>Total Pemasukan & Pengeluaran per kategori untuk periode {periodName}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto max-h-[400px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[40%]">Kategori</TableHead>
                                <TableHead className="w-[20%] text-right text-success">Pemasukan</TableHead>
                                <TableHead className="w-[20%] text-right text-danger">Pengeluaran</TableHead>
                                <TableHead className="w-[20%] text-right">Bersih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categorySummary.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Tidak ada data ringkasan untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categorySummary.map((summary) => (
                                    <TableRow key={summary.id || 'uncategorized'} className="hover:bg-muted/50">
                                        <TableCell className="font-medium flex items-center gap-2 py-3">
                                             <span
                                                className="inline-block h-3 w-3 rounded-full flex-shrink-0 border"
                                                style={{ backgroundColor: summary.color || '#888888' }}
                                             />
                                             <span className="truncate">{summary.name}</span>
                                         </TableCell>
                                         <TableCell className="text-right text-success py-3 tabular-nums">
                                            {summary.totalIncome > 0 ? formatCurrency(summary.totalIncome) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-danger py-3 tabular-nums">
                                            {summary.totalExpense > 0 ? formatCurrency(summary.totalExpense) : '-'}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-semibold py-3 tabular-nums",
                                            summary.net >= 0 ? 'text-primary' : 'text-destructive'
                                        )}>
                                            {formatCurrency(summary.net)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                         <TableFooter className="sticky bottom-0 bg-background z-10">
                            <TableRow className="bg-muted hover:bg-muted border-t-2">
                                <TableHead className="text-right font-bold py-3">Grand Total</TableHead>
                                <TableHead className="text-right font-bold text-success py-3 tabular-nums">{formatCurrency(grandTotal.income)}</TableHead>
                                <TableHead className="text-right font-bold text-danger py-3 tabular-nums">{formatCurrency(grandTotal.expense)}</TableHead>
                                <TableHead className={cn(
                                    "text-right font-bold py-3 tabular-nums",
                                    grandTotal.net >= 0 ? 'text-primary' : 'text-destructive'
                                )}>
                                    {formatCurrency(grandTotal.net)}
                                </TableHead>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}