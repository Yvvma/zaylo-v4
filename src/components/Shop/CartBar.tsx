import React, { useState } from "react";
import texts from "../../texts.json";
import { getCartLineKeyFromItem, useCart } from "./CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";

export default function CartBar() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mx-auto max-w-2xl w-full px-4 pb-4 pointer-events-auto"
          >
            <div className="w-full bg-white border shadow-lg overflow-hidden">
              {/* Header */}
              <motion.div
                className="flex justify-between items-center px-6 py-4 border-b border-[#333]"
              >
                <div>
                  <p className="tracking-tight text-black font-heading font-bold ">{"Carrinho"}</p>
                  <p className="text-sm font-body font-light text-black/">
                    {totalItems} {totalItems === 1 ? "item" : "items"} - R$ {totalPrice.toFixed(2)}
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className=" text-3xl font-body font-light text-black"
                  aria-label="Close cart"
                >
                 x
                </motion.button>
              </motion.div>

              {/* Content */}
              <motion.div
                className="p-6 max-h-96 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {cartItems.length === 0 ? (
                  <p className=" tracking-tight text-black font-body font-light ">{"Seu carrinho está vazio"}</p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.05 }}
                  >
                    {cartItems.map((item) => (
                      <motion.div
                        key={getCartLineKeyFromItem(item)}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex justify-between items-center mb-4 border-b border-[#333] pb-2"
                      >
                        <div className="flex items-center gap-4">
                          {/* Product Image */}
                          {item.variants && item.variants[0]?.image && (
                            <motion.img
                              src={item.variants[0].image}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded border border-[#131819]"
                              whileHover={{ scale: 1.03 }}
                            />
                          )}
                          <div>
                            {/* Product Title */}
                            <p className="text-black tracking-tight font-heading font-bold ">{item.title}</p>
                            {(item.selectedVariantColor || item.selectedSize) && (
                              <p className="text-black font-body font-light text-xs text-gray-500">
                                {item.selectedVariantColor}
                                {item.selectedVariantColor && item.selectedSize && " / "}
                                {item.selectedSize}
                              </p>
                            )}
                            <p className="text-black font-body font-light text-sm">
                              R$ {item.price.toFixed(2)} 
                            </p>
                            {/* Quantity Controls */}
                            <div className="flex items-center mt-2 border">
                              <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity - 1,
                                      item.selectedVariantSku,
                                      item.selectedSize
                                    )
                                  }
                                className="border font-body font-light text-black px-2 py-1  transition-colors duration-200"
                                aria-label={`Decrease quantity of ${item.title}`}
                              >
                                -
                              </button>
                              <span className=" font-body font-light text-black px-3 py-1 text-sm">
                                {item.quantity}
                              </span>
                              <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity + 1,
                                      item.selectedVariantSku,
                                      item.selectedSize
                                    )
                                  }
                                className=" font-body font-light border  text-black px-2 py-1  transition-colors duration-200"
                                aria-label={`Increase quantity of ${item.title}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <motion.button
                          onClick={() =>
                            removeFromCart(item.id, item.selectedVariantSku, item.selectedSize)
                          }
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-[#131819] text-2xl font-body font-light"
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          ×
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <motion.div
                  className="px-6 pb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    onClick={() => (window.location.href = '/checkout')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full border-1 border-[#131819] text-[#131819] font-body font-light py-3 rounded-xs uppercase "
                  >
                    Checkout
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="closed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 bg-[#131313] border  shadow-lg font-bold uppercase text-white
             text-xl h-14 w-20 flex items-center justify-center pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open cart"
          >
            <ShoppingCart size={24} strokeWidth={2}/> {totalItems > 0 && <span className="ml-1 text-sm">({totalItems})</span>}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
