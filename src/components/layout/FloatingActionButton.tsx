import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { cn } from "@/lib/utils";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const closeDialog = () => setIsOpen(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          // Fixed position, z-index, shadow
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-large transition-all duration-300",
          "gradient-primary hover:shadow-xl",
          // Larger size for desktop
          "md:h-16 md:w-16 md:text-xl",
        )}
        aria-label="Tambah Transaksi Baru"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {/* Quick Add Modal/Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Transaction</DialogTitle>
          </DialogHeader>
          
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={(value) => setActiveTab(value as "expense" | "income")}
            className="w-full"
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