// src/components/reports/ReportTable.tsx

import React, { useMemo, useState } from "react"; // <-- Pastikan React diimpor
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    FileText,
    Download,
    ListChecks,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Wallet,
    Tag, // <-- Tag tidak digunakan langsung di sini, bisa dihapus jika tidak perlu
    CalendarDays,
    FileWarning
} from "lucide-react"; // <-- Tambahkan FileWarning
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportFilterValues } from "./ReportFilters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface ReportTableProps {
  filters: ReportFilterValues;
}

// Tipe kunci yang bisa disortir (termasuk relasi)
type SortableReportKeys = keyof Pick<Transaction, 'transaction_date' | 'type' | 'amount' | 'description'> | 'categories.name' | 'bank_accounts.account_name';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: SortableReportKeys | null;
    direction: SortDirection;
}


// --- Komponen Card Mobile (untuk kejelasan) ---
const MobileTransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const category = transaction.categories;
    const account = transaction.bank_accounts;
    const isIncome = transaction.type === 'income';

    return (
        <Card key={transaction.id} className="shadow-sm animate-slide-up overflow-hidden">
            <CardContent className="p-4 flex justify-between items-start gap-3">
                <div className="flex-1 space-y-1.5 overflow-hidden">
                    {/* Kategori */}
                    <div className="flex items-center gap-2">
                         <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0 border"
                            style={{ backgroundColor: category?.color || 'hsl(var(--muted))' }}
                        />
                         <span className="text-sm font-medium truncate">{category?.name || "Uncategorized"}</span>
                         {category?.icon && <DynamicIcon name={category.icon} className="h-3 w-3 text-muted-foreground ml-auto" />} {/* Tampilkan ikon jika ada */}
                    </div>
                    {/* Jumlah */}
                    <p className={cn('font-semibold text-lg tabular-nums', isIncome ? 'text-success' : 'text-danger')}>
                        {formatCurrency(transaction.amount)}
                    </p>
                    {/* Deskripsi */}
                    {transaction.description && <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>}
                    {/* Info Tambahan: Rekening & Tanggal */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground pt-1">
                        {account && (
                            <span className="flex items-center gap-1 truncate">
                                <Wallet className="h-3 w-3 flex-shrink-0" /> {account.account_name} ({account.bank_name})
                            </span>
                        )}
                         <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 flex-shrink-0" />
                            {/* Pastikan parse tanggal sebagai local time */}
                             {format(new Date(transaction.transaction_date + 'T00:00:00'), 'dd MMM yy', { locale: id })}
                         </span>
                    </div>
                </div>
                {/* Aksi tidak ditambahkan di sini untuk ReportTable */}
            </CardContent>
        </Card>
    );
};
// --- Akhir Komponen Card Mobile ---


export function ReportTable({ filters }: ReportTableProps) {
    const isMobile = useIsMobile();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'transaction_date', direction: 'descending' });

    // Memoize filter object for useTransactions hook
    const transactionFilters = useMemo(() => ({
        startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        bankAccountId: filters.bankAccountId === 'all' ? undefined : (filters.bankAccountId === 'null' ? null : filters.bankAccountId),
        searchQuery: filters.searchQuery || undefined,
    }), [filters]);

    // Fetch transactions based on filters
    const { transactions, isLoading, error } = useTransactions(transactionFilters);

    // Memoize sorted transactions
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...(transactions || [])]; // Handle potential null/undefined
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;
                // Handle sorting by related table fields
                if (sortConfig.key === 'categories.name') {
                    aValue = a.categories?.name?.toLowerCase() || '';
                    bValue = b.categories?.name?.toLowerCase() || '';
                } else if (sortConfig.key === 'bank_accounts.account_name') {
                    aValue = a.bank_accounts?.account_name?.toLowerCase() || '';
                    bValue = b.bank_accounts?.account_name?.toLowerCase() || '';
                } else if (sortConfig.key in a && sortConfig.key in b) {
                     // Handle sorting by direct transaction fields
                     if (sortConfig.key === 'transaction_date') {
                        // Ensure correct date comparison (parse as local)
                        aValue = new Date(a.transaction_date + 'T00:00:00').getTime();
                        bValue = new Date(b.transaction_date + 'T00:00:00').getTime();
                     } else if (sortConfig.key === 'amount') {
                         aValue = a.amount;
                         bValue = b.amount;
                     } else {
                         aValue = String(a[sortConfig.key as keyof Transaction] || '').toLowerCase();
                         bValue = String(b[sortConfig.key as keyof Transaction] || '').toLowerCase();
                     }
                } else {
                    aValue = ''; // Fallback for safety
                    bValue = '';
                }

                // Comparison logic
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [transactions, sortConfig]);

    // Calculate total summary (memoized)
    const totalSummary = useMemo(() => {
        const itemsToSum = transactions || [];
        const totalIncome = itemsToSum.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = itemsToSum.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome, totalExpense, netFlow: totalIncome - totalExpense };
    }, [transactions]);

    // Export Handlers
    const handleExportPDF = () => {
        if (transactions && transactions.length > 0) {
            exportToPDF(transactions, filters, totalSummary);
        } else {
            console.warn("No transaction data to export to PDF.");
            // Consider adding a toast notification here:
            // toast.info("Tidak ada data transaksi untuk diekspor ke PDF.");
        }
    };
    const handleExportCSV = () => {
        if (transactions && transactions.length > 0) {
            exportToCSV(transactions);
        } else {
            console.warn("No transaction data to export to CSV.");
            // Consider adding a toast notification here:
            // toast.info("Tidak ada data transaksi untuk diekspor ke CSV.");
        }
    };

    // Sort Request Handler
    const requestSort = (key: SortableReportKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get Sort Icon Helper
    const getSortIcon = (columnKey: SortableReportKeys) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3" />;
        return <ArrowDown className="ml-1 h-3 w-3" />;
    };

    // --- Loading State ---
     if (isLoading) {
        const skeletonCount = isMobile ? 5 : 5; // Adjust count as needed
        return (
             <Card className="shadow-medium mt-6"> {/* Add margin top */}
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                     <div className="space-y-1"> <Skeleton className="h-6 w-48" /> <Skeleton className="h-4 w-32" /> </div>
                     <div className="flex space-x-2 mt-4 md:mt-0"> <Skeleton className="h-9 w-24" /> <Skeleton className="h-9 w-24" /> </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(skeletonCount)].map((_, i) => (
                             isMobile
                                ? <Skeleton key={i} className="h-28 w-full rounded-lg" />
                                : <Skeleton key={i} className="h-12 w-full" />
                         ))}
                         {/* Skeleton for footer in desktop */}
                         {!isMobile && <Skeleton className="h-12 w-full mt-4" />}
                    </div>
                </CardContent>
             </Card>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <Card className="shadow-medium border-destructive mt-6">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <FileWarning className="h-5 w-5"/> Gagal Memuat Data
                    </CardTitle>
                    <CardDescription>Terjadi kesalahan saat mengambil data transaksi.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive-foreground bg-destructive p-3 rounded">{error.message}</p>
                    {/* Optional: Add a refresh button */}
                    {/* <Button variant="destructive" className="mt-4" onClick={() => queryClient.refetchQueries(queryKey)}>Coba Lagi</Button> */}
                </CardContent>
            </Card>
        );
    }
    // --- End Error State ---


    const displayTransactions = sortedTransactions; // Use sorted data for display

    return (
        <Card className="shadow-medium animate-fade-in mt-6"> {/* Add margin top and animation */}
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                     <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/> Rincian Transaksi</CardTitle>
                     <CardDescription>
                       {displayTransactions.length > 0
                          ? `Total ${displayTransactions.length} transaksi ditemukan sesuai filter.`
                          : "Tidak ada transaksi ditemukan untuk kriteria filter ini."}
                    </CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!transactions || transactions.length === 0}> <Download className="mr-1.5 h-4 w-4" /> PDF </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!transactions || transactions.length === 0}> <Download className="mr-1.5 h-4 w-4" /> CSV </Button>
                </div>
            </CardHeader>
            <CardContent>
                 {isMobile ? (
                     <div className="space-y-3">
                         {/* --- Refined Mobile Empty State --- */}
                         {displayTransactions.length === 0 ? (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                                 <div className="bg-primary/10 p-3 rounded-full text-primary mb-3">
                                    <FileWarning className="h-10 w-10" />
                                 </div>
                                 <p className="text-lg font-medium">Data Tidak Ditemukan</p>
                                 <p className="text-sm">Coba ubah kriteria filter Anda.</p>
                             </div>
                          ) : (
                             displayTransactions.map((t) => (
                                <MobileTransactionCard key={t.id} transaction={t} />
                             ))
                          )}
                         {/* Footer Total Mobile (only if data exists) */}
                         {transactions && transactions.length > 0 && (
                             <Card className="mt-4 bg-muted/50">
                                 <CardContent className="p-4 space-y-2 text-sm">
                                     <div className="flex justify-between font-medium">
                                        <span>Total Pemasukan:</span>
                                        <span className="text-success tabular-nums">{formatCurrency(totalSummary.totalIncome)}</span>
                                     </div>
                                     <div className="flex justify-between font-medium">
                                        <span>Total Pengeluaran:</span>
                                        <span className="text-danger tabular-nums">{formatCurrency(totalSummary.totalExpense)}</span>
                                     </div>
                                     <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                                        <span>Arus Bersih:</span>
                                        <span className={cn('tabular-nums', totalSummary.netFlow >= 0 ? 'text-primary' : 'text-destructive')}>
                                            {formatCurrency(totalSummary.netFlow)}
                                        </span>
                                     </div>
                                 </CardContent>
                             </Card>
                         )}
                         {/* --- End Refined Mobile Empty State --- */}
                     </div>
                 ) : (
                     // Tampilan Desktop (Table)
                     <div className="relative w-full overflow-auto max-h-[500px] rounded-md border">
                         <Table>
                             <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('transaction_date')}> <div className="flex items-center"> Tanggal {getSortIcon('transaction_date')} </div> </TableHead>
                                    <TableHead className="w-[100px]">Tipe</TableHead>
                                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('categories.name')}> <div className="flex items-center"> Kategori {getSortIcon('categories.name')} </div> </TableHead>
                                    <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('description')}> <div className="flex items-center"> Deskripsi {getSortIcon('description')} </div> </TableHead>
                                    <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('bank_accounts.account_name')}> <div className="flex items-center"> Rekening {getSortIcon('bank_accounts.account_name')} </div> </TableHead>
                                    <TableHead className="text-right w-[150px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('amount')}> <div className="flex items-center justify-end"> Jumlah {getSortIcon('amount')} </div> </TableHead>
                                </TableRow>
                             </TableHeader>
                             <TableBody>
                                 {/* --- Refined Desktop Empty State --- */}
                                 {displayTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="bg-primary/10 p-3 rounded-full text-primary mb-3">
                                                    <FileWarning className="h-10 w-10" />
                                                </div>
                                                <span className="text-lg font-medium">Data Tidak Ditemukan</span>
                                                <span className="text-sm">Silakan sesuaikan filter Anda.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                  ) : (
                                     displayTransactions.map((t) => (
                                         <TableRow key={t.id} className="hover:bg-muted/50">
                                             <TableCell className="py-3">{format(new Date(t.transaction_date + 'T00:00:00'), 'dd/MM/yy', { locale: id })}</TableCell>
                                             <TableCell className="py-3"> <Badge variant="outline" className={cn('capitalize text-xs font-medium', t.type === 'income' ? 'border-success/50 text-success' : 'border-danger/50 text-danger')}> {t.type} </Badge> </TableCell>
                                             <TableCell className="flex items-center gap-2 py-3">
                                                 <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 border" style={{ backgroundColor: t.categories?.color || 'hsl(var(--muted))' }} />
                                                  <span className="truncate">{t.categories?.name || "Uncategorized"}</span>
                                                  {t.categories?.icon && <DynamicIcon name={t.categories.icon} className="h-3 w-3 text-muted-foreground ml-auto" />}
                                             </TableCell>
                                             <TableCell className="max-w-[200px] truncate py-3 hidden lg:table-cell">{t.description || '-'}</TableCell>
                                             <TableCell className="py-3 hidden md:table-cell">{t.bank_accounts?.account_name || 'Tunai/Lainnya'}</TableCell>
                                             <TableCell className={cn('text-right font-medium tabular-nums py-3', t.type === 'income' ? 'text-success' : 'text-danger')}> {formatCurrency(t.amount)} </TableCell>
                                         </TableRow>
                                     ))
                                  )}
                                  {/* --- End Refined Desktop Empty State --- */}
                             </TableBody>
                              {/* Footer (only if data exists) */}
                              {transactions && transactions.length > 0 && (
                                   <TableFooter className="sticky bottom-0 bg-muted/80 z-10 font-bold">
                                       <TableRow>
                                           <TableCell colSpan={5} className="text-right py-3">Total Pemasukan</TableCell>
                                           <TableCell className="text-right text-success py-3 tabular-nums">{formatCurrency(totalSummary.totalIncome)}</TableCell>
                                       </TableRow>
                                       <TableRow>
                                           <TableCell colSpan={5} className="text-right py-3">Total Pengeluaran</TableCell>
                                           <TableCell className="text-right text-danger py-3 tabular-nums">{formatCurrency(totalSummary.totalExpense)}</TableCell>
                                       </TableRow>
                                       <TableRow className="bg-muted hover:bg-muted border-t-2">
                                           <TableCell colSpan={5} className="text-right text-lg py-3">Arus Bersih</TableCell>
                                           <TableCell className={cn('text-right text-lg py-3 tabular-nums', totalSummary.netFlow >= 0 ? 'text-primary' : 'text-destructive')}>{formatCurrency(totalSummary.netFlow)}</TableCell>
                                       </TableRow>
                                   </TableFooter>
                               )}
                         </Table>
                     </div>
                 )}
            </CardContent>
        </Card>
    );
}