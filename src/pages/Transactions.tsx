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
     // Reset ke halaman pertama saat filter berubah
  };

   // Handler untuk tombol ekspor di header (opsional, bisa dipindah ke TransactionList)
   const handleExportPDF = () => {
    // TODO: Implement PDF export logic using data based on current filters
    console.log("Export PDF clicked with filters:", filters);
    // Panggil fungsi exportToPDF dari exportUtils jika diperlukan di sini
    // Mungkin perlu mengambil data transactions lagi dengan filter saat ini
   };

   const handleExportCSV = () => {
       // TODO: Implement CSV export logic using data based on current filters
       console.log("Export CSV clicked with filters:", filters);
       // Panggil fungsi exportToCSV dari exportUtils jika diperlukan di sini
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
        </CardHeader>
        <CardContent>
          {/* Gunakan komponen filter */}
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Card Daftar Transaksi */}
      <Card>
         <CardHeader className="flex flex-row items-center justify-between">
            {/* Judul bisa disesuaikan atau dihapus jika TransactionList sudah punya header */}
            <CardTitle>Daftar Transaksi</CardTitle>
             <div className="flex space-x-2">
                {/* Tombol Ekspor bisa diletakkan di sini atau di dalam TransactionList */}
                 <Button variant="outline" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-2" /> Ekspor PDF</Button>
                 <Button variant="outline" onClick={handleExportCSV}><FileText className="h-4 w-4 mr-2" /> Ekspor CSV</Button>
            </div>
         </CardHeader>
         <CardContent>
            {/* Gunakan komponen list transaksi */}
            <TransactionList filters={filters} />
         </CardContent>
      </Card>

    </div>
  );
}