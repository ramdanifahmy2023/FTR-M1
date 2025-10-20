import { useState } from "react";
import { Plus, Tag, Pencil, Trash2, Loader2, ArrowRight, MoreHorizontal } from "lucide-react";

import { useCategories, Category, TransactionType } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CategoryForm } from "./CategoryForm"; // Import Form yang baru dibuat

interface CategoryListProps {
  type: TransactionType;
}

// Komponen untuk menampilkan satu item kategori
const CategoryItem = ({ category, onDelete, onEdit }: { category: Category, onDelete: (id: string) => void, onEdit: (category: Category) => void }) => {
  const Icon = Tag; // Menggunakan Tag sebagai ikon default untuk saat ini

  return (
    <Card 
      className={cn(
        "flex items-center justify-between p-4 transition-all hover:shadow-medium animate-slide-up border-l-4",
      )}
      style={{ borderLeftColor: category.color || 'var(--primary)' }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div 
          className="h-8 w-8 flex items-center justify-center rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: category.color || 'hsl(var(--primary))' }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base truncate">{category.name}</CardTitle>
          <Badge variant={category.type === 'income' ? 'secondary' : 'destructive'} className="capitalize mt-1">
             {category.type}
          </Badge>
        </div>
      </div>
      
      {/* Action Buttons */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                <AlertDialogDescription>
                  Aksi ini tidak dapat dibatalkan. Kategori <span className="font-semibold text-foreground"> "{category.name}" </span> akan dihapus permanen. Pastikan tidak ada transaksi yang terhubung dengan kategori ini.
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
    </Card>
  );
};


export function CategoryList({ type }: CategoryListProps) {
  const { categories, isLoading, deleteCategory, isDeleting } = useCategories(type);
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

  // Skeletal Loading UI
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full md:block hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tombol Tambah Kategori (membuka Sheet/Modal) */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) {
          setEditingCategory(null); // Reset state edit saat Sheet ditutup
        }
      }}>
        <SheetTrigger asChild>
          <Button onClick={handleNew} className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" />
            + Tambah Kategori
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Card className="shadow-none border-dashed">
          <CardContent className="pt-6 text-center space-y-2">
            <Tag className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada kategori {type} yang ditambahkan.</p>
            <Button variant="link" onClick={handleNew}>
              Tambah Sekarang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}