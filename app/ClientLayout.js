"use client";

import { usePathname } from "next/navigation";
import CustomHeader from "@/components/Header_new";
import CustomFooter from "@/components/Footer";
import GlobalModals from "@/components/GlobalModals";
import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { HeaderProvider } from "@/context/HeaderContext";
import { FaWhatsapp } from "react-icons/fa";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  return (
    <HeaderProvider>
      <ModalProvider>
        <WishlistProvider>
          <CartProvider>
            <AuthProvider>
              {!pathname?.startsWith("/admin") && <CustomHeader />}
              <main className="relative">{children}</main>
              {!pathname?.startsWith("/admin") && <CustomFooter />}
              <GlobalModals />
              {!pathname?.startsWith("/admin") && (
                <a
                  className="whatsapp-float"
                  href="https://wa.me/917305341777"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Sathya Mobiles on WhatsApp"
                  title="Chat with us on WhatsApp"
                >
                  <FaWhatsapp aria-hidden="true" />
                </a>
              )}
            </AuthProvider>
          </CartProvider>
        </WishlistProvider>
      </ModalProvider>
    </HeaderProvider>
  );
}
