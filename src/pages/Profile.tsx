import { useState } from "react";
import { Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";


export default function Profile() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profil Pengguna</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form Profil */}
        <div className="md:col-span-1 lg:col-span-2">
            <ProfileForm />
        </div>

        {/* Kolom Kanan: Pengaturan Keamanan */}
        <Card className="shadow-medium h-fit">
            <CardHeader>
                <CardTitle className="text-lg">Keamanan Akun</CardTitle>
                <CardDescription>Ubah kata sandi Anda untuk menjaga keamanan akun.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsPasswordModalOpen(true)}
                >
                    <Key className="h-4 w-4 mr-2" /> Ubah Kata Sandi
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Modal Ubah Password */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
      />
    </div>
  );
}