// src/components/transactions/TransactionList.tsx

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Wallet, Tag, FileWarning, CalendarDays, ArrowUpDown, ArrowDown, ArrowUp, Plus } from "lucide-react";

import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { ReportFilterValues } from "@/components/reports/ReportFilters"; // Tetap gunakan tipe ini
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
import { DynamicIcon } from "@/components/ui/dynamic-icon"; // Import DynamicIcon

// Interface, Type, State, Hooks, Memo, Handler (Tetap sama seperti sebelumnya)
interface TransactionListProps {
    filters: ReportFilterValues;
}
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: keyof Transaction | 'categories.name' | 'bank_accounts.account_name' | null; // Tambah bank_accounts.account_name
    direction: SortDirection;
}

// --- Komponen Card Mobile yang Disempurnakan ---
const MobileTransactionCard = ({ transaction, onEdit, onDelete }: { transaction: Transaction, onEdit: (t: Transaction) => void, onDelete: (id: string) => void }) => {
    const category = transaction.categories;
    const account = transaction.bank_accounts;
    const isIncome = transaction.type === 'income';

    return (
        <Card key={transaction.id} className="shadow-sm animate-slide-up overflow-hidden">
            <CardContent className="p-3"> {/* Padding lebih kecil */}
                {/* Baris Atas: Kategori, Jumlah, Aksi */}
                <div className="flex justify-between items-start gap-3 mb-2">
                    {/* Kiri: Kategori & Ikon */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0 border"
                            style={{ backgroundColor: category?.color || 'hsl(var(--muted))' }}
                         />
                         <span className="text-sm font-medium truncate">{category?.name || "Uncategorized"}</span>
                         {category?.icon && <DynamicIcon name={category.icon} className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />}
                    </div>
                    {/* Kanan: Jumlah & Aksi */}
                    <div className="flex items-start gap-1 shrink-0">
                         <p className={cn('font-semibold text-lg tabular-nums', isIncome ? 'text-success' : 'text-danger')}>
                            {formatCurrency(transaction.amount)}
                         </p>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 -mr-2 -mt-1 text-muted-foreground"> <MoreHorizontal className="h-4 w-4" /> </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                 <DropdownMenuItem onClick={() => onEdit(transaction)} className="cursor-pointer"> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                                 <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                          {/* Use button structure for consistency */}
                                          <button className={cn( "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full", "text-destructive focus:bg-accent focus:text-destructive", "cursor-pointer" )} onClick={(e) => e.stopPropagation()} onSelect={(e) => e.preventDefault()} >
                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                          </button>
                                     </AlertDialogTrigger>
                                      <AlertDialogContent>
                                         <AlertDialogHeader> <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle> <AlertDialogDescription> Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan. </AlertDialogDescription> </AlertDialogHeader>
                                         <AlertDialogFooter> <AlertDialogCancel>Batal</AlertDialogCancel> <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction> </AlertDialogFooter>
                                     </AlertDialogContent>
                                 </AlertDialog>
                             </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                </div>
                 {/* Baris Bawah: Deskripsi, Rekening, Tanggal */}
                 <div className="space-y-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                      {transaction.description && (
                          <p className="truncate italic">"{transaction.description}"</p>
                      )}
                      <div className="flex justify-between items-center gap-2">
                          {account ? (
                              <span className="flex items-center gap-1 truncate">
                                  <Wallet className="h-3 w-3 flex-shrink-0" /> {account.account_name}
                              </span>
                          ) : <span />} {/* Placeholder agar tanggal tetap di kanan */}
                           <span className="flex items-center gap-1 shrink-0">
                              <CalendarDays className="h-3 w-3 flex-shrink-0" />
                              {format(new Date(transaction.transaction_date + 'T00:00:00'), 'dd MMM yy', { locale: id })}
                          </span>
                      </div>
                 </div>
            </CardContent>
        </Card>
    );
};
// --- Akhir Komponen Card Mobile ---

export function TransactionList({ filters }: TransactionListProps) {
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = isMobile ? 8 : 10;
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'transaction_date', direction: 'descending' });

    // transactionFilters, useTransactions (Tetap Sama)
     const transactionFilters = useMemo(() => ({ /* ... filter memo ... */
         startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
         endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
         type: filters.type === 'all' ? undefined : filters.type,
         categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
         bankAccountId: filters.bankAccountId === 'all' ? undefined : (filters.bankAccountId === 'null' ? null : filters.bankAccountId),
         searchQuery: filters.searchQuery || undefined,
     }), [filters]);
    const { transactions, isLoading, deleteTransaction } = useTransactions(transactionFilters);

    // sortedTransactions (Tambahkan sort by bank account name)
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...transactions];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any; let bValue: any;
                // Handle sorting by related table fields
                if (sortConfig.key === 'categories.name') { aValue = a.categories?.name?.toLowerCase() || ''; bValue = b.categories?.name?.toLowerCase() || '';}
                else if (sortConfig.key === 'bank_accounts.account_name') { aValue = a.bank_accounts?.account_name?.toLowerCase() || ''; bValue = b.bank_accounts?.account_name?.toLowerCase() || '';} // <-- BARU
                else if (sortConfig.key in a && sortConfig.key in b) {
                     // Handle sorting by direct transaction fields (transaction_date, amount, type, description)
                     const key = sortConfig.key as keyof Transaction;
                     if (key === 'transaction_date') { aValue = new Date(a.transaction_date + 'T00:00:00').getTime(); bValue = new Date(b.transaction_date + 'T00:00:00').getTime();}
                     else if (key === 'amount') { aValue = a.amount; bValue = b.amount; }
                     else { aValue = String(a[key] || '').toLowerCase(); bValue = String(b[key] || '').toLowerCase(); }
                } else { aValue = ''; bValue = ''; } // Fallback

                // Comparison logic (Tetap Sama)
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [transactions, sortConfig]);

    // paginatedTransactions, totalPages, useEffect, handlers (Tetap Sama)
    const paginatedTransactions = useMemo(() => { /* ... slicing ... */
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
     }, [sortedTransactions, currentPage, ITEMS_PER_PAGE]);
    const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
    useEffect(() => { setCurrentPage(1); }, [filters, sortConfig]); // Reset halaman saat filter/sort berubah
    const handleEdit = (transaction: Transaction) => { setEditingTransaction(transaction); setIsSheetOpen(true); };
    const handleDelete = async (id: string) => { try { await deleteTransaction(id); } catch (error) { console.error("Delete failed:", error); } };
    const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
    const requestSort = (key: keyof Transaction | 'categories.name' | 'bank_accounts.account_name') => { // <-- Tambah bank_accounts.account_name
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
        setSortConfig({ key, direction });
    };

    // renderPaginationItems, getSortIcon (Tetap Sama)
    const renderPaginationItems = () => { /* ... logika render pagination ... */
         const pageItems = []; const maxPagesToShow = 5; const halfMaxPages = Math.floor(maxPagesToShow / 2);
         let startPage = Math.max(1, currentPage - halfMaxPages); let endPage = Math.min(totalPages, currentPage + halfMaxPages);
         if (currentPage - halfMaxPages < 1) { endPage = Math.min(totalPages, maxPagesToShow); }
         if (currentPage + halfMaxPages > totalPages) { startPage = Math.max(1, totalPages - maxPagesToShow + 1); }
         pageItems.push(<PaginationItem key="prev"><PaginationPrevious href="#" onClick={(e)=>{e.preventDefault(); handlePageChange(currentPage - 1);}} className={cn("cursor-pointer",currentPage === 1 && "pointer-events-none opacity-50")} /></PaginationItem>);
         if (startPage > 1) { pageItems.push(<PaginationItem key="start-ellipsis-1"><PaginationLink href="#" onClick={(e)=>{e.preventDefault(); handlePageChange(1);}}>1</PaginationLink></PaginationItem>); if (startPage > 2) pageItems.push(<PaginationItem key="start-more-ellipsis"><PaginationEllipsis /></PaginationItem>); }
         for (let i = startPage; i <= endPage; i++) { pageItems.push(<PaginationItem key={i}><PaginationLink href="#" onClick={(e)=>{e.preventDefault(); handlePageChange(i);}} isActive={i === currentPage} className="cursor-pointer">{i}</PaginationLink></PaginationItem>); }
         if (endPage < totalPages) { if (endPage < totalPages - 1) pageItems.push(<PaginationItem key="end-more-ellipsis"><PaginationEllipsis /></PaginationItem>); pageItems.push(<PaginationItem key="end-ellipsis-last"><PaginationLink href="#" onClick={(e)=>{e.preventDefault(); handlePageChange(totalPages);}}>{totalPages}</PaginationLink></PaginationItem>); }
         pageItems.push(<PaginationItem key="next"><PaginationNext href="#" onClick={(e)=>{e.preventDefault(); handlePageChange(currentPage + 1);}} className={cn("cursor-pointer",currentPage === totalPages && "pointer-events-none opacity-50")} /></PaginationItem>);
         return pageItems;
     };
    const getSortIcon = (columnKey: keyof Transaction | 'categories.name' | 'bank_accounts.account_name') => { /* ... logika get icon sort ... */
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
        if (sortConfig.direction === 'ascending') return <ArrowUp className="ml-1 h-3 w-3" />;
        return <ArrowDown className="ml-1 h-3 w-3" />;
     };

    // Skeleton Loading (Sudah Responsif)
    if (isLoading) {
        const skeletonCount = isMobile ? 4 : 5;
        return (
            <div className={cn("space-y-4", !isMobile && "rounded-md border p-4 mt-6")}> {/* Tambah border & padding desktop */}
                {[...Array(skeletonCount)].map((_, i) => (
                    isMobile ? <Skeleton key={i} className="h-24 w-full rounded-lg" /> : <Skeleton key={i} className="h-14 w-full" />
                ))}
                {/* Skeleton Pagination */}
                {totalPages > 1 && <Skeleton className="h-10 w-full max-w-xs mx-auto mt-6" />}
            </div>
        );
    }

    // --- Tombol Tambah Transaksi (jika tidak ada data) - Opsional ---
    // const OpenAddTransactionSheetButton = () => ( ... ); // Jika ingin tombol tambah di empty state

    return (
        <>
            {/* Tampilan Mobile (Card List) */}
            {isMobile && (
                <div className="space-y-3">
                    {paginatedTransactions.length === 0 ? (
                        <Card className="shadow-none border-dashed mt-6 animate-fade-in">
                           <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                                <div className="bg-primary/10 p-3 rounded-full text-primary mb-2">
                                    <FileWarning className="h-10 w-10" />
                                </div>
                                <p className="text-lg font-medium text-muted-foreground">
                                    Belum ada transaksi ditemukan.
                                </p>
                                <p className="text-sm text-muted-foreground">Coba ubah filter atau tambah transaksi baru.</p>
                                {/* Opsional: Tambah tombol di sini jika sheet state dikelola di parent */}
                                {/* <Button variant="default" onClick={() => setIsAddSheetOpen(true)} className="gradient-primary mt-4"> ... </Button> */}
                           </CardContent>
                         </Card>
                    ) : (
                        paginatedTransactions.map((t) => (
                           <MobileTransactionCard
                                key={t.id}
                                transaction={t}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Tampilan Desktop (Table Layout) */}
            {!isMobile && (
                 <div className="rounded-md border mt-6 animate-fade-in">
                    <Table>
                         <TableHeader>
                            <TableRow>
                                {/* Tambahkan sortable untuk Rekening */}
                                <TableHead className="w-[110px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('transaction_date')}> <div className="flex items-center"> Tanggal {getSortIcon('transaction_date')} </div> </TableHead>
                                <TableHead className="w-[100px]">Tipe</TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('categories.name')}> <div className="flex items-center"> Kategori {getSortIcon('categories.name')} </div> </TableHead>
                                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('description')}>Deskripsi {getSortIcon('description')}</TableHead>
                                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50" onClick={() => requestSort('bank_accounts.account_name')}> <div className="flex items-center"> Rekening {getSortIcon('bank_accounts.account_name')} </div> </TableHead>
                                <TableHead className="text-right w-[140px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('amount')}> <div className="flex items-center justify-end"> Jumlah {getSortIcon('amount')} </div> </TableHead>
                                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="bg-primary/10 p-3 rounded-full text-primary mb-2"><FileWarning className="h-10 w-10" /></div>
                                            <span className="text-lg font-medium">Tidak ada transaksi ditemukan.</span>
                                            <span className="text-sm">Silakan sesuaikan filter Anda.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-muted/50">
                                        <TableCell className="py-2.5">{format(new Date(t.transaction_date + 'T00:00:00'), 'dd/MM/yy', { locale: id })}</TableCell>
                                        <TableCell className="py-2.5"> <Badge variant="outline" className={cn('capitalize text-xs font-medium', t.type === 'income' ? 'border-success/50 text-success' : 'border-danger/50 text-danger')}> {t.type} </Badge> </TableCell>
                                         <TableCell className="flex items-center gap-2 py-2.5">
                                             <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 border" style={{ backgroundColor: t.categories?.color || 'hsl(var(--muted))' }} />
                                             <span className="truncate max-w-[150px]">{t.categories?.name || "Uncategorized"}</span> {/* Batasi lebar */}
                                              {t.categories?.icon && <DynamicIcon name={t.categories.icon} className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />} {/* shrink-0 */}
                                         </TableCell>
                                        <TableCell className="max-w-[200px] truncate py-2.5 hidden lg:table-cell">{t.description || '-'}</TableCell>
                                        <TableCell className="py-2.5 hidden md:table-cell truncate max-w-[150px]">{t.bank_accounts?.account_name || 'Tunai/Lainnya'}</TableCell> {/* Batasi lebar */}
                                        <TableCell className={cn('text-right font-medium tabular-nums py-2.5', t.type === 'income' ? 'text-success' : 'text-danger')}> {formatCurrency(t.amount)} </TableCell>
                                        <TableCell className="py-1"> {/* Padding Y dikurangi */}
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

            {/* Pagination Controls (Tampil jika > 1 halaman) */}
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        {renderPaginationItems()}
                    </PaginationContent>
                </Pagination>
            )}

            {/* Sheet for Editing Transaction */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setEditingTransaction(null); }}>
                <SheetContent side="right" className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Edit Transaksi</SheetTitle>
                        <SheetDescription> Ubah detail transaksi Anda. Tipe transaksi tidak dapat diubah. </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {editingTransaction && ( // Pastikan ada data sebelum render form
                            <TransactionForm defaultValues={editingTransaction} onClose={() => setIsSheetOpen(false)} />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}