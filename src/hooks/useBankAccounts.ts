import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type BankAccount = Tables<"bank_accounts">;

/**
 * Hook untuk mengelola data rekening bank (Bank Accounts).
 * Menyediakan fungsi untuk fetch, add, update, dan delete.
 */
export function useBankAccounts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = ["bank_accounts"];

  /**
   * FUNGSI FETCH: Mengambil semua rekening bank
   */
  const { data: accounts, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<BankAccount[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      // Supabase mengembalikan numeric sebagai string, konversi ke number
      return data.map(acc => ({
        ...acc,
        balance: Number(acc.balance)
      })) as BankAccount[];
    },
    enabled: !!userId,
  });
  
  // Hitung total saldo dari semua rekening
  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) || 0;

  /**
   * MUTATION: Menambah rekening bank baru
   */
  const addAccountMutation = useMutation({
    mutationFn: async (newAccount: TablesInsert<"bank_accounts">) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({ ...newAccount, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Rekening bank berhasil ditambahkan! 🏦");
    },
    onError: (error) => {
      toast.error(`Gagal menambah rekening: ${error.message}`);
    },
  });

  /**
   * MUTATION: Mengubah rekening bank yang sudah ada
   */
  const updateAccountMutation = useMutation({
    mutationFn: async (updatedAccount: TablesUpdate<"bank_accounts"> & { id: string }) => {
      const { id, ...updateData } = updatedAccount;

      const { data, error } = await supabase
        .from("bank_accounts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Rekening bank berhasil diperbarui! ✅");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui rekening: ${error.message}`);
    },
  });

  /**
   * MUTATION: Menghapus rekening bank
   */
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Rekening bank berhasil dihapus! 🗑️");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus rekening: ${error.message}`);
    },
  });

  return {
    accounts: accounts || [],
    totalBalance,
    isLoading,
    addAccount: addAccountMutation.mutateAsync,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isAdding: addAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
}