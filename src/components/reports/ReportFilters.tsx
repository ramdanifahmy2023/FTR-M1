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

// 1. Definisikan Schema Validasi
const reportFilterSchema = z.object({
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  type: z.enum(["all", "income", "expense"]).default("all"),
  categoryId: z.string().optional().nullable().transform(e => e === "" ? null : e),
  bankAccountId: z.string().optional().nullable().transform(e => e === "" ? null : e),
  searchQuery: z.string().optional().nullable(),
});

export type ReportFilterValues = z.infer<typeof reportFilterSchema>;

interface ReportFiltersProps {
  onApplyFilters: (filters: ReportFilterValues) => void;
}

export function ReportFilters({ onApplyFilters }: ReportFiltersProps) {
  // Gunakan useQuery untuk data filter dropdown
  const { categories: incomeCategories } = useCategories("income");
  const { categories: expenseCategories } = useCategories("expense");
  const { accounts: bankAccounts } = useBankAccounts();

  const form = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      dateRange: {
        from: undefined,
        to: new Date(),
      },
      type: "all",
      categoryId: "all",
      bankAccountId: "all",
      searchQuery: "",
    },
  });
  
  const selectedType = form.watch("type");

  const availableCategories: Category[] = [
    ...(selectedType === "income" || selectedType === "all" ? incomeCategories : []),
    ...(selectedType === "expense" || selectedType === "all" ? expenseCategories : []),
  ];

  const handleReset = () => {
    form.reset({
      dateRange: {
        from: undefined,
        to: new Date(),
      },
      type: "all",
      categoryId: "all",
      bankAccountId: "all",
      searchQuery: "",
    });
    // Terapkan filter default (reset)
    onApplyFilters(form.getValues());
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onApplyFilters)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
          
          {/* 1. Date Range Filter */}
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="col-span-full md:col-span-2 lg:col-span-2">
                <FormLabel>Rentang Tanggal</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    {/* Perbaikan: FormControl membungkus Button di dalam PopoverTrigger asChild */}
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
                                {format(field.value.from, "PPP", { locale: id })} -{" "}
                                {format(field.value.to, "PPP", { locale: id })}
                              </>
                            ) : (
                              format(field.value.from, "PPP", { locale: id })
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
                      selected={field.value}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          {/* 2. Type Filter */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="income" className="text-success">Pemasukan</SelectItem>
                    <SelectItem value="expense" className="text-danger">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          {/* 3. Category Filter */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "all"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                          <span 
                            className="inline-block h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: cat.color || 'gray' }}
                          />
                          {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* 4. Bank Account Filter */}
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rekening Bank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "all"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Rekening" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Rekening</SelectItem>
                    <SelectItem value="null">Tunai/Lainnya</SelectItem>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_name} ({acc.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          {/* 5. Search Query (Deskripsi) */}
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cari Deskripsi</FormLabel>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                        <Input 
                            placeholder="Cari kata kunci..." 
                            {...field} 
                            value={field.value || ""}
                            className="pl-8"
                        />
                    </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
          <Button type="submit" className="gradient-primary">
            <Filter className="mr-2 h-4 w-4" />
            Terapkan Filter
          </Button>
        </div>
      </form>
    </Form>
  );
}