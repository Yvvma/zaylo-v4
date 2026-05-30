import React, { useState } from "react";
import { CartProvider } from "../Shop/CartContext";

import ShopPage from "../Shop/ShopPage";
import CartSidebar from "../Shop/CartSidebar";

export default function DecksLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      
      
      <ShopPage />
      
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      
      
    </CartProvider>
  );
}
