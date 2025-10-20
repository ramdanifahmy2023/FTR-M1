// src/pages/Reports.tsx

import { useState } from "react";
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters.tsx";
import { ReportTable } from "@/components/reports/ReportTable.tsx";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Filter as FilterIcon } from "lucide-react"; // Ganti nama Filter -> FilterIcon

// Default Filters
const defaultFilters: ReportFilterValues = {
  dateRange: { from: undefined, to: new Date() },
  type: "all", categoryId: "all", bankAccountId: "all", searchQuery: "",
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
         <CardHeader className="sm:hidden"> {/* Judul hanya perlu di desktop? */}
             <CardTitle className="text-lg flex items-center gap-2">
                 <FilterIcon className="h-5 w-5 text-primary"/>
                 Filter Laporan
             </CardTitle>
         </CardHeader>
         {/* Di mobile, Card ini hanya berisi tombol trigger Sheet dari ReportFilters */}
         {/* Di desktop, Card ini berisi form filter */}
        <CardContent className="pt-4 sm:pt-6">
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Report Table Section (sudah mobile-friendly di dalamnya) */}
      <ReportTable filters={filters} />
    </div>
  );
}