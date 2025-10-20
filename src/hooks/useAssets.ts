// src/hooks/useAssets.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, TablesUpdate, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Asset = Tables<"assets">;

/**
 * Hook untuk mengelola data aset (Assets).
 */
export function useAssets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const queryKey = ["assets"];

  /**
   * FUNGSI FETCH: Mengambil semua aset
   */
  const { data: assets, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Asset[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      
      // Konversi nilai numeric dari string ke number
      return data.map(asset => ({
        ...asset,
        purchase_value: Number(asset.purchase_value),
        current_value: Number(asset.current_value),
      })) as Asset[];
    },
    enabled: !!userId,
  });

  // Hitung total nilai aset saat ini
  const totalAssetValue = assets?.reduce((sum, asset) => sum + asset.current_value, 0) || 0;

  // Fungsi untuk invalidasi query terkait
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
  };


  /**
   * MUTATION: Menambah aset baru
   */
  const addAssetMutation = useMutation({
    mutationFn: async (newAsset: TablesInsert<"assets">) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const { data, error } = await supabase
        .from("assets")
        .insert({ ...newAsset, user_id: userId })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Aset berhasil ditambahkan! 🏡");
    },
    onError: (error) => {
      toast.error(`Gagal menambah aset: ${error.message}`);
    },
  });

  /**
   * MUTATION: Mengubah aset yang sudah ada
   */
  const updateAssetMutation = useMutation({
    mutationFn: async (updatedAsset: TablesUpdate<"assets"> & { id: string }) => {
      const { id, ...updateData } = updatedAsset;

      const { data, error } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Aset berhasil diperbarui! 📝");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui aset: ${error.message}`);
    },
  });

  /**
   * MUTATION: Menghapus aset
   */
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Aset berhasil dihapus! 🗑️");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus aset: ${error.message}`);
    },
  });

  return {
    assets: assets || [],
    totalAssetValue,
    isLoading,
    addAsset: addAssetMutation.mutateAsync,
    updateAsset: updateAssetMutation.mutateAsync,
    deleteAsset: deleteAssetMutation.mutateAsync,
    isAdding: addAssetMutation.isPending,
    isUpdating: updateAssetMutation.isPending,
    isDeleting: deleteAssetMutation.isPending,
  };
}