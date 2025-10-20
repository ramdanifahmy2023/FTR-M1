// src/pages/Transactions.tsx

import { useState } from "react";
import { Plus, Filter as FilterIcon } from "lucide-react"; // Ganti nama Filter -> FilterIcon
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Gunakan nama ReportFilters karena komponennya sama
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";

// Filter default awal
const defaultFilters: ReportFilterValues = {
  dateRange: { from: undefined, to: new Date() },
  type: "all", categoryId: "all", bankAccountId: "all", searchQuery: "",
};


export default function Transactions() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const handleApplyFilters = (newFilters: ReportFilterValues) => {
    setFilters(newFilters);
    // Reset halaman di TransactionList akan menangani ini
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">Data Transaksi</h1>
            {/* Tombol Tambah Transaksi */}
            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
              <SheetTrigger asChild>
                <Button className="gradient-primary w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Transaksi
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Tambah Transaksi Baru</SheetTitle>
                  <SheetDescription>
                    Masukkan detail transaksi pemasukan atau pengeluaran Anda.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <TransactionForm onClose={() => setIsAddSheetOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
        </div>

      {/* Komponen Filter (akan menampilkan tombol di mobile) */}
      <Card className="shadow-medium">
        <CardHeader className="sm:hidden"> {/* Judul hanya perlu di desktop? Atau bisa disembunyikan total */}
            <CardTitle className="text-lg flex items-center gap-2">
                <FilterIcon className="h-5 w-5 text-primary"/>
                Filter & Pencarian
            </CardTitle>
        </CardHeader>
         {/* Di mobile, Card ini hanya berisi tombol trigger Sheet dari ReportFilters */}
         {/* Di desktop, Card ini berisi form filter */}
        <CardContent className="pt-4 sm:pt-6">
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Daftar Transaksi (sudah mobile-friendly) */}
      {/* Tidak perlu dibungkus Card lagi jika TransactionList belum di-card */}
       <TransactionList filters={filters} /> {/* Langsung render list */}

    </div>
  );
}