// src/components/transactions/TransactionList.tsx

import React, { useState, useMemo, useEffect } from "react"; // <-- Impor React & hook lain
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Wallet, Tag, FileWarning, CalendarDays, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";

// ... (impor komponen dan hook lainnya tetap sama) ...
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { ReportFilterValues } from "@/components/reports/ReportFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card"; // Hapus CardDescription, Header, Title jika tidak dipakai di Mobile Card
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Hapus AlertDialogTrigger dari sini jika tidak dipakai di luar map
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm } from "./TransactionForm";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface TransactionListProps {
    filters: ReportFilterValues;
}

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: keyof Transaction | 'categories.name' | 'bank_accounts.account_name' | null; // Tambahkan bank_accounts.account_name
    direction: SortDirection;
}

export function TransactionList({ filters }: TransactionListProps) {
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = isMobile ? 8 : 10;
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'transaction_date', direction: 'descending' });

    // --- State untuk dialog konfirmasi hapus ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    // --- Akhir state dialog ---

    // ... (transactionFilters, useTransactions, sortedTransactions, paginatedTransactions, totalPages tetap sama) ...
        const transactionFilters = useMemo(() => ({
        startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        bankAccountId: filters.bankAccountId === 'all' ? undefined : (filters.bankAccountId === 'null' ? null : filters.bankAccountId),
        searchQuery: filters.searchQuery || undefined,
    }), [filters]);

    const { transactions, isLoading, deleteTransaction } = useTransactions(transactionFilters);

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
                } else if (sortConfig.key === 'bank_accounts.account_name') { // Handle account name sort
                    aValue = a.bank_accounts?.account_name?.toLowerCase() || '';
                    bValue = b.bank_accounts?.account_name?.toLowerCase() || '';
                }
                // Handle direct keys
                 else if (sortConfig.key in a && sortConfig.key in b) {
                     const key = sortConfig.key as keyof Transaction;
                     if (key === 'transaction_date') {
                        // Pastikan parsing tanggal benar (tambahkan T00:00:00 untuk waktu lokal)
                        aValue = new Date(a.transaction_date + 'T00:00:00').getTime();
                        bValue = new Date(b.transaction_date + 'T00:00:00').getTime();
                     } else if (key === 'amount') {
                         aValue = a.amount;
                         bValue = b.amount;
                     } else {
                         aValue = String(a[key] || '').toLowerCase();
                         bValue = String(b[key] || '').toLowerCase();
                     }
                } else {
                    aValue = '';
                    bValue = '';
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [transactions, sortConfig]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return sortedTransactions.slice(startIndex, endIndex);
    }, [sortedTransactions, currentPage, ITEMS_PER_PAGE]);

    const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortConfig]);


    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsSheetOpen(true);
    };

    // --- Fungsi untuk membuka dialog konfirmasi ---
    const confirmDelete = (id: string) => {
        setTransactionToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    // --- Fungsi untuk menjalankan penghapusan ---
    const handleDeleteConfirm = async () => {
        if (transactionToDelete) {
            try {
                await deleteTransaction(transactionToDelete);
            } catch (error) {
                console.error("Failed to delete transaction:", error);
            } finally {
                setIsDeleteDialogOpen(false); // Selalu tutup dialog
                setTransactionToDelete(null); // Reset ID
            }
        }
    };
    // --- Akhir fungsi dialog ---

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Perbarui tipe key di requestSort
    const requestSort = (key: keyof Transaction | 'categories.name' | 'bank_accounts.account_name') => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderPaginationItems = () => { /* ... (fungsi render pagination tetap sama) ... */
         const pageItems = [];
        const maxPagesToShow = 5;
        const halfMaxPages = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfMaxPages);
        let endPage = Math.min(totalPages, currentPage + halfMaxPages);

        if (currentPage - halfMaxPages < 1) {
            endPage = Math.min(totalPages, maxPagesToShow);
        }
        if (currentPage + halfMaxPages > totalPages) {
            startPage = Math.max(1, totalPages - maxPagesToShow + 1);
        }

        // Prev Button
        pageItems.push(
            <PaginationItem key="prev">
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")} />
            </PaginationItem>
        );

        // Start Ellipsis
        if (startPage > 1) {
             pageItems.push(<PaginationItem key="start-ellipsis-1"><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink></PaginationItem>);
            if (startPage > 2) pageItems.push(<PaginationItem key="start-more-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }

        // Page Number Buttons
        for (let i = startPage; i <= endPage; i++) {
            pageItems.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={i === currentPage} className="cursor-pointer">{i}</PaginationLink>
                </PaginationItem>
            );
        }

        // End Ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageItems.push(<PaginationItem key="end-more-ellipsis"><PaginationEllipsis /></PaginationItem>);
             pageItems.push(<PaginationItem key="end-ellipsis-last"><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink></PaginationItem>);
        }

        // Next Button
        pageItems.push(
            <PaginationItem key="next">
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")} />
            </PaginationItem>
        );

        return pageItems;
     };

    // Perbarui tipe key di getSortIcon
    const getSortIcon = (columnKey: keyof Transaction | 'categories.name' | 'bank_accounts.account_name') => { /* ... (fungsi getSortIcon tetap sama) ... */
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-3 w-3" />;
        return <ArrowDown className="ml-2 h-3 w-3" />;
    };

    if (isLoading) { /* ... (skeleton loading tetap sama) ... */
         const skeletonCount = isMobile ? 4 : 5;
        return (
            <div className="space-y-4">
                {[...Array(skeletonCount)].map((_, i) => ( isMobile ? <Skeleton key={i} className="h-32 w-full rounded-lg" /> : <Skeleton key={i} className="h-14 w-full" /> ))}
            </div>
        );
     }

    return (
        <>
            {/* Tampilan Mobile */}
            {isMobile && (
                <div className="space-y-3">
                    {paginatedTransactions.length === 0 ? (
                        <Card className="shadow-none border-dashed">
                           <CardContent className="pt-6 text-center space-y-2 flex flex-col items-center justify-center min-h-[150px]">
                            <FileWarning className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Tidak ada transaksi ditemukan.</p>
                          </CardContent>
                        </Card>
                    ) : (
                        paginatedTransactions.map((t) => (
                            <Card key={t.id} className="shadow-sm animate-slide-up overflow-hidden">
                                <CardContent className="p-4 flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-1.5 overflow-hidden">
                                        {/* ... (detail card mobile) ... */}
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded-full flex-shrink-0 border" style={{ backgroundColor: t.categories?.color || '#888888' }} />
                                             <span className="text-sm font-medium truncate">{t.categories?.name || "Uncategorized"}</span>
                                        </div>
                                        <p className={cn('font-semibold text-lg tabular-nums', t.type === 'income' ? 'text-success' : 'text-danger')}> {formatCurrency(t.amount)} </p>
                                        {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                            {t.bank_accounts && ( <span className="flex items-center gap-1 truncate"> <Wallet className="h-3 w-3 flex-shrink-0" /> {t.bank_accounts.account_name} </span> )}
                                             <span className="flex items-center gap-1"> <CalendarDays className="h-3 w-3 flex-shrink-0" /> {format(new Date(t.transaction_date + 'T00:00:00'), 'dd MMM yy', { locale: id })} </span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-1 text-muted-foreground"> <MoreHorizontal className="h-4 w-4" /> </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer"> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                            {/* --- Tombol Hapus Programmatic Mobile --- */}
                                            <DropdownMenuItem
                                                onClick={() => confirmDelete(t.id)}
                                                className="text-destructive focus:text-destructive cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                            </DropdownMenuItem>
                                            {/* --- Akhir Tombol Hapus --- */}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Tampilan Desktop */}
            {!isMobile && (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* ... (TableHead dengan onClick={requestSort}) ... */}
                                <TableHead className="w-[120px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('transaction_date')}> <div className="flex items-center"> Tanggal {getSortIcon('transaction_date')} </div> </TableHead>
                                <TableHead className="w-[100px]">Tipe</TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('categories.name')}> <div className="flex items-center"> Kategori {getSortIcon('categories.name')} </div> </TableHead>
                                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('description')}>Deskripsi {getSortIcon('description')}</TableHead>
                                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('bank_accounts.account_name')}>Rekening {getSortIcon('bank_accounts.account_name')}</TableHead> {/* Sort account name */}
                                <TableHead className="text-right w-[150px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('amount')}> <div className="flex items-center justify-end"> Jumlah {getSortIcon('amount')} </div> </TableHead>
                                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                /* ... (placeholder row) ... */
                                 <TableRow> <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> <div className="flex flex-col items-center justify-center gap-2"> <FileWarning className="h-8 w-8" /> <span>Tidak ada transaksi ditemukan.</span> </div> </TableCell> </TableRow>
                            ) : (
                                paginatedTransactions.map((t) => (
                                    <TableRow key={t.id} className="animate-slide-up hover:bg-muted/50">
                                        {/* ... (TableCell data) ... */}
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
                                        <TableCell className="py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"> <MoreHorizontal className="h-4 w-4" /> </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer"> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                                    {/* --- Tombol Hapus Programmatic Desktop --- */}
                                                    <DropdownMenuItem
                                                        onClick={() => confirmDelete(t.id)}
                                                        className="text-destructive focus:text-destructive cursor-pointer">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                    </DropdownMenuItem>
                                                    {/* --- Akhir Tombol Hapus --- */}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && ( /* ... */ <Pagination className="mt-6">
                    <PaginationContent>
                        {renderPaginationItems()}
                    </PaginationContent>
                </Pagination>)}

            {/* Sheet for Editing Transaction */}
            {/* ... (Sheet code) ... */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setEditingTransaction(null); }}>
                <SheetContent side="right" className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Edit Transaksi</SheetTitle>
                        <SheetDescription> Ubah detail transaksi Anda. Tipe transaksi tidak dapat diubah. </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        <TransactionForm defaultValues={editingTransaction} onClose={() => setIsSheetOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* --- AlertDialog untuk Konfirmasi Hapus (di luar map) --- */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* --- Akhir AlertDialog --- */}
        </>
    );
}