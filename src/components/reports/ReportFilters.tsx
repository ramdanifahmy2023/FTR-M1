import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Filter, Search, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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

// Schema (Tetap Sama)
const reportFilterSchema = z.object({ /* ... schema ... */ });
export type ReportFilterValues = z.infer<typeof reportFilterSchema>;

interface ReportFiltersProps {
  onApplyFilters: (filters: ReportFilterValues) => void;
}

export function ReportFilters({ onApplyFilters }: ReportFiltersProps) {
  const { categories: incomeCategories } = useCategories("income");
  const { categories: expenseCategories } = useCategories("expense");
  const { accounts: bankAccounts } = useBankAccounts();

  const form = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      dateRange: { from: undefined, to: new Date() },
      type: "all", categoryId: "all", bankAccountId: "all", searchQuery: "",
    },
  });

  const selectedType = form.watch("type");
  const availableCategories: Category[] = [
    ...(selectedType === "income" || selectedType === "all" ? incomeCategories : []),
    ...(selectedType === "expense" || selectedType === "all" ? expenseCategories : []),
  ];

  const handleReset = () => { /* ... (fungsi reset tetap sama) ... */ };

  return (
    <Form {...form}>
      {/* Ganti space-y-4 menjadi space-y-6 */}
      <form onSubmit={form.handleSubmit(onApplyFilters)} className="space-y-6">
        {/* --- Layout Grid Responsif --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* <-- Ubah kolom grid */}

          {/* Date Range (Tetap, biasanya full width atau span 2 col) */}
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              // Ambil lebar penuh di mobile, 2 kolom di layar lebih besar
              <FormItem className="col-span-1 sm:col-span-2 lg:col-span-2">
                <FormLabel>Rentang Tanggal</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button id="date" variant={"outline"} className={/* ... */}>
                        {/* ... Isi Button ... */}
                         <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "PP", { locale: id })} -{" "} {/* Format lebih singkat */}
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
                  {/* Popover Content (Tetap Sama) */}
                   <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={field.value} onSelect={field.onChange} numberOfMonths={2} locale={id} />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          {/* Type Filter */}
          <FormField control={form.control} name="type" render={({ field }) => ( <FormItem> ... </FormItem> )} /> {/* <-- Kode Field disingkat */}

          {/* Category Filter */}
          <FormField control={form.control} name="categoryId" render={({ field }) => ( <FormItem> ... </FormItem> )} /> {/* <-- Kode Field disingkat */}

          {/* Bank Account Filter */}
          <FormField control={form.control} name="bankAccountId" render={({ field }) => ( <FormItem> ... </FormItem> )} /> {/* <-- Kode Field disingkat */}

          {/* Search Query */}
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              // Ambil lebar penuh di mobile & sm, 1 kolom di lg+
               <FormItem className="col-span-1 sm:col-span-2 lg:col-span-1">
                <FormLabel>Cari Deskripsi</FormLabel>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="Cari kata kunci..." {...field} value={field.value || ""} className="pl-9" /> {/* <-- Sesuaikan padding kiri */}
                    </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>
        {/* --- Akhir Layout Grid --- */}

        {/* Action Buttons (Susun vertikal di mobile) */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t pt-4"> {/* <-- Ubah flex & gap */}
          <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto"> {/* <-- Lebar penuh di mobile */}
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filter
          </Button>
          <Button type="submit" className="gradient-primary w-full sm:w-auto"> {/* <-- Lebar penuh di mobile */}
            <Filter className="mr-2 h-4 w-4" /> Terapkan Filter
          </Button>
        </div>
      </form>
    </Form>
  );
}