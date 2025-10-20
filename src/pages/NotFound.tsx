// src/pages/NotFound.tsx

// import { useLocation } from "react-router-dom"; // <-- Tidak perlu lagi
// import { useEffect } from "react"; // <-- Tidak perlu lagi

const NotFound = () => {
  // const location = useLocation(); // <-- Tidak perlu lagi

  // Hapus useEffect yang mencatat error
  // useEffect(() => {
  //   console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  // }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"> {/* Tambah dark mode background */}
      <div className="text-center p-6"> {/* Tambah padding */}
        <h1 className="mb-4 text-6xl font-bold text-primary animate-bounce">404</h1> {/* Perbesar teks & animasi */}
        <p className="mb-6 text-xl text-muted-foreground">Oops! Halaman Tidak Ditemukan</p> {/* Ganti bahasa & style */}
        <a href="/" className="inline-block rounded-md bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          Kembali ke Beranda {/* Ganti style link ke button */}
        </a>
      </div>
    </div>
  );
};

export default NotFound;