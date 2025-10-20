import { useState } from "react";
import { Plus, Landmark, Pencil, Trash2, MoreHorizontal, ArrowRight, Wallet } from "lucide-react";

import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/utils/currency";
import { BankAccountForm } from "./BankAccountForm";
import { cn } from "@/lib/utils"; // <-- Import cn

// Komponen untuk menampilkan satu item rekening bank (DIREFAKTOR)
const BankAccountItem = ({ account, onDelete, onEdit }: { account: BankAccount, onDelete: (id: string) => void, onEdit: (account: BankAccount) => void }) => {
  return (
    <Card className="shadow-medium hover:shadow-large transition-shadow animate-slide-up flex flex-col h-full"> {/* <-- Tambah flex flex-col h-full */}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4"> {/* <-- items-start, sesuaikan padding */}
        <div className="space-y-1"> {/* <-- Bungkus judul dan deskripsi */}
            <CardTitle className="text-base font-semibold flex items-center gap-2">
                 <Landmark className="h-4 w-4 text-primary flex-shrink-0" />
                 <span className="truncate">{account.bank_name}</span> {/* <-- Truncate nama bank */}
            </CardTitle>
            <CardDescription className="truncate">{account.account_name}</CardDescription> {/* <-- Truncate nama akun */}
        </div>
        {/* Action Dropdown (Tetap Sama) */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-1"> {/* <-- Sesuaikan margin */}
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(account)} className="cursor-pointer">
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
                            <AlertDialogTitle>Hapus Rekening?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda yakin ingin menghapus rekening <span className="font-semibold text-foreground"> "{account.account_name}" ({account.bank_name}) </span>? Aksi ini tidak dapat dibatalkan dan akan mempengaruhi transaksi terkait.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(account.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-end"> {/* <-- Tambah flex-1 flex flex-col justify-end */}
          <div className="space-y-1 mt-2"> {/* <-- Beri jarak atas */}
              <p className="text-2xl font-bold text-primary tabular-nums">
                  {formatCurrency(account.balance)}
              </p>
              {account.account_number && (
                  <Badge variant="outline" className="font-mono text-xs"> {/* <-- Style nomor rekening */}
                    {account.account_number}
                  </Badge>
              )}
          </div>
      </CardContent>
    </Card>
  );
};

// Komponen utama daftar rekening (Perubahan minor)
export function BankAccountList() {
  const { accounts, totalBalance, isLoading, deleteAccount } = useBankAccounts();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsSheetOpen(true);
  };

  const handleNew = () => {
    setEditingAccount(null);
    setIsSheetOpen(true);
  }

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
  }

  // Skeletal Loading UI (Tetap Sama)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full md:w-1/3 lg:w-1/4" /> {/* <-- Lebar berbeda */}
        <Skeleton className="h-10 w-40 mb-4" /> {/* Skeleton tombol tambah */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* <-- Tambah xl:grid-cols-4 */}
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)} {/* <-- Sesuaikan tinggi */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Total Balance Summary Card (Tetap Sama) */}
        <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-large animate-scale-in w-full md:w-1/3 lg:w-1/4"> {/* <-- Gunakan gradient & atur lebar */}
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Saldo
                </CardTitle>
                <Wallet className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">
                    {formatCurrency(totalBalance)}
                </div>
                <p className="text-xs opacity-80 mt-1">{accounts.length} rekening aktif.</p> {/* <-- Opacity lebih rendah */}
            </CardContent>
        </Card>


      {/* Header dan Tombol Tambah (Tetap Sama) */}
      <div className="flex items-center justify-between mt-6"> {/* <-- Tambah margin atas */}
        <h2 className="text-xl font-semibold">Daftar Rekening</h2>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}>
          <SheetTrigger asChild>
            <Button onClick={handleNew} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{editingAccount ? "Edit Rekening" : "Tambah Rekening Baru"}</SheetTitle>
              <SheetDescription>
                {editingAccount ? "Ubah detail rekening bank Anda." : "Masukkan detail rekening bank baru."}
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <BankAccountForm
                defaultValues={editingAccount}
                onClose={() => setIsSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>


      {/* Daftar Rekening */}
      {accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* <-- Tambah xl:grid-cols-4 */}
          {accounts.map((account) => (
            <BankAccountItem
              key={account.id}
              account={account}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        // Placeholder (Gunakan Card)
        <Card className="shadow-none border-dashed col-span-full"> {/* <-- Tambah col-span-full */}
           <CardContent className="pt-6 text-center space-y-2 flex flex-col items-center justify-center min-h-[150px]"> {/* <-- Tambah min-h */}
            <Landmark className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada rekening bank yang terdaftar.</p>
            <Button variant="link" onClick={handleNew} className="text-primary">
              Tambah Rekening Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}