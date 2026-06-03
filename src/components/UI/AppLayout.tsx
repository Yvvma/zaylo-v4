import React, { useState } from "react";
import ShopPage from "../Shop/ShopPage";
import { CartProvider } from "../Shop/CartContext";

type WrapperProps = {
  initialMainFilter?: "All" | "Decks" | "Apparel";
  hideFilters?: boolean;
};

export default function DecksShopWrapper({
  initialMainFilter = "All",
  hideFilters = false,
}: WrapperProps) {
  return (
    <CartProvider>
      <ShopPage
        initialMainFilter={initialMainFilter}
        hideFilters={hideFilters}
      />
    </CartProvider>
  );
}
