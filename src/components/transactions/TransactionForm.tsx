import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CalendarIcon, CheckCircle, XCircle } from "lucide-react"; // <-- Ganti ikon radio
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useEffect, useMemo } from "react";

import { useTransactions } from "@/hooks/useTransactions.ts";
import { useCategories } from "@/hooks/useCategories.ts";
import { useBankAccounts } from "@/hooks/useBankAccounts.ts";
import { parseFormattedNumber, formatNumberInput } from "@/utils/currency.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // <-- Import Label standard
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
import { Transaction } from "@/hooks/useTransactions.ts";

type TransactionType = Enums<"transaction_type">;

// Schema Validasi (Tetap Sama)
const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  category_id: z.string()
      .min(1, { message: "Kategori wajib diisi." })
      .refine(val => val !== "select-category", { message: "Kategori wajib diisi.", path: ["category_id"] }),
  amount: z.string().min(1, { message: "Jumlah tidak boleh kosong." })
      .refine(val => parseFormattedNumber(val) > 0, { message: "Jumlah harus lebih dari nol." }),
  transaction_date: z.date().max(new Date(), "Tanggal transaksi tidak boleh di masa depan."),
  bank_account_id: z.string().optional().nullable(),
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
  const initialDate = useMemo(() => defaultValues?.transaction_date ? new Date(defaultValues.transaction_date + 'T00:00:00') : new Date(), [defaultValues]); // Pastikan parse sebagai local
  const initialCategoryId = defaultValues?.category_id || "select-category";
  const initialAccountId = defaultValues?.bank_account_id || "null-value";

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialType,
      category_id: initialCategoryId,
      amount: defaultValues?.amount ? formatNumberInput(String(defaultValues.amount)) : "",
      transaction_date: initialDate,
      bank_account_id: initialAccountId,
      description: defaultValues?.description || "",
    },
    mode: "onChange",
  });

  const { addTransaction, updateTransaction } = useTransactions({});
  const { isSubmitting } = form.formState;
  const transactionType = form.watch("type");
  const amountWatch = form.watch("amount");
  const { categories: incomeCategories } = useCategories("income");
  const { categories: expenseCategories } = useCategories("expense");
  const { accounts: bankAccounts } = useBankAccounts();
  const availableCategories = transactionType === "income" ? incomeCategories : expenseCategories;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberInput(e.target.value);
    form.setValue("amount", formattedValue, { shouldValidate: true });
  };

  useEffect(() => {
    if (!isEditing || defaultValues?.type !== transactionType) {
        form.setValue("category_id", "select-category", { shouldValidate: false }); // <-- Jangan validasi saat reset
        form.setValue("bank_account_id", "null-value", { shouldValidate: false }); // <-- Jangan validasi saat reset
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType, isEditing]); // <-- Hapus form dari dependency

  const onSubmit = async (values: TransactionFormValues) => {
    const parsedAmount = parseFormattedNumber(values.amount);
    try {
      const bankAccountId = values.bank_account_id === "null-value" ? null : values.bank_account_id;
      const payload: TablesInsert<"transactions"> = {
        type: values.type,
        category_id: values.category_id,
        amount: parsedAmount,
        transaction_date: format(values.transaction_date, "yyyy-MM-dd"),
        bank_account_id: bankAccountId,
        description: values.description,
      };

      if (isEditing) {
        await updateTransaction({ id: defaultValues!.id, ...payload });
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (error: any) { /* Error ditangani hook */ }
  };

  return (
    <Form {...form}>
      {/* Ganti space-y-4 menjadi space-y-6 untuk lebih lega */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Type Field (Radio Group) */}
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
                  className="grid grid-cols-2 gap-4" // <-- Gunakan grid
                  disabled={isEditing} // Tetap disable jika editing
                >
                   {/* Pemasukan */}
                  <Label htmlFor="type-income" className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      field.value === 'income' && "border-success ring-2 ring-success" // <-- Highlight jika terpilih
                  )}>
                    <RadioGroupItem value="income" id="type-income" className="sr-only" /> {/* <-- Sembunyikan radio asli */}
                    <CheckCircle className="mb-3 h-6 w-6 text-success" /> {/* <-- Ikon baru */}
                    Pemasukan
                  </Label>
                   {/* Pengeluaran */}
                   <Label htmlFor="type-expense" className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      field.value === 'expense' && "border-danger ring-2 ring-danger" // <-- Highlight jika terpilih
                  )}>
                    <RadioGroupItem value="expense" id="type-expense" className="sr-only" /> {/* <-- Sembunyikan radio asli */}
                    <XCircle className="mb-3 h-6 w-6 text-danger" /> {/* <-- Ikon baru */}
                    Pengeluaran
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount Field (Styling konsisten) */}
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
                    // Tambahkan border error jika ada
                     className={cn(form.formState.errors.amount && "border-destructive focus-visible:ring-destructive")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Dropdown (Styling konsisten) */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "select-category"}>
                <FormControl>
                  <SelectTrigger className={cn(form.formState.errors.category_id && "border-destructive focus:ring-destructive")}>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="select-category" disabled>
                      Pilih Kategori ({transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                  </SelectItem>
                  {availableCategories.length === 0 ? (
                    <SelectItem value="no-category" disabled>
                        Belum ada kategori {transactionType}
                    </SelectItem>
                  ) : (
                    availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                          <span
                            className="inline-block h-3 w-3 rounded-full mr-2 border" // <-- Tambah border
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

        {/* Date Picker Field (Styling konsisten) */}
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
                        !field.value && "text-muted-foreground",
                         form.formState.errors.transaction_date && "border-destructive focus-visible:ring-destructive"
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
                    captionLayout="dropdown-buttons" // <-- Ganti layout caption
                    fromYear={new Date().getFullYear() - 10} // <-- Range tahun lebih relevan
                    toYear={new Date().getFullYear()}
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()} // Hanya disable masa depan
                    initialFocus
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bank Account Dropdown (Styling konsisten) */}
        <FormField
          control={form.control}
          name="bank_account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rekening Bank (Opsional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "null-value"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Rekening Bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null-value" key="no-account">
                    Tidak ada (Tunai/Lainnya)
                  </SelectItem>
                  {bankAccounts.length === 0 ? (
                    <SelectItem value="disabled-account" disabled>
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

        {/* Description Field (Styling konsisten) */}
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
                     className="min-h-[60px]" // <-- Buat sedikit lebih pendek
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons (Styling konsisten) */}
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