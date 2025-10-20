// src/components/layout/FloatingActionButton.tsx

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger // Import DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm.tsx";
import { cn } from "@/lib/utils";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => setIsOpen(false);

  return (
    <>
      {/* Gunakan Dialog + DialogTrigger alih-alih state manual */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              // Posisi & Ukuran Dasar
              "fixed bottom-6 right-6 z-50 rounded-full",
              // Ukuran responsif
              "h-14 w-14 md:h-16 md:w-16",
              // Styling Visual
              "gradient-primary text-white shadow-lg hover:shadow-xl",
              // Transisi & Animasi Halus
              "transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
            )}
            aria-label="Tambah Transaksi Baru"
            size="icon" // Pastikan size="icon"
          >
             {/* Sesuaikan ukuran ikon */}
            <Plus className="h-6 w-6 md:h-7 md:w-7" />
          </Button>
        </DialogTrigger>

        {/* Quick Add Modal/Dialog Content */}
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Cepat</DialogTitle>
            <DialogDescription>
                Pilih tipe dan masukkan detail transaksi Anda.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="expense" className="w-full pt-2">
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
                onClose={closeDialog} // Gunakan fungsi penutup
              />
            </TabsContent>

            <TabsContent value="income" className="pt-4">
              <TransactionForm
                defaultType="income"
                onClose={closeDialog} // Gunakan fungsi penutup
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}