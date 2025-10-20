// src/components/reports/ReportFilters.tsx

import { z } from "zod"; // Pastikan z diimpor
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Filter, Search, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCategories } from "@/hooks/useCategories";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";


// --- PASTIKAN SCHEMA INI TIDAK DIKOMENTARI dan BENAR ---
const reportFilterSchema = z.object({
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  type: z.enum(["all", "income", "expense"]),
  categoryId: z.string(), // 'all' or category ID
  bankAccountId: z.string(), // 'all', 'null', or account ID
  searchQuery: z.string().optional(),
});
// --- AKHIR SCHEMA ---

export type ReportFilterValues = z.infer<typeof reportFilterSchema>;

// --- Filter Default ---
const defaultFilters: ReportFilterValues = {
  // ... (defaultFilters tetap sama) ...
  dateRange: { from: undefined, to: new Date() },
  type: "all", categoryId: "all", bankAccountId: "all", searchQuery: "",
};


interface ReportFiltersProps {
  onApplyFilters: (filters: ReportFilterValues) => void;
}

export function ReportFilters({ onApplyFilters }: ReportFiltersProps) {
  const { categories: incomeCategories } = useCategories("income");
  const { categories: expenseCategories } = useCategories("expense");
  const { accounts: bankAccounts } = useBankAccounts();

  const form = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: defaultFilters,
     mode: "onChange",
  });

  const selectedType = form.watch("type");

  const availableCategories: Category[] = [
    ...(selectedType === "income" || selectedType === "all" ? incomeCategories : []),
    ...(selectedType === "expense" || selectedType === "all" ? expenseCategories : []),
  ];

  const handleReset = () => {
    form.reset(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  return (
    <Form {...form}>
      {/* ... (isi form JSX tetap sama seperti perbaikan sebelumnya) ... */}
       <form onSubmit={form.handleSubmit(onApplyFilters)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {/* Date Range Picker */}
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-2 lg:col-span-2 flex flex-col">
                <FormLabel>Rentang Tanggal</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "PP", { locale: id })} -{" "}
                              {format(field.value.to, "PP", { locale: id })}
                            </>
                          ) : (
                            format(field.value.from, "PP", { locale: id })
                          )
                        ) : (
                          <span>Pilih rentang tanggal</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value as DateRange | undefined}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                      locale={id}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                 <FormMessage />
              </FormItem>
            )}
          />

          {/* Type Filter */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Transaksi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
                 <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Filter */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue="all"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                         <span className="flex items-center">
                            <span className="inline-block h-2 w-2 rounded-full mr-2 border" style={{ backgroundColor: category.color || 'gray' }}></span>
                            {category.name}
                         </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormMessage />
              </FormItem>
            )}
          />

          {/* Bank Account Filter */}
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rekening Bank</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue="all"
                 >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Rekening" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Rekening</SelectItem>
                    <SelectItem value="null">Tunai / Lainnya</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormMessage />
              </FormItem>
            )}
          />

          {/* Search Query */}
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
               <FormItem className="col-span-1 sm:col-span-2 lg:col-span-1">
                <FormLabel>Cari Deskripsi</FormLabel>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="Cari kata kunci..." {...field} value={field.value || ""} className="pl-9" />
                    </FormControl>
                </div>
                 <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filter
          </Button>
          <Button type="submit" className="gradient-primary w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Terapkan Filter
          </Button>
        </div>
      </form>
    </Form>
  );
}