// src/components/transactions/TransactionList.tsx

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Wallet, Tag, FileWarning, CalendarDays, ArrowUpDown, ArrowDown, ArrowUp, Plus } from "lucide-react"; // <-- Tambah Plus

import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { ReportFilterValues } from "@/components/reports/ReportFilters";
import { useIsMobile } from "@/hooks/use-mobile";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TransactionForm } from "./TransactionForm";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

// ... (Interface dan Type tetap sama)
interface TransactionListProps {
    filters: ReportFilterValues;
}

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: keyof Transaction | 'categories.name' | null;
    direction: SortDirection;
}

export function TransactionList({ filters }: TransactionListProps) {
    // ... (state, hooks, memo, handlers tetap sama, termasuk useEffect untuk reset halaman)
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = isMobile ? 8 : 10;
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'transaction_date', direction: 'descending' });

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
                if (sortConfig.key === 'categories.name') {
                    aValue = a.categories?.name?.toLowerCase() || '';
                    bValue = b.categories?.name?.toLowerCase() || '';
                } else {
                    const key = sortConfig.key as keyof Transaction;
                    aValue = key in a ? a[key] : '';
                    bValue = key in b ? b[key] : '';
                }

                 if (sortConfig.key === 'transaction_date') {
                    aValue = new Date(a.transaction_date + 'T00:00:00').getTime();
                    bValue = new Date(b.transaction_date + 'T00:00:00').getTime();
                 } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                 } else if (typeof aValue !== typeof bValue) {
                     aValue = String(aValue);
                     bValue = String(bValue);
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

    React.useEffect(() => {
         setCurrentPage(1);
     }, [filters, sortConfig]);

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsSheetOpen(true);
    };
    const handleDelete = async (id: string) => {
        try { await deleteTransaction(id); }
        catch (error) { console.error("Failed to delete transaction:", error); }
    };
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };
    const requestSort = (key: keyof Transaction | 'categories.name') => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderPaginationItems = () => {
         // ... (logika render pagination tetap sama) ...
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
        pageItems.push(
            <PaginationItem key="prev">
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")} />
            </PaginationItem>
        );
        if (startPage > 1) {
             pageItems.push(<PaginationItem key="start-ellipsis-1"><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink></PaginationItem>);
            if (startPage > 2) pageItems.push(<PaginationItem key="start-more-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }
        for (let i = startPage; i <= endPage; i++) {
            pageItems.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={i === currentPage} className="cursor-pointer">{i}</PaginationLink>
                </PaginationItem>
            );
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageItems.push(<PaginationItem key="end-more-ellipsis"><PaginationEllipsis /></PaginationItem>);
             pageItems.push(<PaginationItem key="end-ellipsis-last"><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink></PaginationItem>);
        }
        pageItems.push(
            <PaginationItem key="next">
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")} />
            </PaginationItem>
        );
        return pageItems;
    };

    const getSortIcon = (columnKey: keyof Transaction | 'categories.name') => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-2 h-3 w-3" />;
        return <ArrowDown className="ml-2 h-3 w-3" />;
    };

    if (isLoading) {
        const skeletonCount = isMobile ? 4 : 5;
        return (
            <div className="space-y-4">
                {[...Array(skeletonCount)].map((_, i) => ( isMobile ? <Skeleton key={i} className="h-32 w-full rounded-lg" /> : <Skeleton key={i} className="h-14 w-full" /> ))}
            </div>
        );
    }

    // --- Tombol Tambah Transaksi (jika tidak ada data) ---
    const OpenAddTransactionSheetButton = () => (
        <Button
            variant="default"
            onClick={() => { /* Logika buka sheet tambah */
                // Anda perlu trigger sheet tambah dari parent (Transactions.tsx) atau pindah state sheet ke sini
                // Untuk sekarang, kita log saja
                console.log("Tombol Tambah Transaksi diklik dari Empty State");
                // Jika ingin membuka sheet dari sini, perlu passing prop onAddNewTransaction
                // onAddNewTransaction?.();
            }}
            className="gradient-primary mt-4" // Tambah margin atas
        >
            <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi Pertama Anda
        </Button>
    );

    return (
        <>
            {/* Tampilan Mobile (Card Layout) */}
            {isMobile && (
                <div className="space-y-3">
                    {paginatedTransactions.length === 0 ? (
                        // --- PENYEMPURNAAN EMPTY STATE MOBILE ---
                         <Card className="shadow-none border-dashed mt-6 animate-fade-in">
                           <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <FileWarning className="h-10 w-10" />
                                </div>
                                <p className="text-lg font-medium text-muted-foreground">
                                    Belum ada transaksi ditemukan.
                                </p>
                                {/* Tombol Add bisa ditambahkan di sini jika sheet state dikelola di sini */}
                                {/* <OpenAddTransactionSheetButton /> */}
                           </CardContent>
                         </Card>
                         // --- AKHIR PENYEMPURNAAN ---
                    ) : (
                        paginatedTransactions.map((t) => (
                           // ... (Kode Card Item Transaksi Mobile tetap sama) ...
                            <Card key={t.id} className="shadow-sm animate-slide-up overflow-hidden">
                                <CardContent className="p-4 flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-1.5 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded-full flex-shrink-0 border" style={{ backgroundColor: t.categories?.color || '#888888' }} />
                                             <span className="text-sm font-medium truncate">{t.categories?.name || "Uncategorized"}</span>
                                             {t.categories?.icon && <DynamicIcon name={t.categories.icon} className="h-3 w-3 text-muted-foreground ml-auto" />}
                                        </div>
                                        <p className={cn('font-semibold text-lg tabular-nums', t.type === 'income' ? 'text-success' : 'text-danger')}> {formatCurrency(t.amount)} </p>
                                        {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground pt-1">
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
                                             <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                      <button className={cn( "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full", "text-destructive focus:bg-accent focus:text-destructive", "cursor-pointer" )} onClick={(e) => e.stopPropagation()} onSelect={(e) => e.preventDefault()} >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                      </button>
                                                 </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                     <AlertDialogHeader> <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle> <AlertDialogDescription> Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan. </AlertDialogDescription> </AlertDialogHeader>
                                                     <AlertDialogFooter> <AlertDialogCancel>Batal</AlertDialogCancel> <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction> </AlertDialogFooter>
                                                 </AlertDialogContent>
                                             </AlertDialog>
                                         </DropdownMenuContent>
                                     </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Tampilan Desktop (Table Layout) */}
            {!isMobile && (
                <div className="rounded-md border mt-6 animate-fade-in"> {/* Tambah mt-6 dan animasi */}
                    <Table>
                         <TableHeader>
                            <TableRow>
                                {/* ... (Kode TableHeader tetap sama) ... */}
                                <TableHead className="w-[120px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('transaction_date')}> <div className="flex items-center"> Tanggal {getSortIcon('transaction_date')} </div> </TableHead>
                                <TableHead className="w-[100px]">Tipe</TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('categories.name')}> <div className="flex items-center"> Kategori {getSortIcon('categories.name')} </div> </TableHead>
                                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('description')}>Deskripsi {getSortIcon('description')}</TableHead>
                                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('bank_account_id')}>Rekening {getSortIcon('bank_account_id')}</TableHead>
                                <TableHead className="text-right w-[150px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('amount')}> <div className="flex items-center justify-end"> Jumlah {getSortIcon('amount')} </div> </TableHead>
                                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                // --- PENYEMPURNAAN EMPTY STATE DESKTOP ---
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground"> {/* Tinggikan cell */}
                                        <div className="flex flex-col items-center justify-center gap-3"> {/* Tambah gap */}
                                            <div className="bg-primary/10 p-3 rounded-full text-primary"> {/* Latar ikon */}
                                                <FileWarning className="h-10 w-10" /> {/* Perbesar ikon */}
                                            </div>
                                            <span className="text-lg font-medium">Tidak ada transaksi ditemukan.</span>
                                            {/* Tombol Add bisa ditambahkan di sini */}
                                            {/* <OpenAddTransactionSheetButton /> */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                // --- AKHIR PENYEMPURNAAN ---
                            ) : (
                                paginatedTransactions.map((t) => (
                                   // ... (Kode TableRow item transaksi tetap sama) ...
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
                                        <TableCell className="py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"> <MoreHorizontal className="h-4 w-4" /> </Button>
                                                </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end">
                                                     <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer"> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                                     <AlertDialog>
                                                         <AlertDialogTrigger asChild>
                                                              <button className={cn( "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full", "text-destructive focus:bg-accent focus:text-destructive", "cursor-pointer" )} onClick={(e) => e.stopPropagation()} onSelect={(e) => e.preventDefault()} >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                              </button>
                                                         </AlertDialogTrigger>
                                                         <AlertDialogContent>
                                                             <AlertDialogHeader> <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle> <AlertDialogDescription> Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan. </AlertDialogDescription> </AlertDialogHeader>
                                                             <AlertDialogFooter> <AlertDialogCancel>Batal</AlertDialogCancel> <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction> </AlertDialogFooter>
                                                         </AlertDialogContent>
                                                     </AlertDialog>
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

            {/* Pagination Controls (Tetap Sama) */}
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        {renderPaginationItems()}
                    </PaginationContent>
                </Pagination>
            )}

            {/* Sheet for Editing Transaction (Tetap Sama) */}
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
        </>
    );
}