import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
// Import tipe untuk relasi
import { Tables as DatabaseTables } from "@/integrations/supabase/types";

// Type definitions untuk data transaksi yang sudah digabungkan (joined data)
export type Transaction = DatabaseTables<"transactions"> & {
    categories: DatabaseTables<"categories"> | null;
    bank_accounts: DatabaseTables<"bank_accounts"> | null;
};

// Interface untuk parameter filter
interface TransactionFilters {
    startDate?: string; // ISO date string (YYYY-MM-DD)
    endDate?: string; // ISO date string (YYYY-MM-DD)
    type?: 'income' | 'expense' | 'all';
    categoryId?: string;
    bankAccountId?: string;
    searchQuery?: string;
}

/**
 * Hook untuk mengelola data transaksi.
 * Menyediakan fungsi untuk fetch, add, update, dan delete, serta mendukung filtering.
 */
export function useTransactions(filters: TransactionFilters = {}) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;

    // Key query unik untuk caching dengan memperhitungkan filter
    const queryKey = ["transactions", filters];

    /**
     * FUNGSI FETCH: Mengambil transaksi dengan relasi Category dan Bank Account
     */
    const { data: transactions, isLoading } = useQuery({
        queryKey,
        queryFn: async (): Promise<Transaction[]> => {
            if (!userId) return [];
            
            let query = supabase
                .from("transactions")
                .select("*, categories(*), bank_accounts(*)") // Join tables
                .eq("user_id", userId);

            // Terapkan Filters
            if (filters.type && filters.type !== 'all') {
                query = query.eq("type", filters.type);
            }
            if (filters.categoryId) {
                query = query.eq("category_id", filters.categoryId);
            }
            if (filters.bankAccountId) {
                query = query.eq("bank_account_id", filters.bankAccountId);
            }
            if (filters.startDate) {
                query = query.gte("transaction_date", filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte("transaction_date", filters.endDate);
            }
            // Filter deskripsi (simple text search)
            if (filters.searchQuery) {
                query = query.ilike("description", `%${filters.searchQuery}%`);
            }

            const { data, error } = await query
                .order("transaction_date", { ascending: false });

            if (error) throw new Error(error.message);
            
            // Konversi nilai 'amount' dari string (PostgreSQL numeric) ke number
            return data.map(t => ({
                ...t,
                amount: Number(t.amount),
                bank_accounts: t.bank_accounts ? {
                    ...t.bank_accounts,
                    balance: Number(t.bank_accounts.balance)
                } : null,
            })) as Transaction[];
        },
        enabled: !!userId,
    });

    // Invalidation function untuk membersihkan cache yang terkait
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    };

    /**
     * MUTATION: Menambah transaksi baru
     */
    const addTransactionMutation = useMutation({
        mutationFn: async (newTransaction: TablesInsert<"transactions">) => {
            if (!userId) throw new Error("User not authenticated.");
            
            const { data, error } = await supabase
                .from("transactions")
                .insert({ ...newTransaction, user_id: userId })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            invalidateAll();
            toast.success("Transaksi berhasil ditambahkan! 🚀");
        },
        onError: (error) => {
            toast.error(`Gagal menambah transaksi: ${error.message}`);
        },
    });

    /**
     * MUTATION: Mengubah transaksi
     */
    const updateTransactionMutation = useMutation({
        mutationFn: async (updatedTransaction: TablesUpdate<"transactions"> & { id: string }) => {
            const { id, ...updateData } = updatedTransaction;

            const { data, error } = await supabase
                .from("transactions")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            invalidateAll();
            toast.success("Transaksi berhasil diperbarui! 📝");
        },
        onError: (error) => {
            toast.error(`Gagal memperbarui transaksi: ${error.message}`);
        },
    });

    /**
     * MUTATION: Menghapus transaksi
     */
    const deleteTransactionMutation = useMutation({
     mutationFn: async (id: string) => {
         const { error } = await supabase.from("transactions").delete().eq("id", id);
         if (error) throw new Error(error.message); // Error dilempar ke onError
     },
     onSuccess: () => { // Hanya jalan jika mutationFn berhasil
         invalidateAll();
         toast.success("Transaksi berhasil dihapus! 💣"); // <-- FEEDBACK SUKSES
     },
     onError: (error) => { // Jalan jika mutationFn melempar error
         toast.error(`Gagal menghapus transaksi: ${error.message}`); // <-- FEEDBACK ERROR
     },
 });

    return {
        transactions: transactions || [],
        isLoading,
        addTransaction: addTransactionMutation.mutateAsync,
        updateTransaction: updateTransactionMutation.mutateAsync,
        deleteTransaction: deleteTransactionMutation.mutateAsync,
        isMutating: addTransactionMutation.isPending || updateTransactionMutation.isPending || deleteTransactionMutation.isPending,
    };
}