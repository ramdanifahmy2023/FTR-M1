import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Banknote, UserSquare, Hash } from "lucide-react"; // <-- Import ikon relevan

import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { parseFormattedNumber, formatNumberInput } from "@/utils/currency";
import { cn } from "@/lib/utils"; // <-- Import cn

// Schema Validasi (Tetap Sama)
const bankAccountFormSchema = z.object({
  bank_name: z.string().min(2, { message: "Nama bank minimal 2 karakter." })
    .max(50, { message: "Nama bank maksimal 50 karakter." }),
  account_name: z.string().min(2, { message: "Nama rekening minimal 2 karakter." })
    .max(50, { message: "Nama rekening maksimal 50 karakter." }),
  account_number: z.string().max(30, { message: "Nomor rekening maksimal 30 karakter." }).optional().nullable(), // <-- Tambah nullable
  balance: z.string().min(1, { message: "Saldo awal tidak boleh kosong." })
    .refine(val => parseFormattedNumber(val) >= 0, { message: "Saldo harus angka positif (atau nol)." }),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

interface BankAccountFormProps {
  defaultValues?: BankAccount | null;
  onClose: () => void;
}

export function BankAccountForm({ defaultValues, onClose }: BankAccountFormProps) {
  const isEditing = !!defaultValues;

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bank_name: defaultValues?.bank_name || "",
      account_name: defaultValues?.account_name || "",
      account_number: defaultValues?.account_number || "",
      balance: defaultValues?.balance != null ? formatNumberInput(String(defaultValues.balance)) : "0", // <-- Cek null/undefined
    },
    mode: "onChange", // <-- Validasi saat ketik
  });

  const { addAccount, updateAccount } = useBankAccounts();
  const { isSubmitting, errors } = form.formState; // <-- Ambil errors
  const balanceWatch = form.watch("balance");

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberInput(e.target.value);
    form.setValue("balance", formattedValue, { shouldValidate: true });
  };

  const onSubmit = async (values: BankAccountFormValues) => {
    const parsedBalance = parseFormattedNumber(values.balance);
    try {
      const payload = {
        bank_name: values.bank_name,
        account_name: values.account_name,
        account_number: values.account_number || null, // Pastikan null jika kosong
        balance: parsedBalance,
      };

      if (isEditing) {
        await updateAccount({ id: defaultValues!.id, ...payload });
      } else {
        await addAccount(payload);
      }
      onClose();
    } catch (error: any) { /* Error ditangani hook */ }
  };

  return (
    <Form {...form}>
       {/* Ganti space-y-4 menjadi space-y-6 */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Bank Name Field */}
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Banknote className="h-4 w-4"/> Nama Bank</FormLabel> {/* <-- Tambah Ikon */}
              <FormControl>
                <Input
                    placeholder="BCA, Mandiri, Jago, dll."
                    {...field}
                    className={cn(errors.bank_name && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Name Field */}
        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
               <FormLabel className="flex items-center gap-2"><UserSquare className="h-4 w-4"/> Nama Rekening</FormLabel> {/* <-- Tambah Ikon */}
              <FormControl>
                <Input
                    placeholder="Rekening Gaji / Tabungan Utama"
                    {...field}
                    className={cn(errors.account_name && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Number Field */}
        <FormField
          control={form.control}
          name="account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4"/> Nomor Rekening (Opsional)</FormLabel> {/* <-- Tambah Ikon */}
              <FormControl>
                <Input
                    placeholder="1234567890"
                    {...field}
                    value={field.value ?? ""} // <-- Handle null/undefined
                    type="text" // Tetap text untuk nomor panjang
                    className={cn("font-mono", errors.account_number && "border-destructive focus-visible:ring-destructive")} // <-- Font mono + Highlight error
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Initial Balance Field */}
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Awal (Rp)</FormLabel>
              <FormControl>
                <Input
                    placeholder="0"
                    {...field}
                    value={balanceWatch}
                    onChange={handleBalanceChange}
                    className={cn(errors.balance && "border-destructive focus-visible:ring-destructive")} // <-- Highlight error
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
            {isEditing ? "Simpan Rekening" : "Tambah Rekening"} {/* <-- Teks disesuaikan */}
          </Button>
        </div>
      </form>
    </Form>
  );
}