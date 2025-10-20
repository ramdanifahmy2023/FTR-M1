import { useState } from "react";
import { Plus, Briefcase, TrendingUp, TrendingDown, ArrowRight, MoreHorizontal, Pencil, Trash2, Landmark } from "lucide-react"; // <-- Import Landmark
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { useAssets, Asset } from "@/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/utils/currency";
import { AssetForm } from "./AssetForm";
import { cn } from "@/lib/utils";

// Komponen untuk menampilkan satu item aset (DIREFAKTOR)
const AssetItem = ({ asset, onDelete, onEdit }: { asset: Asset, onDelete: (id: string) => void, onEdit: (asset: Asset) => void }) => {
  const pnl = asset.current_value - asset.purchase_value;
  const isProfit = pnl >= 0;
  const PnLIcon = isProfit ? TrendingUp : TrendingDown;
  const PnLColor = isProfit ? 'text-success' : 'text-danger';

  return (
    <Card className="shadow-medium hover:shadow-large transition-shadow animate-slide-up flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4"> {/* <-- items-start, sesuaikan padding */}
         <div className="space-y-1"> {/* <-- Bungkus judul */}
            <CardTitle className="text-base font-semibold flex items-center gap-2">
                 {/* Opsional: Ikon berdasarkan tipe aset? Untuk sekarang pakai Briefcase */}
                 <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                 <span className="truncate">{asset.asset_name}</span> {/* <-- Truncate */}
            </CardTitle>
             {/* Pindahkan Badge Tipe ke sini */}
             <Badge variant="outline" className="capitalize text-xs">{asset.asset_type}</Badge>
         </div>
        {/* Action Dropdown (Tetap Sama) */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-1"> {/* <-- Sesuaikan margin */}
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(asset)} className="cursor-pointer">
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
                            <AlertDialogTitle>Hapus Aset?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda yakin ingin menghapus aset <span className="font-semibold text-foreground"> "{asset.asset_name}" </span>? Aksi ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(asset.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-end space-y-2"> {/* <-- Tambah flex-1 flex flex-col justify-end space-y-2 */}
        {/* Nilai Saat Ini */}
        <div className="mt-2"> {/* <-- Beri jarak atas */}
             <CardDescription className="text-xs mb-0.5">Nilai Saat Ini</CardDescription> {/* <-- Perkecil deskripsi */}
            <p className="text-2xl font-bold text-primary tabular-nums">
                {formatCurrency(asset.current_value)}
            </p>
        </div>

        {/* Detail Pembelian & PnL */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-dashed space-y-1"> {/* <-- Tambah space-y-1 */}
             <div className="flex justify-between items-center">
                 <span>Nilai Beli: {formatCurrency(asset.purchase_value)}</span>
                 <span className="text-right">
                     Tgl: {format(new Date(asset.purchase_date), 'dd/MM/yy', { locale: id })} {/* <-- Format tanggal lebih singkat */}
                 </span>
            </div>
             <div className="flex justify-between items-center font-medium"> {/* <-- Buat PnL sedikit menonjol */}
                 <span>Profit/Loss:</span>
                 <span className={cn("flex items-center gap-1 tabular-nums", PnLColor)}>
                     <PnLIcon className="h-3 w-3" />
                     {formatCurrency(pnl)}
                 </span>
             </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponen utama daftar aset (Perubahan minor)
export function AssetList() {
  const { assets, totalAssetValue, isLoading, deleteAsset } = useAssets();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsSheetOpen(true);
  };

  const handleNew = () => {
    setEditingAsset(null);
    setIsSheetOpen(true);
  }

  const handleDelete = async (id: string) => {
    await deleteAsset(id);
  }

  // Skeletal Loading UI (Tetap Sama)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full md:w-1/3 lg:w-1/4" /> {/* <-- Lebar berbeda */}
        <Skeleton className="h-10 w-36 mb-4" /> {/* Skeleton tombol tambah */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* <-- Tambah xl:grid-cols-4 */}
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)} {/* <-- Sesuaikan tinggi */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Total Asset Value Summary Card */}
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-primary-foreground shadow-large animate-scale-in w-full md:w-1/3 lg:w-1/4"> {/* <-- Ubah gradient & atur lebar */}
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Nilai Aset
                </CardTitle>
                <Briefcase className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">
                    {formatCurrency(totalAssetValue)}
                </div>
                <p className="text-xs opacity-80 mt-1">{assets.length} aset tercatat.</p> {/* <-- Opacity */}
            </CardContent>
        </Card>

      {/* Header dan Tombol Tambah (Tetap Sama) */}
      <div className="flex items-center justify-between mt-6"> {/* <-- Tambah margin atas */}
        <h2 className="text-xl font-semibold">Daftar Aset</h2>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingAsset(null);
        }}>
          <SheetTrigger asChild>
            <Button onClick={handleNew} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Aset
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{editingAsset ? "Edit Aset" : "Tambah Aset Baru"}</SheetTitle>
              <SheetDescription>
                {editingAsset ? "Ubah detail aset Anda." : "Masukkan detail aset yang Anda miliki."}
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <AssetForm
                defaultValues={editingAsset}
                onClose={() => setIsSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Daftar Aset */}
      {assets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* <-- Tambah xl:grid-cols-4 */}
          {assets.map((asset) => (
            <AssetItem
              key={asset.id}
              asset={asset}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        // Placeholder (Gunakan Card)
        <Card className="shadow-none border-dashed col-span-full"> {/* <-- Tambah col-span-full */}
           <CardContent className="pt-6 text-center space-y-2 flex flex-col items-center justify-center min-h-[150px]"> {/* <-- Tambah min-h */}
            <Briefcase className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada aset berharga yang terdaftar.</p>
            <Button variant="link" onClick={handleNew} className="text-primary">
              Tambah Aset Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}