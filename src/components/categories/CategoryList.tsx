// src/components/categories/CategoryList.tsx

import { useState } from "react";
import { Plus, Tag, Pencil, Trash2, Loader2, ArrowRight, MoreHorizontal, List } from "lucide-react"; // <-- Pastikan List ada

import { useCategories, Category, TransactionType } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CategoryForm } from "./CategoryForm";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface CategoryListProps {
  type: TransactionType;
}

// Komponen CategoryItem tetap sama
const CategoryItem = ({ category, onDelete, onEdit }: { category: Category, onDelete: (id: string) => void, onEdit: (category: Category) => void }) => {
  return (
    <Card className="shadow-medium hover:shadow-large transition-shadow animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
         <div className="flex items-center gap-3 min-w-0">
            <span
              className="h-8 w-8 rounded-full flex items-center justify-center border text-white flex-shrink-0"
              style={{ backgroundColor: category.color || 'hsl(var(--muted))' }}
            >
               <DynamicIcon name={category.icon} className="h-4 w-4" />
            </span>
             <CardTitle className="text-base font-semibold truncate">{category.name}</CardTitle>
         </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer">
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
                              <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Aksi ini tidak dapat dibatalkan. Kategori <span className="font-semibold text-foreground"> "{category.name}" </span> akan dihapus permanen.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </DropdownMenuContent>
          </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
           <Badge
              variant={category.type === 'income' ? 'secondary' : 'destructive'}
              className={cn('capitalize text-xs',
                  category.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
              )}
          >
              {category.type}
          </Badge>
      </CardContent>
    </Card>
  );
};


export function CategoryList({ type }: CategoryListProps) {
  const { categories, isLoading, deleteCategory } = useCategories(type);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };

  const handleNew = () => {
    setEditingCategory(null);
    setIsSheetOpen(true);
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
  }

  // Skeletal Loading UI (Tetap Sama)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tombol Tambah Kategori (Tetap Sama) */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) setEditingCategory(null);
      }}>
        <SheetTrigger asChild>
          <Button onClick={handleNew} className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</SheetTitle>
            <SheetDescription>
              {editingCategory ? "Ubah detail kategori Anda." : `Buat kategori baru untuk ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}.`}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <CategoryForm
              type={type}
              defaultValues={editingCategory}
              onClose={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Daftar Kategori */}
      {categories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        // --- PENYEMPURNAAN EMPTY STATE ---
        <Card className="shadow-none border-dashed col-span-full mt-6 animate-fade-in"> {/* Tambah mt-6 dan animasi */}
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]"> {/* Tinggikan min-h */}
            <div className="bg-primary/10 p-3 rounded-full text-primary"> {/* Warna latar ikon */}
                <Tag className="h-10 w-10" /> {/* Perbesar ikon */}
            </div>
            <p className="text-lg font-medium text-muted-foreground">
                Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}.
            </p>
            <Button variant="default" onClick={handleNew} className="gradient-primary"> {/* Gunakan button default */}
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori Pertama Anda
            </Button>
          </CardContent>
        </Card>
        // --- AKHIR PENYEMPURNAAN ---
      )}
    </div>
  );
}