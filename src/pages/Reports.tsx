// src/pages/Reports.tsx

import { useState } from "react";
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters.tsx";
import { ReportTable } from "@/components/reports/ReportTable.tsx";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Filter } from "lucide-react";

// Default Filters
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laporan Keuangan</h1>

      {/* Filter Section */}
      <Card className="shadow-medium">
        <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
                 <Filter className="h-5 w-5 text-primary"/>
                 Filter Laporan
             </CardTitle>
             <CardDescription>
                 Pilih kriteria untuk menampilkan data transaksi yang spesifik.
             </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Report Table Section */}
      {/* Tombol ekspor sudah dipindahkan ke dalam ReportTable */}
      <ReportTable filters={filters} />
    </div>
  );
}