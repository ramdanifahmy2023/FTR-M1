// src/components/reports/ReportTable.tsx

import { useMemo } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FileText, Download } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportFilterValues } from "./ReportFilters";

interface ReportTableProps {
  filters: ReportFilterValues;
}

export function ReportTable({ filters }: ReportTableProps) {
    // Sesuaikan filter untuk hook useTransactions
    const transactionFilters = useMemo(() => ({
        startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        bankAccountId: filters.bankAccountId === 'all' ? undefined : filters.bankAccountId,
        searchQuery: filters.searchQuery || undefined,
    }), [filters]);
    
    const { transactions, isLoading } = useTransactions(transactionFilters);

    // Hitung total di footer
    const totalSummary = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const netFlow = totalIncome - totalExpense;

        return { totalIncome, totalExpense, netFlow };
    }, [transactions]);

    if (isLoading) {
        return <Skeleton className="w-full h-[500px]" />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                    <CardTitle>Rincian Transaksi</CardTitle>
                    <CardDescription>Total {transactions.length} transaksi yang ditemukan.</CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button variant="outline" disabled={transactions.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Ekspor PDF
                    </Button>
                    <Button variant="outline" disabled={transactions.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Ekspor CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Rekening</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Tidak ada transaksi yang cocok dengan filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.transaction_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={t.type === 'income' ? 'secondary' : 'destructive'} 
                                                className={t.type === 'income' ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-danger hover:bg-danger/90 text-danger-foreground'}
                                            >
                                                {t.type === 'income' ? 'Masuk' : 'Keluar'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{t.categories?.name || "Uncategorized"}</TableCell>
                                        <TableCell className="max-w-xs truncate">{t.description || '-'}</TableCell>
                                        <TableCell>{t.bank_accounts?.account_name || 'Tunai/Lainnya'}</TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">Total Pemasukan</TableCell>
                                <TableCell className="text-right font-bold text-success">
                                    {formatCurrency(totalSummary.totalIncome)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">Total Pengeluaran</TableCell>
                                <TableCell className="text-right font-bold text-danger">
                                    {formatCurrency(totalSummary.totalExpense)}
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-muted hover:bg-muted">
                                <TableCell colSpan={5} className="text-right font-bold text-lg">Arus Bersih (Net Flow)</TableCell>
                                <TableCell className={`text-right font-bold text-lg ${totalSummary.netFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {formatCurrency(totalSummary.netFlow)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}