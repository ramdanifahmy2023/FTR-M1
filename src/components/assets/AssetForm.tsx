// src/components/assets/AssetForm.tsx

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon } from "lucide-react";
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

// Asset types from the blueprint
const ASSET_TYPES = [
    "Properti",
    "Kendaraan",
    "Investasi",
    "Elektronik",
    "Lainnya",
] as const;

// 1. Definisikan Schema Validasi
const assetFormSchema = z.object({
  asset_name: z.string().min(2, {
    message: "Nama aset minimal 2 karakter.",
  }).max(100, {
    message: "Nama aset maksimal 100 karakter.",
  }),
  asset_type: z.enum(ASSET_TYPES, {
    required_error: "Tipe aset wajib dipilih.",
  }),
  purchase_value: z.string().min(1, {
    message: "Nilai pembelian tidak boleh kosong.",
  }).refine(val => parseFormattedNumber(val) > 0, {
    message: "Nilai pembelian harus lebih dari nol.",
  }),
  current_value: z.string().min(1, {
    message: "Nilai saat ini tidak boleh kosong.",
  }).refine(val => parseFormattedNumber(val) >= 0, {
    message: "Nilai saat ini harus angka positif (atau nol)."
  }),
  purchase_date: z.date({
    required_error: "Tanggal pembelian harus diisi.",
  }).max(new Date(), "Tanggal pembelian tidak boleh di masa depan."),
  description: z.string().max(255, "Deskripsi maksimal 255 karakter.").optional().nullable(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  defaultValues?: Asset | null;
  onClose: () => void;
}

export function AssetForm({ defaultValues, onClose }: AssetFormProps) {
  const isEditing = !!defaultValues;
  
  const initialDate = useMemo(() => {
    return defaultValues?.purchase_date ? new Date(defaultValues.purchase_date) : new Date();
  }, [defaultValues]);

  // 2. Inisialisasi Form
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_name: defaultValues?.asset_name || "",
      asset_type: defaultValues?.asset_type as (typeof ASSET_TYPES[number]) || "Investasi",
      purchase_value: defaultValues?.purchase_value ? formatNumberInput(String(defaultValues.purchase_value)) : "",
      current_value: defaultValues?.current_value ? formatNumberInput(String(defaultValues.current_value)) : "",
      purchase_date: initialDate,
      description: defaultValues?.description || "",
    },
  });

  const { addAsset, updateAsset } = useAssets();
  const { isSubmitting } = form.formState;

  const purchaseValueWatch = form.watch("purchase_value");
  const currentValueWatch = form.watch("current_value");

  // Custom Handler untuk auto-formatting angka
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AssetFormValues) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberInput(rawValue);
    form.setValue(fieldName, formattedValue, { shouldValidate: true });
  };

  // 3. Handle Submit
  const onSubmit = async (values: AssetFormValues) => {
    // Parse kembali ke format angka sebelum dikirim ke Supabase
    const parsedPurchaseValue = parseFormattedNumber(values.purchase_value);
    const parsedCurrentValue = parseFormattedNumber(values.current_value);

    try {
      const payload: TablesInsert<"assets"> = {
        asset_name: values.asset_name,
        asset_type: values.asset_type,
        purchase_value: parsedPurchaseValue,
        current_value: parsedCurrentValue,
        purchase_date: format(values.purchase_date, "yyyy-MM-dd"),
        description: values.description,
      };

      if (isEditing) {
        // Logika Update
        await updateAsset({
          id: defaultValues!.id,
          ...payload,
        });
      } else {
        // Logika Add
        await addAsset(payload);
      }
      onClose();
    } catch (error: any) {
      // Error sudah ditangani di useAssets
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Asset Name Field */}
        <FormField
          control={form.control}
          name="asset_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Aset</FormLabel>
              <FormControl>
                <Input 
                    placeholder="Contoh: Rumah Jakarta, Saham BBCA" 
                    {...field} 
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
              <FormLabel>Tipe Aset</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe Aset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
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
              <FormLabel>Nilai Pembelian (Rp)</FormLabel>
              <FormControl>
                <Input 
                    placeholder="0" 
                    {...field} 
                    value={purchaseValueWatch}
                    onChange={(e) => handleValueChange(e, "purchase_value")}
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
              <FormLabel>Nilai Saat Ini (Rp)</FormLabel>
              <FormControl>
                <Input 
                    placeholder="0" 
                    {...field} 
                    value={currentValueWatch}
                    onChange={(e) => handleValueChange(e, "current_value")}
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
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    fromYear={2000}
                    toYear={new Date().getFullYear()}
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
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
              <FormLabel>Deskripsi (Opsional)</FormLabel>
              <FormControl>
                <Textarea 
                    placeholder="Catatan detail tentang aset ini." 
                    {...field} 
                    value={field.value || ""}
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
            {isEditing ? "Simpan Perubahan" : "Tambah Aset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}