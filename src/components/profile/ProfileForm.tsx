import { useState } from "react"; // <-- Import useState
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Mail, Upload, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Schema Validasi (Tambah validasi URL opsional)
const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Nama lengkap minimal 2 karakter." })
    .max(100, { message: "Nama lengkap maksimal 100 karakter." }),
  email: z.string().email(),
  // URL bisa string kosong saat belum ada, atau URL valid
  avatar_url: z.string().url("URL Avatar tidak valid.").nullable().optional().or(z.literal("")),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false); // <-- State untuk loading upload

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      avatar_url: user?.user_metadata?.avatar_url || "", // <-- Default ke string kosong
    },
    mode: "onChange",
  });

  const { isSubmitting, errors } = form.formState;

  // --- Fungsi Upload Avatar ke Supabase Storage ---
  const uploadAvatar = async (file: File): Promise<string> => {
      if (!user) throw new Error("User tidak terautentikasi.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Nama file unik: userId/timestamp.ext
      const filePath = fileName;

      // Unggah file ke bucket 'avatars'
      const { error: uploadError } = await supabase.storage
          .from('avatars') // Pastikan nama bucket 'avatars' sudah dibuat
          .upload(filePath, file, { upsert: true }); // upsert: true akan menimpa file lama jika path sama (opsional)

      if (uploadError) {
          console.error("Supabase Storage upload error:", uploadError);
          throw new Error(`Gagal mengunggah avatar: ${uploadError.message}`);
      }

      // Dapatkan URL publik dari file yang baru diunggah
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (!data?.publicUrl) {
          throw new Error("Gagal mendapatkan URL publik avatar.");
      }

      return data.publicUrl;
  };
  // --- Akhir Fungsi Upload Avatar ---


  // --- Handle Perubahan Avatar ---
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi (Tetap Sama)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file avatar maksimal 2MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Format file avatar tidak didukung (hanya JPG, PNG, WebP).");
        return;
      }

      setIsUploading(true); // Mulai loading
      try {
        const publicUrl = await uploadAvatar(file);

        // Update form state dengan URL dari Supabase Storage
        form.setValue("avatar_url", publicUrl, {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast.success("Avatar berhasil diunggah!");

      } catch (error: any) {
        toast.error(error.message || "Gagal mengunggah avatar.");
        // Reset input file jika gagal? (Opsional)
        e.target.value = '';
      } finally {
        setIsUploading(false); // Selesai loading
      }
    }
  };
  // --- Akhir Handle Perubahan Avatar ---


  const onSubmit = async (values: ProfileFormValues) => {
    try {
      if (!user) throw new Error("User not authenticated.");

      const updateData: { full_name?: string; avatar_url?: string | null } = {};
      let hasChanges = false;

      // Cek perubahan nama
      if (values.full_name !== (user.user_metadata?.full_name || "")) {
        updateData.full_name = values.full_name;
        hasChanges = true;
      }

      // Cek perubahan avatar URL (termasuk dari string kosong ke null atau sebaliknya)
      const currentAvatar = user.user_metadata?.avatar_url || ""; // Anggap string kosong jika null/undefined
      const newAvatar = values.avatar_url || ""; // Anggap string kosong jika null/undefined
      if (newAvatar !== currentAvatar) {
         updateData.avatar_url = values.avatar_url || null; // Simpan null jika string kosong
         hasChanges = true;
      }

      if (hasChanges) {
          const { error } = await supabase.auth.updateUser({ data: updateData });
          if (error) throw error;
          toast.success("Profil berhasil diperbarui! ✅");
          form.reset({}, { keepValues: true }); // Reset dirty state tapi pertahankan nilai
      } else {
          toast.info("Tidak ada perubahan untuk disimpan.");
      }

    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Gagal memperbarui profil.");
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Informasi Dasar
        </CardTitle>
        <CardDescription>
          Perbarui nama lengkap dan avatar Anda. Email tidak dapat diubah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
                 <div className="relative"> {/* <-- Wrapper relatif untuk loading */}
                    <Avatar className="h-24 w-24 border-2 border-primary/50">
                        <AvatarImage src={form.watch("avatar_url") || undefined} alt={form.watch("full_name")} />
                        <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                            {form.watch("full_name") ? form.watch("full_name").charAt(0).toUpperCase() : <Camera className="h-8 w-8" />}
                        </AvatarFallback>
                    </Avatar>
                     {/* Indikator Loading Upload */}
                     {isUploading && (
                         <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-full">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                     )}
                 </div>
                <input type="file" id="avatar-upload" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarChange} disabled={isUploading}/>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? "Mengunggah..." : "Ganti Foto"}
                </Button>
                {/* Field tersembunyi tidak perlu karena form.setValue sudah mengatur state */}
                <FormMessage className="-mt-2 text-center" />
            </div>

            {/* Email Field (Disabled - Tetap Sama) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4"/> Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled className="bg-muted/50 cursor-not-allowed" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name Field (Tetap Sama) */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="h-4 w-4"/> Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className={cn(errors.full_name && "border-destructive focus-visible:ring-destructive")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || isUploading || !form.formState.isDirty} className="gradient-primary">
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Profil
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}