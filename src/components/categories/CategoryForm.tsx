import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag, Palette } from "lucide-react"; // <-- Hapus Info jika tidak dipakai lagi
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
import { TablesInsert } from "@/integrations/supabase/types";
import { IconPicker } from "./IconPicker"; // <-- IMPORT IconPicker
import { DynamicIcon, isValidIconName } from "@/components/ui/dynamic-icon"; // <-- IMPORT DynamicIcon & helper

// Skema Validasi (Update type icon menjadi string)
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Nama kategori harus minimal 2 karakter." })
    .max(50, { message: "Nama kategori maksimal 50 karakter." }),
  icon: z.string().nullable().refine(val => val === null || isValidIconName(val), { // <-- Validasi nama ikon
      message: "Ikon tidak valid.",
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Warna harus dalam format HEX valid (#RRGGBB)." })
    .or(z.literal("")),
}).refine(data => data.color === "" || /^#[0-9A-F]{6}$/i.test(data.color), {
    message: "Warna harus dalam format HEX valid (#RRGGBB).",
    path: ["color"],
});


type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  type: TransactionType;
  defaultValues?: Category | null;
  onClose: () => void;
}

// Helper Kontras Teks (Tetap Sama)
const getContrastYIQ = (hexcolor: string): string => {
    // ... (fungsi getContrastYIQ tetap sama) ...
     if (!hexcolor || hexcolor.length < 7) return '#111827';
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#111827' : '#FFFFFF';
}

export function CategoryForm({ type, defaultValues, onClose }: CategoryFormProps) {
  const isEditing = !!defaultValues;
  const initialColor = defaultValues?.color || (type === "income" ? "#10B981" : "#EF4444");
  const initialIcon = (defaultValues?.icon && isValidIconName(defaultValues.icon)) ? defaultValues.icon : null; // <-- Default ikon jadi null

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      icon: initialIcon, // <-- Gunakan initialIcon
      color: initialColor,
    },
    mode: "onChange",
  });

  const { addCategory, updateCategory } = useCategories(type);
  const { isSubmitting, errors } = form.formState;
  const currentColor = form.watch("color");
  const currentName = form.watch("name");
  const currentIcon = form.watch("icon"); // <-- Watch ikon untuk preview

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (value.length > 6) value = value.substring(0, 6);
    form.setValue("color", `#${value}`, { shouldValidate: true });
  };

  // Preview Tag (Update untuk menyertakan ikon)
  const TagPreview = useMemo(() => {
    const isValidColor = /^#[0-9A-F]{6}$/i.test(currentColor);
    const bgColor = isValidColor ? currentColor : 'hsl(var(--muted))';
    const textColor = isValidColor ? getContrastYIQ(currentColor) : 'hsl(var(--muted-foreground))';
    const iconName = (currentIcon && isValidIconName(currentIcon)) ? currentIcon : 'Tag'; // Default ke Tag jika belum dipilih/invalid

    return (
        <Badge
            variant="outline"
            className="px-3 py-1 text-xs transition-colors duration-200 border"
            style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: isValidColor ? currentColor : 'hsl(var(--border))',
            }}
        >
             <DynamicIcon name={iconName} className="h-3 w-3 mr-1.5" /> {/* <-- Gunakan DynamicIcon */}
            <span className="truncate max-w-[100px]">{currentName || "Preview"}</span>
        </Badge>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentColor, currentName, currentIcon]); // <-- Tambah currentIcon dependency

  const onSubmit = async (values: CategoryFormValues) => {
    // Validasi warna (Tetap Sama)
    if (!/^#[0-9A-F]{6}$/i.test(values.color)) {
      form.setError("color", { type: "manual", message: "Format warna HEX tidak valid." });
      return;
    }
    // Pastikan ikon adalah nama yang valid atau null
     const finalIcon = (values.icon && isValidIconName(values.icon)) ? values.icon : null;

    try {
      const payload: Omit<TablesInsert<"categories">, 'user_id' | 'type'> & { type?: TransactionType } = {
        name: values.name,
        color: values.color,
        icon: finalIcon, // <-- Gunakan finalIcon
      };

      if (isEditing) {
        await updateCategory({ id: defaultValues!.id, ...payload });
      } else {
        await addCategory({ ...payload, type: type });
      }
      onClose();
    } catch (error: any) { /* Error ditangani hook */ }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* Category Type Info (Tetap Sama) */}
        <FormItem>
            <FormLabel>Tipe Kategori</FormLabel>
            <Badge variant="outline" className={cn("capitalize border-2 text-sm", type === 'income' ? 'border-success text-success' : 'border-danger text-danger')}>
              {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Badge>
        </FormItem>

        {/* Name Field (Tetap Sama) */}
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> ... </FormItem> )} /> {/* <-- Kode Field Nama disingkat */}

        {/* Color Field (Tetap Sama) */}
        <FormField control={form.control} name="color" render={({ field }) => ( <FormItem> ... </FormItem> )} /> {/* <-- Kode Field Warna disingkat */}


        {/* --- Icon Field (BARU) --- */}
        <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
                <FormItem className="flex flex-col"> {/* <-- flex-col agar label di atas */}
                    <FormLabel className="flex items-center gap-2">
                       <Palette className="h-4 w-4" /> Ikon
                    </FormLabel>
                    <FormControl>
                        {/* Panggil IconPicker */}
                        <IconPicker
                            value={field.value}
                            onChange={field.onChange} // React Hook Form handle state update
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        {/* --- AKHIR Icon Field --- */}


        {/* Action Buttons (Tetap Sama) */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Simpan Kategori" : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </Form>
  );
}