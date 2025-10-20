import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag, Palette } from "lucide-react";
import { useMemo } from "react";

import { useCategories, Category, TransactionType } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

// 1. Definisikan Schema Validasi
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Nama kategori harus minimal 2 karakter.",
  }).max(50, {
    message: "Nama kategori maksimal 50 karakter.",
  }),
  icon: z.string().optional(), // Diabaikan sementara, akan diimplementasikan nanti
  color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: "Warna harus dalam format HEX valid (misalnya: #10B981).",
  }).or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  type: TransactionType;
  defaultValues?: Category | null;
  onClose: () => void;
}

export function CategoryForm({ type, defaultValues, onClose }: CategoryFormProps) {
  const isEditing = !!defaultValues;
  const initialColor = defaultValues?.color || (type === "income" ? "#10B981" : "#EF4444");

  // 2. Inisialisasi Form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      icon: defaultValues?.icon || "",
      color: initialColor,
    },
  });

  // Mengambil fungsi mutasi dari hook yang sudah dibuat sebelumnya
  const { addCategory, updateCategory } = useCategories(type);
  const { isSubmitting } = form.formState;
  const currentColor = form.watch("color");

  // Custom color handler agar user bisa mengetik tanpa '#' di awal
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value.startsWith("#") && value.length === 7) {
      // Langsung update jika sudah benar
      form.setValue("color", value, { shouldValidate: true });
    } else if (!value.startsWith("#") && value.length <= 6) {
      // Tambahkan '#' jika tidak ada dan belum lengkap
      form.setValue("color", `#${value}`, { shouldValidate: true });
    } else {
      form.setValue("color", value, { shouldValidate: true });
    }
  }

  // Untuk menampilkan preview tag di sebelah label
  const TagPreview = useMemo(() => {
    return (
        <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border"
            style={{ 
                backgroundColor: currentColor,
                color: '#FFFFFF', // Asumsi teks putih untuk kontras
                borderColor: currentColor, 
            }}
        >
            <Tag className="h-3 w-3" />
            <span className="truncate max-w-24">{form.watch("name") || "Preview"}</span>
        </div>
    );
  }, [currentColor, form.watch("name")]);

  // 3. Handle Submit
  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const finalColor = values.color.length === 7 ? values.color : `#${values.color.substring(1)}`;

      if (isEditing) {
        // Logika Update
        await updateCategory({
          id: defaultValues!.id,
          name: values.name,
          color: finalColor,
          icon: values.icon,
        });
      } else {
        // Logika Add
        await addCategory({
          name: values.name,
          type: type,
          color: finalColor,
          icon: values.icon,
        });
      }
      onClose();
    } catch (error: any) {
      // Error sudah ditangani di useCategories
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Category Type Info */}
        <div className="space-y-1">
            <Label>Tipe Kategori</Label>
            <Badge 
              variant={type === 'income' ? 'secondary' : 'destructive'} 
              className="capitalize"
            >
              {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Badge>
        </div>

        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kategori</FormLabel>
              <FormControl>
                <Input 
                    placeholder={type === 'income' ? "Gaji Bulanan" : "Biaya Makanan"} 
                    {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Color Field */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                <span>Warna (HEX)</span>
                {TagPreview}
              </FormLabel>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-10 w-10 flex-shrink-0 rounded-md border" 
                  style={{ backgroundColor: currentColor }}
                />
                <FormControl>
                  <Input 
                    placeholder="#XXXXXX" 
                    {...field} 
                    onChange={handleColorChange}
                    className={cn({ "border-danger focus-visible:ring-danger": form.formState.errors.color })}
                    maxLength={7}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Icon Field (Placeholder) */}
        <div className="space-y-2">
            <Label htmlFor="icon">Ikon</Label>
            <div className="flex items-center space-x-2 rounded-md bg-muted p-3 text-muted-foreground">
                <Palette className="h-4 w-4" />
                <span className="text-sm">Fitur pemilih ikon akan ditambahkan kemudian. Saat ini, kategori menggunakan ikon default.</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Simpan Perubahan" : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </Form>
  );
}