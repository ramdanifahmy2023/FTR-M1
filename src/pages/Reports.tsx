// src/pages/Reports.tsx

import { useState } from "react";
import { ReportFilters, ReportFilterValues } from "@/components/reports/ReportFilters.tsx";
import { ReportTable } from "@/components/reports/ReportTable.tsx";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const defaultFilters: ReportFilterValues = {
  dateRange: {
    from: undefined, // undefined: filter tidak aktif
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
  
  const displayDateRange = filters.dateRange?.from 
    ? `${format(filters.dateRange.from, 'dd MMM yyyy')} - ${format(filters.dateRange.to || new Date(), 'dd MMM yyyy')}` 
    : "Semua Tanggal";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
      
      {/* Filter Section */}
      <Card>
        <CardHeader>
             <CardTitle className="text-lg">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters onApplyFilters={handleApplyFilters} />
        </CardContent>
      </Card>

      {/* Report Table Section */}
      <ReportTable filters={filters} />
    </div>
  );
}