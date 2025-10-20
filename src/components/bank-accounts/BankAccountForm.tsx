import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

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

// 1. Definisikan Schema Validasi
const bankAccountFormSchema = z.object({
  bank_name: z.string().min(2, {
    message: "Nama bank minimal 2 karakter.",
  }).max(50, {
    message: "Nama bank maksimal 50 karakter.",
  }),
  account_name: z.string().min(2, {
    message: "Nama rekening minimal 2 karakter.",
  }).max(50, {
    message: "Nama rekening maksimal 50 karakter.",
  }),
  account_number: z.string().max(30, {
    message: "Nomor rekening maksimal 30 karakter.",
  }).optional(),
  balance: z.string().min(1, {
    message: "Saldo awal tidak boleh kosong.",
  }).refine(val => parseFormattedNumber(val) >= 0, {
    message: "Saldo harus angka positif (atau nol)."
  }),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

interface BankAccountFormProps {
  defaultValues?: BankAccount | null;
  onClose: () => void;
}

export function BankAccountForm({ defaultValues, onClose }: BankAccountFormProps) {
  const isEditing = !!defaultValues;

  // 2. Inisialisasi Form
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bank_name: defaultValues?.bank_name || "",
      account_name: defaultValues?.account_name || "",
      account_number: defaultValues?.account_number || "",
      // Format saldo dari number ke string dengan separator
      balance: defaultValues?.balance ? formatNumberInput(String(defaultValues.balance)) : "0",
    },
  });

  const { addAccount, updateAccount } = useBankAccounts();
  const { isSubmitting } = form.formState;

  // Watch field balance untuk re-render dan handle formatting
  const balanceWatch = form.watch("balance");

  // Custom Handler untuk auto-formatting angka
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberInput(rawValue);
    form.setValue("balance", formattedValue, { shouldValidate: true });
  };

  // 3. Handle Submit
  const onSubmit = async (values: BankAccountFormValues) => {
    // Parse kembali ke format angka sebelum dikirim ke Supabase
    const parsedBalance = parseFormattedNumber(values.balance);

    try {
      const payload = {
        bank_name: values.bank_name,
        account_name: values.account_name,
        account_number: values.account_number || null,
        balance: parsedBalance,
      };

      if (isEditing) {
        // Logika Update
        await updateAccount({
          id: defaultValues!.id,
          ...payload,
        });
      } else {
        // Logika Add
        await addAccount(payload);
      }
      onClose();
    } catch (error: any) {
      // Error sudah ditangani di useBankAccounts
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Bank Name Field */}
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Bank</FormLabel>
              <FormControl>
                <Input 
                    placeholder="BCA, Mandiri, Jago, dll." 
                    {...field} 
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
              <FormLabel>Nama Rekening</FormLabel>
              <FormControl>
                <Input 
                    placeholder="Rekening Pribadi / Bisnis" 
                    {...field} 
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
              <FormLabel>Nomor Rekening (Opsional)</FormLabel>
              <FormControl>
                {/* Gunakan type="text" agar format number yang panjang tidak salah di mobile */}
                <Input 
                    placeholder="1234567890" 
                    {...field} 
                    type="text" 
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
            {isEditing ? "Simpan Perubahan" : "Tambah Rekening"}
          </Button>
        </div>
      </form>
    </Form>
  );
}