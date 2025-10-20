import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate, Enums, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Definisikan tipe untuk kategori dan tipe transaksi
export type Category = Tables<"categories">;
export type TransactionType = Enums<"transaction_type">;

/**
 * Hook untuk mengambil, menambah, mengubah, dan menghapus data kategori.
 * Menggunakan react-query untuk state management data.
 */
export function useCategories(type: TransactionType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Key unik untuk kategori berdasarkan tipenya
  const queryKey = ["categories", type];

  /**
   * FUNGSI FETCH: Mengambil semua kategori berdasarkan tipe (income/expense)
   */
  const { data: categories, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Category[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("type", type)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return data as Category[];
    },
    enabled: !!userId, // Hanya jalankan query jika user sudah login
  });

  /**
   * MUTATION: Menambah kategori baru
   */
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: TablesInsert<"categories">) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...newCategory, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate cache untuk merefresh list kategori
      queryClient.invalidateQueries({ queryKey });
      toast.success("Kategori berhasil ditambahkan! 🎉");
    },
    onError: (error) => {
      toast.error(`Gagal menambah kategori: ${error.message}`);
    },
  });

  /**
   * MUTATION: Mengubah kategori yang sudah ada
   */
  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: TablesUpdate<"categories"> & { id: string }) => {
      const { id, ...updateData } = updatedCategory;

      const { data, error } = await supabase
        .from("categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Kategori berhasil diperbarui! ✅");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui kategori: ${error.message}`);
    },
  });

  /**
   * MUTATION: Menghapus kategori
   */
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Kategori berhasil dihapus! 🗑️");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus kategori: ${error.message}`);
    },
  });

  return {
    categories: categories || [],
    isLoading,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isAdding: addCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}
