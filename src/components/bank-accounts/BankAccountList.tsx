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

// Komponen untuk menampilkan satu item rekening bank
const BankAccountItem = ({ account, onDelete, onEdit }: { account: BankAccount, onDelete: (id: string) => void, onEdit: (account: BankAccount) => void }) => {
  return (
    <Card className="shadow-medium hover:shadow-large transition-shadow animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">{account.bank_name}</CardTitle>
        </div>
        
        {/* Action Dropdown */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(account)} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Rekening?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda yakin ingin menghapus rekening <span className="font-semibold text-foreground"> "{account.account_name}" </span>? Semua transaksi yang terhubung dengan rekening ini akan terpengaruh.
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
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold text-primary">
            {formatCurrency(account.balance)}
        </p>
        <CardDescription>{account.account_name}</CardDescription>
        {account.account_number && (
            <Badge variant="outline">{account.account_number}</Badge>
        )}
      </CardContent>
    </Card>
  );
};

// Komponen utama daftar rekening
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

  // Skeletal Loading UI
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full md:w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full hidden lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Total Balance Summary Card (Sesuai Blueprint) */}
        <Card className="bg-primary text-primary-foreground shadow-large animate-scale-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Saldo Rekening
                </CardTitle>
                <Wallet className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">
                    {formatCurrency(totalBalance)}
                </div>
                <p className="text-xs opacity-75 mt-1">Total dari {accounts.length} rekening aktif.</p>
            </CardContent>
        </Card>


      {/* Header dan Tombol Tambah */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daftar Rekening</h2>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setEditingAccount(null);
          }
        }}>
          <SheetTrigger asChild>
            <Button onClick={handleNew} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              + Tambah Rekening
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Card className="shadow-none border-dashed">
          <CardContent className="pt-6 text-center space-y-2">
            <Landmark className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada rekening bank yang terdaftar.</p>
            <Button variant="link" onClick={handleNew}>
              Tambah Rekening Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}