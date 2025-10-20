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

// 1. Definisikan Schema Validasi
const profileSchema = z.object({
  full_name: z.string().min(2, {
    message: "Nama lengkap minimal 2 karakter.",
  }).max(100, {
    message: "Nama lengkap maksimal 100 karakter.",
  }),
  email: z.string().email(),
  avatar_url: z.string().url().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  
  // 2. Inisialisasi Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      avatar_url: user?.user_metadata?.avatar_url || null,
    },
    mode: "onChange",
  });

  const { isSubmitting } = form.formState;

  // 3. Handle Submit
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
          avatar_url: values.avatar_url,
        }
      });

      if (error) throw error;

      toast.success("Profil berhasil diperbarui! ✅");

    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Gagal memperbarui profil.");
    }
  };

  // --- Placeholder Logic for Avatar Upload (simplified) ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            // Placeholder: Menggunakan URL dummy, bukan upload file sungguhan
            const dummyAvatarUrl = "https://i.pravatar.cc/150?u=" + user?.id; 
            form.setValue("avatar_url", dummyAvatarUrl, { shouldDirty: true, shouldValidate: true });
            toast.info("Avatar di-update di sisi client. Perlu implementasi Supabase Storage untuk penyimpanan permanen!");
        };
        reader.readAsDataURL(file);
    }
  };
  // ----------------------------------------------------

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Informasi Dasar
        </CardTitle>
        <CardDescription>
          Perbarui detail profil Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={form.watch("avatar_url") || undefined} alt="Avatar" />
                    <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                        {form.watch("full_name") ? form.watch("full_name").charAt(0) : <Camera className="h-8 w-8" />}
                    </AvatarFallback>
                </Avatar>
                <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                    <Upload className="h-4 w-4 mr-2" /> Unggah Avatar
                </Button>
            </div>


            {/* Email Field (Disabled) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </FormLabel>
                  <FormControl>
                    <Input 
                        type="email"
                        placeholder="email@example.com" 
                        {...field} 
                        disabled 
                        className="bg-muted/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Nama Lengkap
                  </FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="John Doe" 
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="gradient-primary">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}