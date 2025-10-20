import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useEffect, useMemo } from "react";

import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories"; // Perlu hook ini
import { useBankAccounts } from "@/hooks/useBankAccounts"; // Perlu hook ini
import { parseFormattedNumber, formatNumberInput } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { Enums, TablesInsert } from "@/integrations/supabase/types";

// Definisikan tipe transaksi dari Supabase Enums
type TransactionType = Enums<"transaction_type">;

// 1. Definisikan Schema Validasi
const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Tipe transaksi harus dipilih.",
  }),
  category_id: z.string().min(1, {
    message: "Kategori wajib diisi.",
  }),
  amount: z.string().min(1, {
    message: "Jumlah tidak boleh kosong.",
  }).refine(val => parseFormattedNumber(val) > 0, {
    message: "Jumlah harus lebih dari nol.",
  }),
  transaction_date: z.date({
    required_error: "Tanggal transaksi harus diisi.",
  }).max(new Date(), "Tanggal transaksi tidak boleh di masa depan."),
  // bank_account_id bisa null jika user tidak memilihnya
  bank_account_id: z.string().optional().nullable().transform(e => e === "" ? null : e),
  description: z.string().max(255, "Deskripsi maksimal 255 karakter.").optional().nullable(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  defaultValues?: Transaction | null;
  onClose: () => void;
  defaultType?: TransactionType;
}

export function TransactionForm({ defaultValues, onClose, defaultType = "expense" }: TransactionFormProps) {
  const isEditing = !!defaultValues;
  const initialType = defaultValues?.type || defaultType;
  
  const initialDate = useMemo(() => {
    return defaultValues?.transaction_date ? new Date(defaultValues.transaction_date) : new Date();
  }, [defaultValues]);

  // 2. Inisialisasi Form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialType,
      category_id: defaultValues?.category_id || "",
      amount: defaultValues?.amount ? formatNumberInput(String(defaultValues.amount)) : "",
      transaction_date: initialDate,
      bank_account_id: defaultValues?.bank_account_id || "",
      description: defaultValues?.description || "",
    },
  });

  const { addTransaction, updateTransaction } = useTransactions({});
  const { isSubmitting } = form.formState;

  const transactionType = form.watch("type");
  const amountWatch = form.watch("amount");

  // Fetch Categories dan Bank Accounts
  const { categories: incomeCategories } = useCategories("income");
  const { categories: expenseCategories } = useCategories("expense");
  const { accounts: bankAccounts } = useBankAccounts();

  // Filter categories berdasarkan tipe transaksi yang dipilih
  const availableCategories = transactionType === "income" ? incomeCategories : expenseCategories;
  
  // Custom Handler untuk auto-formatting angka
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumberInput(rawValue);
    form.setValue("amount", formattedValue, { shouldValidate: true });
  };

  // Logic untuk mereset category_id ketika type berubah
  useEffect(() => {
    // Reset category_id ke default (kosong) ketika type berubah
    form.setValue("category_id", "", { shouldValidate: true });
    // Reset bank_account_id saat type berubah, kecuali jika sedang dalam mode edit dan id-nya ada
    if (!isEditing || defaultValues?.type !== transactionType) {
        form.setValue("bank_account_id", null, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);


  // 3. Handle Submit
  const onSubmit = async (values: TransactionFormValues) => {
    const parsedAmount = parseFormattedNumber(values.amount);

    try {
      // Pastikan bank_account_id adalah string atau null
      const bankAccountId = values.bank_account_id === "" ? null : values.bank_account_id;
      
      const payload: TablesInsert<"transactions"> = {
        type: values.type,
        category_id: values.category_id,
        amount: parsedAmount,
        transaction_date: format(values.transaction_date, "yyyy-MM-dd"),
        bank_account_id: bankAccountId, 
        description: values.description,
      };

      if (isEditing) {
        // Logika Update
        await updateTransaction({
          id: defaultValues!.id,
          ...payload,
        });
      } else {
        // Logika Add
        await addTransaction(payload);
      }
      onClose();
    } catch (error: any) {
      // Error sudah ditangani di useTransactions
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Type Field (Radio/Toggle) */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipe Transaksi</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                  disabled={isEditing}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" id="type-income" className="data-[state=checked]:border-success data-[state=checked]:text-success" />
                    </FormControl>
                    <FormLabel htmlFor="type-income" className="font-normal text-success">
                      Pemasukan
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" id="type-expense" className="data-[state=checked]:border-danger data-[state=checked]:text-danger" />
                    </FormControl>
                    <FormLabel htmlFor="type-expense" className="font-normal text-danger">
                      Pengeluaran
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Amount Field */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah (Rp)</FormLabel>
              <FormControl>
                <Input 
                    placeholder="Contoh: 1.500.000" 
                    {...field} 
                    value={amountWatch}
                    onChange={handleAmountChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Dropdown */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.length === 0 ? (
                    <SelectItem value="" disabled>
                        Belum ada kategori {transactionType}
                    </SelectItem>
                  ) : (
                    availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                          <span 
                            className="inline-block h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color || 'gray' }}
                          />
                          {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Picker Field */}
        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Transaksi</FormLabel>
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
                    fromYear={2020}
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
        
        {/* Bank Account Dropdown */}
        <FormField
          control={form.control}
          name="bank_account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rekening Bank (Opsional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Rekening Bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="" key="no-account">
                    Tidak ada (Tunai/Lainnya)
                  </SelectItem>
                  {bankAccounts.length === 0 ? (
                    <SelectItem value="disabled" disabled>
                        Belum ada rekening bank
                    </SelectItem>
                  ) : (
                    bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.bank_name})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
                    placeholder="Contoh: Belanja bulanan di supermarket X" 
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
            {isEditing ? "Simpan Perubahan" : "Tambah Transaksi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}