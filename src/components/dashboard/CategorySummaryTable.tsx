// src/components/dashboard/CategorySummaryTable.tsx

import { useMemo } from 'react';
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
import { List, FileWarning } from 'lucide-react'; // Impor FileWarning
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // <-- Impor hook mobile

interface CategorySummaryTableProps {
    period: string;
}

// Interface CategorySummary tetap sama
interface CategorySummary {
    id: string | null;
    name: string;
    color: string | null;
    totalIncome: number;
    totalExpense: number;
    net: number;
}

// --- Komponen Card Mobile ---
const MobileCategorySummaryCard = ({ summary }: { summary: CategorySummary }) => (
    <Card className="animate-slide-up shadow-sm"> {/* Animasi & shadow lebih ringan */}
        <CardContent className="p-3"> {/* Padding lebih kecil */}
            <div className="flex justify-between items-center mb-2">
                {/* Nama Kategori */}
                <div className="flex items-center gap-2 font-medium truncate flex-1 mr-2"> {/* Tambah flex-1 mr-2 */}
                     <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0 border"
                        style={{ backgroundColor: summary.color || '#888888' }}
                     />
                     <span className="truncate">{summary.name}</span>
                </div>
                 {/* Nilai Bersih (Net) */}
                 <span className={cn(
                    "font-semibold tabular-nums text-base shrink-0", // Jangan wrap
                    summary.net >= 0 ? 'text-primary' : 'text-destructive'
                )}>
                    {formatCurrency(summary.net)}
                </span>
            </div>
            {/* Detail Pemasukan & Pengeluaran */}
            <div className="flex justify-between text-xs text-muted-foreground border-t pt-2 mt-2"> {/* mt-2 */}
                <div className="space-y-0.5 text-left"> {/* space-y lebih kecil */}
                    <span className="block">Pemasukan:</span>
                    <span className="block font-medium text-success tabular-nums">
                        {summary.totalIncome > 0 ? formatCurrency(summary.totalIncome) : '-'}
                    </span>
                </div>
                 <div className="space-y-0.5 text-right"> {/* space-y lebih kecil */}
                    <span className="block">Pengeluaran:</span>
                    <span className="block font-medium text-danger tabular-nums">
                        {summary.totalExpense > 0 ? formatCurrency(summary.totalExpense) : '-'}
                    </span>
                </div>
            </div>
        </CardContent>
    </Card>
);

// --- Komponen Card Total Mobile ---
const MobileTotalSummaryCard = ({ total }: { total: { income: number; expense: number; net: number } }) => (
    <Card className="mt-4 bg-muted/50 shadow-sm"> {/* Shadow ringan */}
        <CardContent className="p-3 space-y-1.5 text-sm"> {/* Padding & space disesuaikan */}
            <div className="flex justify-between font-medium">
                <span>Total Pemasukan:</span>
                <span className="text-success tabular-nums">{formatCurrency(total.income)}</span>
            </div>
            <div className="flex justify-between font-medium">
                <span>Total Pengeluaran:</span>
                <span className="text-danger tabular-nums">{formatCurrency(total.expense)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1.5 mt-1.5"> {/* Teks base, padding & margin disesuaikan */}
                <span>Arus Bersih:</span>
                <span className={cn('tabular-nums', total.net >= 0 ? 'text-primary' : 'text-destructive')}>
                    {formatCurrency(total.net)}
                </span>
            </div>
        </CardContent>
    </Card>
);
// --- Akhir Komponen Card Mobile ---

export function CategorySummaryTable({ period }: CategorySummaryTableProps) {
    const isMobile = useIsMobile(); // <-- Gunakan hook
    const dateRange = useMemo(() => calculateDateRange(period), [period]);
    const { categories: incomeCategories, isLoading: incomeLoading } = useCategories('income');
    const { categories: expenseCategories, isLoading: expenseLoading } = useCategories('expense');
    const { transactions, isLoading: transactionsLoading } = useTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
    });

    const isLoading = incomeLoading || expenseLoading || transactionsLoading;

    // Kalkulasi summary (Tetap sama)
    const categorySummary = useMemo((): CategorySummary[] => {
        if (isLoading) return []; // Cek loading di awal

        const summaryMap = new Map<string | null, CategorySummary>();
        const allCategories = [...incomeCategories, ...expenseCategories];

        allCategories.forEach(cat => {
            if (cat?.id) {
                summaryMap.set(cat.id, { id: cat.id, name: cat.name, color: cat.color, totalIncome: 0, totalExpense: 0, net: 0 });
            }
        });
        if (!summaryMap.has(null)) {
            summaryMap.set(null, { id: null, name: 'Uncategorized', color: '#888888', totalIncome: 0, totalExpense: 0, net: 0 });
        }

        transactions.forEach(t => {
            let categoryId: string | null = t.category_id;
            let entry = summaryMap.get(categoryId);
            if (!entry) { // Jika kategori tidak ditemukan (mungkin sudah dihapus) atau null
                categoryId = null;
                entry = summaryMap.get(null);
            }
             if (!entry) return; // Safety check jika 'Uncategorized' pun tidak ada (seharusnya tidak terjadi)

            if (t.type === 'income') entry.totalIncome += t.amount;
            else entry.totalExpense += t.amount;
            entry.net = entry.totalIncome - entry.totalExpense;
        });

        return Array.from(summaryMap.values())
            .filter(summary => summary.totalIncome > 0 || summary.totalExpense > 0)
            .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)); // Sort descending by absolute net value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, incomeCategories, expenseCategories, isLoading]); // Update dependency

    // Hitung Grand Total (Tetap sama)
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

    // Kalkulasi periodName (Tetap sama)
     const periodName = useMemo(() => {
        switch (period) {
            case 'today': return 'Hari Ini';
            case 'this-week': return 'Minggu Ini';
            case 'this-month': return 'Bulan Ini';
            case 'this-year': return 'Tahun Ini';
            default: return period; // Handle custom range if added later
        }
     }, [period]);

    // --- Skeleton Loading State (Responsif) ---
    if (isLoading) {
        return (
             <Card className="shadow-medium col-span-full">
                <CardHeader>
                     <Skeleton className="h-6 w-3/4 mb-1" />
                     <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                            <Skeleton className="h-20 w-full rounded-lg mt-4" /> {/* Total Skeleton */}
                        </div>
                     ) : (
                         <div className="space-y-2">
                             <Skeleton className="h-10 w-full" /> {/* Header */}
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-12 w-full mt-4" /> {/* Footer */}
                         </div>
                     )}
                </CardContent>
             </Card>
        );
    }
    // --- Akhir Skeleton ---

    return (
        <Card className="shadow-medium col-span-full">
            <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                     <List className="h-5 w-5 text-primary" />
                     Ringkasan per Kategori
                 </CardTitle>
                 <CardDescription>Pemasukan & Pengeluaran per kategori untuk {periodName}.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* --- Render Kondisional Mobile/Desktop --- */}
                {isMobile ? (
                    <div className="space-y-3">
                        {categorySummary.length === 0 ? (
                             <div className="text-center py-16 text-muted-foreground"> {/* Padding lebih besar */}
                                <FileWarning className="mx-auto h-10 w-10 mb-3 text-primary/50" /> {/* Ikon lebih besar */}
                                <p className="font-medium">Tidak Ada Data</p>
                                <p className="text-sm">Belum ada ringkasan kategori untuk periode ini.</p>
                            </div>
                        ) : (
                            categorySummary.map((summary) => (
                                <MobileCategorySummaryCard key={summary.id || 'uncategorized'} summary={summary} />
                            ))
                        )}
                        {/* Tampilkan Total Card hanya jika ada data */}
                        {categorySummary.length > 0 && <MobileTotalSummaryCard total={grandTotal} />}
                    </div>
                ) : (
                    // Tampilan Tabel Desktop (kode tidak berubah)
                    <div className="relative w-full overflow-auto max-h-[400px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-[40%]">Kategori</TableHead>
                                    <TableHead className="w-[20%] text-right text-success">Pemasukan</TableHead>
                                    <TableHead className="w-[20%] text-right text-danger">Pengeluaran</TableHead>
                                    <TableHead className="w-[20%] text-right font-semibold">Bersih</TableHead>
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
                             <TableFooter className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10"> {/* Efek blur */}
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
                )}
                {/* --- Akhir Render Kondisional --- */}
            </CardContent>
        </Card>
    );
}