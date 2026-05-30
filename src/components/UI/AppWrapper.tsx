import HeaderComponent from "../UI/Header";
import { CartProvider } from "../Shop/CartContext";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <HeaderComponent />
      <main>{children}</main>
    </CartProvider>
  );
}
