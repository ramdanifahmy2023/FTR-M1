// src/pages/Reports.tsx

import { useState } from "react";
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters.tsx";
import { ReportTable } from "@/components/reports/ReportTable.tsx";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"; // <-- Import CardDescription
import { Filter } from "lucide-react"; // <-- Import Filter icon

// Default Filters (Tetap Sama)
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


export default function Reports() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters);

  const handleApplyFilters = (newFilters: ReportFilterValues) => {
    setFilters(newFilters);
  };

  // Tidak perlu displayDateRange di sini lagi

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laporan Keuangan</h1>

      {/* Filter Section (Sedikit perbaikan header) */}
      <Card className="shadow-medium"> {/* <-- Tambah shadow */}
        <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
                 <Filter className="h-5 w-5 text-primary"/> {/* <-- Ikon Filter */}
                 Filter Laporan
             </CardTitle>
             <CardDescription>
                 Pilih kriteria untuk menampilkan data transaksi yang spesifik.
             </CardDescription> {/* <-- Tambah deskripsi */}
        </CardHeader>
        <CardContent>
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Report Table Section (Komponen dipanggil langsung) */}
      <ReportTable filters={filters} />
    </div>
  );
}