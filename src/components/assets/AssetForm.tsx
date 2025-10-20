import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon, Briefcase, Landmark, TrendingUp, Tag, FileText } from "lucide-react"; // <-- Import ikon relevan
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useMemo } from "react";

import { useAssets, Asset } from "@/hooks/useAssets";
import { parseFormattedNumber, formatNumberInput } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TablesInsert } from "@/integrations/supabase/types";

const ASSET_TYPES = ["Properti", "Kendaraan", "Investasi", "Elektronik", "Lainnya"] as const;

// Schema Validasi (Tetap Sama)
const assetFormSchema = z.object({
  asset_name: z.string().min(2, { message: "Nama aset minimal 2 karakter." })
    .max(100, { message: "Nama aset maksimal 100 karakter." }),
  asset_type: z.enum(ASSET_TYPES, { required_error: "Tipe aset wajib dipilih." }),
  purchase_value: z.string().min(1, { message: "Nilai pembelian tidak boleh kosong." })
    .refine(val => parseFormattedNumber(val) > 0, { message: "Nilai pembelian harus lebih dari nol." }),
  current_value: z.string().min(1, { message: "Nilai saat ini tidak boleh kosong." })
    .refine(val => parseFormattedNumber(val) >= 0, { message: "Nilai saat ini harus angka positif (atau nol)." }),
  purchase_date: z.date({ required_error: "Tanggal pembelian harus diisi." })
    .max(new Date(), "Tanggal pembelian tidak boleh di masa depan."),
  description: z.string().max(255, "Deskripsi maksimal 255 karakter.").optional().nullable(),
});


type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  defaultValues?: Asset | null;
  onClose: () => void;
}

export function AssetForm({ defaultValues, onClose }: AssetFormProps) {
  const isEditing = !!defaultValues;
  const initialDate = useMemo(() => defaultValues?.purchase_date ? new Date(defaultValues.purchase_date + 'T00:00:00') : new Date(), [defaultValues]);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_name: defaultValues?.asset_name || "",
      asset_type: defaultValues?.asset_type as (typeof ASSET_TYPES[number]) || undefined, // <-- Default ke undefined agar placeholder muncul
      purchase_value: defaultValues?.purchase_value ? formatNumberInput(String(defaultValues.purchase_value)) : "",
      current_value: defaultValues?.current_value ? formatNumberInput(String(defaultValues.current_value)) : "",
      purchase_date: initialDate,
      description: defaultValues?.description || "",
    },
     mode: "onChange",
  });

  const { addAsset, updateAsset } = useAssets();
  const { isSubmitting, errors } = form.formState; // <-- Ambil errors
  const purchaseValueWatch = form.watch("purchase_value");
  const currentValueWatch = form.watch("current_value");

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Pick<AssetFormValues, 'purchase_value' | 'current_value'>) => {
    const formattedValue = formatNumberInput(e.target.value);
    form.setValue(fieldName, formattedValue, { shouldValidate: true });
  };


  const onSubmit = async (values: AssetFormValues) => {
    const parsedPurchaseValue = parseFormattedNumber(values.purchase_value);
    const parsedCurrentValue = parseFormattedNumber(values.current_value);
    try {
      const payload: Omit<TablesInsert<"assets">, 'user_id'> = { // <-- Omit user_id
        asset_name: values.asset_name,
        asset_type: values.asset_type,
        purchase_value: parsedPurchaseValue,
        current_value: parsedCurrentValue,
        purchase_date: format(values.purchase_date, "yyyy-MM-dd"),
        description: values.description || null, // Pastikan null jika kosong
      };

      if (isEditing) {
        await updateAsset({ id: defaultValues!.id, ...payload });
      } else {
        await addAsset(payload);
      }
      onClose();
    } catch (error: any) { /* Error ditangani hook */ }
  };

  return (
    <Form {...form}>
      {/* Ganti space-y-4 menjadi space-y-6 */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Asset Name Field */}
        <FormField
          control={form.control}
          name="asset_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4"/> Nama Aset</FormLabel> {/* <-- Ikon */}
              <FormControl>
                <Input
                    placeholder="Contoh: Rumah Jakarta, Saham BBCA"
                    {...field}
                    className={cn(errors.asset_name && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Asset Type Dropdown */}
        <FormField
          control={form.control}
          name="asset_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4"/> Tipe Aset</FormLabel> {/* <-- Ikon */}
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(errors.asset_type && "border-destructive focus:ring-destructive")}> {/* <-- Highlight error */}
                    <SelectValue placeholder="Pilih Tipe Aset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                          {/* Opsional: Tambahkan ikon di sini jika perlu */}
                          {type}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Purchase Value Field */}
        <FormField
          control={form.control}
          name="purchase_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4"/> Nilai Pembelian (Rp)</FormLabel> {/* <-- Ikon */}
              <FormControl>
                <Input
                    placeholder="0"
                    {...field}
                    value={purchaseValueWatch}
                    onChange={(e) => handleValueChange(e, "purchase_value")}
                     className={cn(errors.purchase_value && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Value Field */}
        <FormField
          control={form.control}
          name="current_value"
          render={({ field }) => (
            <FormItem>
               <FormLabel className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Nilai Saat Ini (Rp)</FormLabel> {/* <-- Ikon */}
              <FormControl>
                <Input
                    placeholder="0"
                    {...field}
                    value={currentValueWatch}
                    onChange={(e) => handleValueChange(e, "current_value")}
                     className={cn(errors.current_value && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Purchase Date Picker Field */}
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Pembelian</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                         errors.purchase_date && "border-destructive focus-visible:ring-destructive" // <-- Highlight error
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear() - 50} // <-- Range tahun lebih luas
                    toYear={new Date().getFullYear()}
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4"/> Deskripsi (Opsional)</FormLabel> {/* <-- Ikon */}
              <FormControl>
                <Textarea
                    placeholder="Catatan detail tentang aset ini."
                    {...field}
                    value={field.value || ""}
                    className={cn("min-h-[60px]", errors.description && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Simpan Aset" : "Tambah Aset"} {/* <-- Teks disesuaikan */}
          </Button>
        </div>
      </form>
    </Form>
  );
}