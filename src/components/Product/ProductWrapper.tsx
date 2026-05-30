import React, { useState } from "react";
import { CartProvider } from "../Shop/CartContext";
import CartSidebar from "../Shop/CartSidebar";
import ProductDetail from "./ProductDetail";

interface ProductWrapperProps {
  product: any;  // ideal tipar, mas 'any' funciona pra testar
}

export default function ProductWrapper({ product }: ProductWrapperProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wrapper function that adds product and opens cart sidebar
  const handleAddToCart = () => {
    setIsCartOpen(true);
  };

  return (
    <CartProvider>
      <ProductDetail product={product} onAddToCart={handleAddToCart} />
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </CartProvider>
  );
}
