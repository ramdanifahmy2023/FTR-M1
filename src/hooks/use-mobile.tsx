// src/hooks/use-mobile.tsx

import * as React from "react";

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Fungsi untuk cek dan set state
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Cek saat komponen mount
    checkDevice();

    // Listener untuk resize window
    window.addEventListener("resize", checkDevice);

    // Cleanup listener saat komponen unmount
    return () => window.removeEventListener("resize", checkDevice);
  }, []); // Hanya run sekali saat mount

  // Return true jika isMobile state true (setelah pengecekan awal)
  return !!isMobile;
}