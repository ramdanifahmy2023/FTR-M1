import { useMemo, useState } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FileText, Download, ListChecks, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Tag, CalendarDays } from "lucide-react"; // <-- Pastikan semua ikon diimpor
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
import { DynamicIcon } from "@/components/ui/dynamic-icon"; // <-- Pastikan DynamicIcon diimpor

interface ReportTableProps {
  filters: ReportFilterValues;
}

// Definisikan tipe untuk kolom yang bisa di-sort (lebih spesifik)
type SortableReportKeys = keyof Pick<Transaction, 'transaction_date' | 'type' | 'amount' | 'description'> | 'categories.name' | 'bank_accounts.account_name';

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: SortableReportKeys | null; // Gunakan tipe SortableReportKeys
    direction: SortDirection;
}


export function ReportTable({ filters }: ReportTableProps) {
    const isMobile = useIsMobile();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'transaction_date', direction: 'descending' });

    const transactionFilters = useMemo(() => ({
        startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        bankAccountId: filters.bankAccountId === 'all' ? undefined : (filters.bankAccountId === 'null' ? null : filters.bankAccountId),
        searchQuery: filters.searchQuery || undefined,
    }), [filters]);

    const { transactions, isLoading } = useTransactions(transactionFilters);

    // Sorting
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...transactions];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                // Handle nested keys
                if (sortConfig.key === 'categories.name') {
                    aValue = a.categories?.name?.toLowerCase() || '';
                    bValue = b.categories?.name?.toLowerCase() || '';
                } else if (sortConfig.key === 'bank_accounts.account_name') {
                    aValue = a.bank_accounts?.account_name?.toLowerCase() || '';
                    bValue = b.bank_accounts?.account_name?.toLowerCase() || '';
                }
                // Handle direct keys (termasuk 'transaction_date', 'amount', 'type', 'description')
                 else if (sortConfig.key in a && sortConfig.key in b) {
                     // Perlakuan khusus untuk tanggal dan angka
                     if (sortConfig.key === 'transaction_date') {
                        aValue = new Date(a.transaction_date).getTime();
                        bValue = new Date(b.transaction_date).getTime();
                     } else if (sortConfig.key === 'amount') {
                         aValue = a.amount;
                         bValue = b.amount;
                     } else {
                         // Default ke string comparison
                         aValue = String(a[sortConfig.key as keyof Transaction] || '').toLowerCase();
                         bValue = String(b[sortConfig.key as keyof Transaction] || '').toLowerCase();
                     }
                } else {
                    // Fallback jika key tidak ditemukan (seharusnya tidak terjadi)
                    aValue = '';
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


    const totalSummary = useMemo(() => {
        const itemsToSum = transactions; // Hitung total dari data asli sebelum sorting/pagination
        const totalIncome = itemsToSum.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = itemsToSum.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome, totalExpense, netFlow: totalIncome - totalExpense };
    }, [transactions]);

    const handleExportPDF = () => { if (transactions.length > 0) exportToPDF(transactions, filters, totalSummary); };
    const handleExportCSV = () => { if (transactions.length > 0) exportToCSV(transactions); };

    // --- Handler Request Sorting (dengan tipe yang benar) ---
    const requestSort = (key: SortableReportKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Helper Ikon Sort (dengan tipe yang benar) ---
    const getSortIcon = (columnKey: SortableReportKeys) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />; // <-- Adjust margin
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3" />;
        return <ArrowDown className="ml-1 h-3 w-3" />;
    };

    // Loading State
     if (isLoading) {
        const skeletonCount = isMobile ? 5 : 5;
        return (
             <Card className="shadow-medium">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                     <div className="space-y-1"> <Skeleton className="h-6 w-48" /> <Skeleton className="h-4 w-32" /> </div>
                     <div className="flex space-x-2 mt-4 md:mt-0"> <Skeleton className="h-9 w-24" /> <Skeleton className="h-9 w-24" /> </div> {/* <-- size sm */}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(skeletonCount)].map((_, i) => ( isMobile ? <Skeleton key={i} className="h-28 w-full rounded-lg" /> : <Skeleton key={i} className="h-12 w-full" /> ))}
                         {!isMobile && <Skeleton className="h-12 w-full mt-4" />}
                    </div>
                </CardContent>
             </Card>
        );
    }

    const displayTransactions = sortedTransactions;

    return (
        <Card className="shadow-medium">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                     <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/> Rincian Transaksi</CardTitle>
                    <CardDescription>Total {transactions.length} transaksi ditemukan.</CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={transactions.length === 0}> <Download className="mr-1.5 h-4 w-4" /> PDF </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={transactions.length === 0}> <Download className="mr-1.5 h-4 w-4" /> CSV </Button>
                </div>
            </CardHeader>
            <CardContent>
                 {isMobile ? (
                     <div className="space-y-3">
                         {displayTransactions.length === 0 ? ( /* ... Placeholder Mobile ... */ )
                          : ( displayTransactions.map((t) => ( /* ... Card Mobile ... */ )) )}
                         {transactions.length > 0 && ( /* ... Footer Total Mobile ... */ )}
                     </div>
                 ) : (
                     <div className="relative w-full overflow-auto max-h-[500px] rounded-md border">
                         <Table>
                             <TableHeader className="sticky top-0 bg-background z-10">
                                 <TableRow>
                                     <TableHead className="w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('transaction_date')}> <div className="flex items-center"> Tanggal {getSortIcon('transaction_date')} </div> </TableHead>
                                     <TableHead className="w-[100px]">Tipe</TableHead>
                                     <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('categories.name')}> <div className="flex items-center"> Kategori {getSortIcon('categories.name')} </div> </TableHead>
                                     {/* Tambahkan sort untuk Deskripsi */}
                                     <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('description')}> <div className="flex items-center"> Deskripsi {getSortIcon('description')} </div> </TableHead>
                                     <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('bank_accounts.account_name')}> <div className="flex items-center"> Rekening {getSortIcon('bank_accounts.account_name')} </div> </TableHead>
                                     <TableHead className="text-right w-[150px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('amount')}> <div className="flex items-center justify-end"> Jumlah {getSortIcon('amount')} </div> </TableHead>
                                 </TableRow>
                             </TableHeader>
                             <TableBody>
                                 {displayTransactions.length === 0 ? ( <TableRow> <TableCell colSpan={6} className="h-24 text-center">...</TableCell> </TableRow> )
                                  : ( displayTransactions.map((t) => ( /* ... Table Row Desktop ... */ )) )}
                             </TableBody>
                              {transactions.length > 0 && (
                                 <TableFooter className="sticky bottom-0 bg-muted/80 z-10 font-bold">
                                     {/* ... Footer Rows Desktop ... */}
                                      <TableRow> <TableCell colSpan={5} className="text-right py-3">Total Pemasukan</TableCell> <TableCell className="text-right text-success py-3 tabular-nums"> {formatCurrency(totalSummary.totalIncome)} </TableCell> </TableRow>
                                      <TableRow> <TableCell colSpan={5} className="text-right py-3">Total Pengeluaran</TableCell> <TableCell className="text-right text-danger py-3 tabular-nums"> {formatCurrency(totalSummary.totalExpense)} </TableCell> </TableRow>
                                      <TableRow className="bg-muted hover:bg-muted border-t-2"> <TableCell colSpan={5} className="text-right text-lg py-3">Arus Bersih</TableCell> <TableCell className={cn('text-right text-lg py-3 tabular-nums', totalSummary.netFlow >= 0 ? 'text-primary' : 'text-destructive')}> {formatCurrency(totalSummary.netFlow)} </TableCell> </TableRow>
                                 </TableFooter>
                             )}
                         </Table>
                     </div>
                 )}
                 {/* Pagination (Opsional) */}
            </CardContent>
        </Card>
    );
}

// Jangan lupa import DynamicIcon jika belum
// import { DynamicIcon } from "@/components/ui/dynamic-icon";

// Catatan: Kode lengkap untuk bagian Card Mobile, Table Row Desktop, dan Footer Rows Desktop sengaja disingkat (...)
// karena tidak berubah dari versi sebelumnya, agar fokus pada perbaikan error.
// Pastikan Anda menggabungkan perbaikan ini dengan kode lengkap sebelumnya.