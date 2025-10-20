import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryList } from "@/components/categories/CategoryList";
import { TransactionType } from "@/hooks/useCategories"; // Import tipe dari hook yang sudah dibuat

export default function Categories() {
  const [activeType, setActiveType] = useState<TransactionType>("income");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Categories</h1>
      
      <Tabs 
        defaultValue={activeType} 
        onValueChange={(value) => setActiveType(value as TransactionType)}
      >
        <TabsList className="grid w-full grid-cols-2 md:w-fit">
          <TabsTrigger value="income">Kategori Pemasukan</TabsTrigger>
          <TabsTrigger value="expense">Kategori Pengeluaran</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="mt-4">
          <CategoryList type="income" />
        </TabsContent>
        
        <TabsContent value="expense" className="mt-4">
          <CategoryList type="expense" />
        </TabsContent>
      </Tabs>
    </div>
  );
}