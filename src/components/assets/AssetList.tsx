// src/components/assets/AssetList.tsx

import { useState } from "react";
import { Plus, Briefcase, TrendingUp, TrendingDown, ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

// Komponen untuk menampilkan satu item aset
const AssetItem = ({ asset, onDelete, onEdit }: { asset: Asset, onDelete: (id: string) => void, onEdit: (asset: Asset) => void }) => {
  // Hitung profit/loss
  const pnl = asset.current_value - asset.purchase_value;
  const isProfit = pnl >= 0;
  
  const PnLIcon = isProfit ? TrendingUp : TrendingDown;
  const PnLColor = isProfit ? 'text-success' : 'text-danger';

  return (
    <Card className="shadow-medium hover:shadow-large transition-shadow animate-slide-up flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold truncate">{asset.asset_name}</CardTitle>
        </div>
        
        {/* Action Dropdown */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(asset)} className="cursor-pointer">
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
      <CardContent className="flex-1 space-y-2">
        <div className="flex justify-between items-end">
            <div className="space-y-0">
                <CardDescription className="text-sm">Nilai Saat Ini</CardDescription>
                <p className="text-2xl font-bold text-primary">
                    {formatCurrency(asset.current_value)}
                </p>
            </div>
            <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">{asset.asset_type}</Badge>
        </div>

        {/* Detail PnL */}
        <div className="text-xs text-muted-foreground pt-1 flex justify-between items-center border-t border-dashed">
            <span className="flex items-center gap-1">
                <PnLIcon className={cn("h-3 w-3", PnLColor)} />
                <span className={PnLColor}>{formatCurrency(pnl)}</span> ({isProfit ? 'Untung' : 'Rugi'})
            </span>
            <span className="text-right">
                Beli: {formatCurrency(asset.purchase_value)} <br/>
                <span className="text-xs">Tgl Beli: {format(new Date(asset.purchase_date), 'dd MMM yyyy', { locale: id })}</span>
            </span>
        </div>
        
      </CardContent>
    </Card>
  );
};

// Komponen utama daftar aset
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

  // Skeletal Loading UI
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full md:w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full hidden lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Total Asset Value Summary Card (Sesuai Blueprint) */}
        <Card className="bg-secondary text-secondary-foreground shadow-large animate-scale-in">
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
                <p className="text-xs opacity-75 mt-1">Total {assets.length} aset yang tercatat.</p>
            </CardContent>
        </Card>


      {/* Header dan Tombol Tambah */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daftar Aset</h2>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setEditingAsset(null);
          }
        }}>
          <SheetTrigger asChild>
            <Button onClick={handleNew} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              + Tambah Aset
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Card className="shadow-none border-dashed">
          <CardContent className="pt-6 text-center space-y-2">
            <Briefcase className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada aset berharga yang terdaftar.</p>
            <Button variant="link" onClick={handleNew}>
              Tambah Aset Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}