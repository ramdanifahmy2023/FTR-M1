// src/components/dashboard/CategorySummaryTable.tsx

import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { calculateDateRange } from '@/hooks/useDashboardStats'; // Import fungsi kalkulasi tanggal
import { formatCurrency } from '@/utils/currency';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter, // Import TableFooter
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySummaryTableProps {
    period: string; // Menerima periode (e.g., 'this-month', 'this-year')
}

interface CategorySummary {
    id: string | null; // null for uncategorized
    name: string;
    color: string | null;
    totalIncome: number;
    totalExpense: number;
    net: number;
}

export function CategorySummaryTable({ period }: CategorySummaryTableProps) {
    const dateRange = useMemo(() => calculateDateRange(period), [period]);

    // Ambil semua kategori untuk mapping
    const { categories: incomeCategories, isLoading: incomeLoading } = useCategories('income');
    const { categories: expenseCategories, isLoading: expenseLoading } = useCategories('expense');

    // Ambil transaksi berdasarkan periode
    const { transactions, isLoading: transactionsLoading } = useTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
        // Tidak perlu filter type/category/bank di sini karena kita mau meringkas semua
    });

    const isLoading = incomeLoading || expenseLoading || transactionsLoading;

    // Proses data transaksi untuk ringkasan per kategori
    const categorySummary = useMemo((): CategorySummary[] => {
        if (isLoading) return [];

        const summaryMap = new Map<string | null, CategorySummary>();
        const allCategories = [...incomeCategories, ...expenseCategories];

        // Inisialisasi map dengan semua kategori yang ada + uncategorized
        allCategories.forEach(cat => {
            summaryMap.set(cat.id, {
                id: cat.id,
                name: cat.name,
                color: cat.color,
                totalIncome: 0,
                totalExpense: 0,
                net: 0,
            });
        });
        // Tambahkan entri untuk Uncategorized jika belum ada
         if (!summaryMap.has(null)) {
            summaryMap.set(null, { id: null, name: 'Uncategorized', color: '#888888', totalIncome: 0, totalExpense: 0, net: 0 });
        }


        // Agregasi transaksi
        transactions.forEach(t => {
            const categoryId = t.category_id; // Bisa null
            let entry = summaryMap.get(categoryId);

            // Jika transaksi punya kategori tapi kategorinya tidak ada di list (misal sudah dihapus),
            // masukkan ke uncategorized
            if (t.category_id && !entry) {
                 categoryId = null;
                 entry = summaryMap.get(null);
            }

            // Jika entry masih null (seharusnya tidak terjadi setelah inisialisasi), buat baru
             if (!entry) {
                 entry = { id: null, name: 'Uncategorized', color: '#888888', totalIncome: 0, totalExpense: 0, net: 0 };
                 summaryMap.set(null, entry);
             }


            if (t.type === 'income') {
                entry.totalIncome += t.amount;
            } else {
                entry.totalExpense += t.amount;
            }
            entry.net = entry.totalIncome - entry.totalExpense;
        });

        // Konversi map ke array, filter yang tidak ada transaksi, dan sort
        return Array.from(summaryMap.values())
            .filter(summary => summary.totalIncome > 0 || summary.totalExpense > 0)
            .sort((a, b) => (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense)); // Sort by total activity

    }, [transactions, incomeCategories, expenseCategories, isLoading]);

    // Hitung Grand Total
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
                    </div>
                </CardContent>
             </Card>
        );
    }

    return (
        <Card className="shadow-medium col-span-full"> {/* Ambil full width */}
            <CardHeader>
                <CardTitle>Ringkasan per Kategori</CardTitle>
                 <CardDescription>Total Pemasukan & Pengeluaran per kategori untuk periode {period.replace('-', ' ')}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right text-success">Pemasukan</TableHead>
                                <TableHead className="text-right text-danger">Pengeluaran</TableHead>
                                <TableHead className="text-right">Bersih</TableHead>
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
                                    <TableRow key={summary.id || 'uncategorized'}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                             <span
                                                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: summary.color || '#888888' }}
                                             />
                                             {summary.name}
                                         </TableCell>
                                         <TableCell className="text-right text-success">
                                            {summary.totalIncome > 0 ? formatCurrency(summary.totalIncome) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-danger">
                                            {summary.totalExpense > 0 ? formatCurrency(summary.totalExpense) : '-'}
                                        </TableCell>
                                        <TableCell className={cn("text-right font-semibold", summary.net >= 0 ? 'text-primary' : 'text-destructive')}>
                                            {formatCurrency(summary.net)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                         {/* Footer Tabel */}
                        <TableFooter>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableHead className="text-right font-bold">Grand Total</TableHead>
                                <TableHead className="text-right font-bold text-success">{formatCurrency(grandTotal.income)}</TableHead>
                                <TableHead className="text-right font-bold text-danger">{formatCurrency(grandTotal.expense)}</TableHead>
                                <TableHead className={cn("text-right font-bold", grandTotal.net >= 0 ? 'text-primary' : 'text-destructive')}>
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