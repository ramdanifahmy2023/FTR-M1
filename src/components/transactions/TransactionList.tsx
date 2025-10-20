import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown, Wallet, Tag } from "lucide-react";

import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { ReportFilterValues } from "@/components/reports/ReportFilters"; // Pastikan path ini benar
import { useIsMobile } from "@/hooks/use-mobile"; // Hook untuk deteksi mobile

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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // Hapus SheetTrigger jika tidak dipakai langsung di sini
import { TransactionForm } from "./TransactionForm"; // Import form transaksi
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"; // Import pagination
import { cn } from "@/lib/utils";

interface TransactionListProps {
    filters: ReportFilterValues;
}

// Komponen utama
export function TransactionList({ filters }: TransactionListProps) { // <-- Fungsi komponen dimulai di sini

    // --- Pindahkan semua hook dan state ke dalam fungsi komponen ---
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10; // Jumlah item per halaman

    // Sesuaikan filter untuk hook useTransactions
    const transactionFilters = useMemo(() => ({
        startDate: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        type: filters.type === 'all' ? undefined : filters.type,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        bankAccountId: filters.bankAccountId === 'all' ? undefined : (filters.bankAccountId === 'null' ? null : filters.bankAccountId), // Handle 'null' string
        searchQuery: filters.searchQuery || undefined,
    }), [filters]);

    const { transactions, isLoading, deleteTransaction } = useTransactions(transactionFilters);

    // --- Logic Pagination ---
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return transactions.slice(startIndex, endIndex);
    }, [transactions, currentPage]);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    // Reset ke halaman 1 jika filter berubah atau jumlah halaman berkurang drastis
    useMemo(() => {
        setCurrentPage(1);
    }, [filters, totalPages]);


    // --- Handlers ---
    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTransaction(id);
            // Optional: Tambahkan notifikasi sukses jika perlu
        } catch (error) {
            // Optional: Tambahkan notifikasi error jika perlu
            console.error("Failed to delete transaction:", error);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // --- Render Pagination Items ---
    const renderPaginationItems = () => {
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
                <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                 />
            </PaginationItem>
        );

        // Start Ellipsis
        if (startPage > 1) {
             pageItems.push(
                <PaginationItem key="start-ellipsis">
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                pageItems.push(
                    <PaginationItem key="start-more-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }


        // Page Number Buttons
        for (let i = startPage; i <= endPage; i++) {
            pageItems.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                        isActive={i === currentPage}
                        className="cursor-pointer"
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // End Ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageItems.push(
                    <PaginationItem key="end-more-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
             pageItems.push(
                 <PaginationItem key="end-ellipsis">
                     <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink>
                 </PaginationItem>
             );
        }


        // Next Button
        pageItems.push(
            <PaginationItem key="next">
                <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                     className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                />
            </PaginationItem>
        );

        return pageItems;
    };
    // --- End Render Pagination Items ---


    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => ( // Tampilkan 5 skeleton saja
                    isMobile
                        ? <Skeleton key={i} className="h-28 w-full" />
                        : <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    } // <-- Pindahkan kurung kurawal penutup if ke sini

    // --- Return JSX utama ---
    return ( // <-- Return JSX dimulai di sini
        <>
            {/* Tampilan Mobile (Card Layout) */}
            {isMobile && (
                <div className="space-y-3">
                    {paginatedTransactions.length === 0 ? (
                        <Card className="shadow-none border-dashed">
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                Tidak ada transaksi ditemukan.
                            </CardContent>
                        </Card>
                    ) : (
                        paginatedTransactions.map((t) => (
                            <Card key={t.id} className="shadow-sm animate-slide-up">
                                <CardContent className="pt-4 flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        <Badge
                                            variant={t.type === 'income' ? 'secondary' : 'destructive'}
                                            className={cn('capitalize text-xs mb-1',
                                                t.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                                            )}
                                        >
                                            {t.type}
                                        </Badge>
                                        <p className={cn('font-semibold text-lg',
                                            t.type === 'income' ? 'text-success' : 'text-danger'
                                        )}>
                                            {formatCurrency(t.amount)}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                            <Tag className="h-3 w-3 flex-shrink-0" /> {t.categories?.name || "Uncategorized"}
                                        </p>
                                        {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                                        {t.bank_accounts && (
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <Wallet className="h-3 w-3 flex-shrink-0" /> {t.bank_accounts.account_name}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {format(new Date(t.transaction_date), 'dd MMM yyyy', { locale: id })}
                                        </p>
                                    </div>
                                    {/* Action Dropdown Mobile */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-2">
                                                 <MoreHorizontal className="h-4 w-4" />
                                             </Button>
                                         </DropdownMenuTrigger>
                                         <DropdownMenuContent align="end">
                                             <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer">
                                                 <Pencil className="mr-2 h-4 w-4" /> Edit
                                             </DropdownMenuItem>
                                             <AlertDialog>
                                                 <AlertDialogTrigger asChild>
                                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                                                         <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                     </DropdownMenuItem>
                                                 </AlertDialogTrigger>
                                                 <AlertDialogContent>
                                                     <AlertDialogHeader>
                                                         <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                                         <AlertDialogDescription>
                                                             Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.
                                                         </AlertDialogDescription>
                                                     </AlertDialogHeader>
                                                     <AlertDialogFooter>
                                                         <AlertDialogCancel>Batal</AlertDialogCancel>
                                                         <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                                                     </AlertDialogFooter>
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
                <div className="relative w-full overflow-auto rounded-md border">
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Rekening</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Tidak ada transaksi ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map((t) => (
                                    <TableRow key={t.id} className="animate-slide-up hover:bg-muted/50">
                                        <TableCell>{format(new Date(t.transaction_date), 'dd/MM/yy', { locale: id })}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={t.type === 'income' ? 'secondary' : 'destructive'}
                                                className={cn('capitalize',
                                                    t.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                                                )}
                                            >
                                                {t.type}
                                            </Badge>
                                        </TableCell>
                                         <TableCell className="flex items-center gap-2">
                                             {t.categories?.color && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: t.categories.color }}/>}
                                             {t.categories?.name || "Uncategorized"}
                                         </TableCell>
                                        <TableCell className="max-w-[200px] truncate">{t.description || '-'}</TableCell>
                                        <TableCell>{t.bank_accounts?.account_name || 'Tunai/Lainnya'}</TableCell>
                                        <TableCell className={cn('text-right font-medium',
                                             t.type === 'income' ? 'text-success' : 'text-danger'
                                         )}>
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {/* Action Dropdown Desktop */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                         <MoreHorizontal className="h-4 w-4" />
                                                     </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     <DropdownMenuItem onClick={() => handleEdit(t)} className="cursor-pointer">
                                                         <Pencil className="mr-2 h-4 w-4" /> Edit
                                                     </DropdownMenuItem>
                                                     <AlertDialog>
                                                         <AlertDialogTrigger asChild>
                                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                                                                 <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                             </DropdownMenuItem>
                                                         </AlertDialogTrigger>
                                                         <AlertDialogContent>
                                                             <AlertDialogHeader>
                                                                 <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                                                 <AlertDialogDescription>
                                                                     Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.
                                                                 </AlertDialogDescription>
                                                             </AlertDialogHeader>
                                                             <AlertDialogFooter>
                                                                 <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                 <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                                                             </AlertDialogFooter>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        {renderPaginationItems()}
                    </PaginationContent>
                </Pagination>
            )}

            {/* Sheet for Editing Transaction */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) setEditingTransaction(null); // Reset saat ditutup
            }}>
                <SheetContent side="right" className="sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Edit Transaksi</SheetTitle>
                        <SheetDescription>
                            Ubah detail transaksi Anda. Tipe transaksi tidak dapat diubah.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {/* Berikan defaultValues ke form */}
                        <TransactionForm
                            defaultValues={editingTransaction}
                            onClose={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    ); // <-- Kurung tutup return JSX
} // <-- Kurung tutup fungsi komponen