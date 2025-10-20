import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm.tsx";
import { cn } from "@/lib/utils";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  // Default tab bisa diatur di sini jika perlu, tapi Tabs sudah handle defaultValue
  // const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const closeDialog = () => setIsOpen(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          // Posisi & Ukuran Dasar
          "fixed bottom-6 right-6 z-50 rounded-full",
          // Ukuran responsif
          "h-14 w-14 md:h-16 md:w-16",
          // Styling Visual
          "gradient-primary text-white shadow-lg hover:shadow-xl", // <-- Tingkatkan shadow awal & hover
          // Transisi & Animasi Halus
          "transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background", // <-- Tambah transisi scale & focus ring
        )}
        aria-label="Tambah Transaksi Baru"
        size="icon" // Pastikan size="icon" agar padding sesuai
      >
         {/* Sesuaikan ukuran ikon */}
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
      </Button>

      {/* Quick Add Modal/Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* DialogContent sudah memiliki animasi bawaan dari shadcn/ui */}
        <DialogContent className="sm:max-w-[450px]"> {/* <-- Sedikit lebih lebar jika perlu */}
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Cepat</DialogTitle> {/* <-- Judul disesuaikan */}
            <DialogDescription>
                Pilih tipe dan masukkan detail transaksi Anda.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="expense" // <-- Atur default tab di sini
            // onValueChange={(value) => setActiveTab(value as "expense" | "income")} // Tidak perlu state terpisah
            className="w-full pt-2" // <-- Tambah padding atas
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="text-danger data-[state=active]:bg-danger/10 data-[state=active]:text-danger">
                <Minus className="h-4 w-4 mr-1" /> Pengeluaran
              </TabsTrigger>
              <TabsTrigger value="income" className="text-success data-[state=active]:bg-success/10 data-[state=active]:text-success">
                <Plus className="h-4 w-4 mr-1" /> Pemasukan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="pt-4">
              <TransactionForm
                defaultType="expense"
                onClose={closeDialog}
              />
            </TabsContent>

            <TabsContent value="income" className="pt-4">
              <TransactionForm
                defaultType="income"
                onClose={closeDialog}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}