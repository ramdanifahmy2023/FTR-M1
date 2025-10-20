// src/pages/Transactions.tsx

import { useState } from "react";
import { Plus, FileText } from "lucide-react"; // Import ikon yang dibutuhkan
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet

// Ganti nama ReportFilters ke TransactionFilters jika Anda membuat file terpisah
// Jika menggunakan file yang sama, biarkan ReportFilters
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters";
import { TransactionList } from "@/components/transactions/TransactionList"; // <-- IMPORT BARU
import { TransactionForm } from "@/components/transactions/TransactionForm"; // Import form

// Filter default awal
const defaultFilters: ReportFilterValues = {
  dateRange: {
    from: undefined,
    to: new Date(),
  },
  type: "all",
  categoryId: "all",
  bankAccountId: "all",
  searchQuery: "",
};


export default function Transactions() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false); // State untuk sheet tambah

  const handleApplyFilters = (newFilters: ReportFilterValues) => {
    setFilters(newFilters);
     // Reset ke halaman pertama saat filter berubah (ditangani di TransactionList)
  };

  // Handler ekspor dipindahkan ke TransactionList/ReportTable

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
                  <TransactionForm
                    onClose={() => setIsAddSheetOpen(false)}
                    // Anda bisa set defaultType jika mau, misal 'expense'
                  />
                </div>
              </SheetContent>
            </Sheet>
        </div>


      {/* Card Filter */}
      <Card>
        <CardHeader>
             <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
             {/* Optional: Tambah CardDescription jika perlu */}
             {/* <CardDescription>Gunakan filter di bawah untuk mencari transaksi spesifik.</CardDescription> */}
        </CardHeader>
        <CardContent>
          {/* Gunakan komponen filter */}
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Card Daftar Transaksi */}
      {/* Card ini membungkus TransactionList */}
      <Card>
         <CardHeader>
             {/* Judul bisa disederhanakan karena sudah ada H1 di atas */}
             <CardTitle>Daftar Transaksi</CardTitle>
             {/* Tombol ekspor dipindahkan ke dalam TransactionList/ReportTable */}
         </CardHeader>
         <CardContent>
            {/* Gunakan komponen list transaksi */}
            <TransactionList filters={filters} />
         </CardContent>
      </Card>

    </div>
  );
}