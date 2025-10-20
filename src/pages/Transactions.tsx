import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Komponen placeholder untuk daftar transaksi
function TransactionListTable() {
    // Menggunakan hook dengan filter default kosong
    const { transactions, isLoading } = useTransactions({});

    if (isLoading) {
        return <Skeleton className="w-full h-[500px]" />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daftar Transaksi ({transactions.length})</CardTitle>
                <div className="flex space-x-2">
                    <Button variant="outline"><FileText className="h-4 w-4 mr-2" /> Ekspor PDF</Button>
                    <Button variant="outline"><FileText className="h-4 w-4 mr-2" /> Ekspor CSV</Button>
                </div>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Belum ada transaksi yang tercatat. Gunakan tombol '+' di kanan bawah untuk menambahkan transaksi pertama Anda.
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Preview data mentah:</p>
                        <pre className="p-4 bg-muted/50 rounded-md text-xs whitespace-pre-wrap">
                            {JSON.stringify(transactions.slice(0, 5), null, 2)} {/* Hanya tampilkan 5 data teratas */}
                            {transactions.length > 5 && "\n... dan " + (transactions.length - 5) + " transaksi lainnya."}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Halaman Utama Transaksi
export default function Transactions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Data Transaksi</h1>
      
      {/* Placeholder Filter */}
      <Card>
        <CardHeader>
             <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
            <CardDescription>
                Kotak pencarian dan filter (Tanggal, Tipe, Kategori) akan diletakkan di sini.
            </CardDescription>
        </CardContent>
      </Card>
      
      <TransactionListTable />
    </div>
  );
}