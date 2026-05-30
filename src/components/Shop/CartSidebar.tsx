import React from "react";
import { getCartLineKeyFromItem, useCart } from "./CartContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CartSidebar({ isOpen, onClose }: any) {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    totalPrice,
    clearCart,
  } = useCart();

  const emptySuggestions = [
  {
    title: "Ozy.Vest",
    image: "/banners/ozy-vest.jpg",
    link: "/produtos/ozy-vest",
  },
  {
    title: "Freedom Leash",
    image: "/banners/freedoom-leash.jpg",
    link: "/produtos/freedom-leash",
  },
  {
    title: "Steel Bowl",
    image: "/banners/steel-bowl.jpg",
    link: "/produtos/steel-bowl",
  },
];

  if (!isOpen) return null;

  const isEmpty = cartItems.length === 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        {/* SIDEBAR */}
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30 }}
          className="
            absolute right-0 top-0 bottom-0
            w-full md:w-[420px]
            bg-white
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-2 border-b">
            <h2 className="font-heading font-bold tracking-tight text-md">
              Carrinho
            </h2>

            <button
              onClick={onClose}
              className="text-2xl font-heading font-bold bg-[#f5f5f5] rounded-full w-8 h-8 flex justify-center items-center"
            >
              ×
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex flex-col px-6 py-6 justify-between items-start h-full">
            {isEmpty ? (
              <>

              <div className="flex-1 flex-col gap-6 justify-center items-center w-full ">
                <p className="font-body font-light  tracking-tight flex flex-col text-center ">
                  Seu carrinho está vazio. 
        
                  
                  <span className="font-heading font-bold">Explore nossos produtos:</span>
                </p>

              <div className="absolute bottom-4 left-0 w-full  p-8 grid grid-cols-1 gap-2 z-50">
         
                
               {emptySuggestions.map((item) => (
                <a
                  key={item.title}
                  href={item.link}
                  className="relative rounded-xl overflow-hidden h-48 block"
                >
                   <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/60 to-transparent z-20" />
                  <img
                    src={item.image}
                    className="absolute inset-0 w-full h-full object-cover "
                  />

                  <span className="absolute top-3 left-3 text-sm  font-heading font-bold text-white z-30">
                    {item.title}
                  </span>

                  <img
                    src="/logos/favicon-zaylo.png"
                    className="absolute bottom-3 right-3 w-5"
                  />
                </a>
               
              ))}
               </div>
               </div>
              </>
            ) : (
              <div className="space-y-6 w-full">
                {cartItems.map((item) => (
                  <div
                    key={getCartLineKeyFromItem(item)}
                    className="flex gap-4 border-b pb-4"
                  >
                    <img
                      src={item.selectedVariantImage || item.mainImg}
                      className="w-20 h-20 object-cover rounded"
                      alt={item.title}
                    />

                    <div className="flex-1">
                      <p className="font-heading font-bold tracking-tight">
                        {item.title}
                      </p>

                      {(item.selectedVariantColor || item.selectedSize) && (
                        <p className="font-body font-light text-xs text-gray-500">
                          {item.selectedVariantColor}
                          {item.selectedVariantColor && item.selectedSize && " / "}
                          {item.selectedSize}
                        </p>
                      )}

                      <p className="font-body font-light text-sm">
                        R$ {item.price.toFixed(2)}
                      </p>

                      {/* QUANTITY */}
                      <div className="flex items-center mt-2 border w-fit">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                              item.selectedVariantSku,
                              item.selectedSize
                            )
                          }
                          className="px-2 py-1 font-body font-light"
                        >
                          -
                        </button>

                        <span className="px-3 font-body font-light">
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
                          className="px-2 py-1 font-body font-light"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        removeFromCart(item.id, item.selectedVariantSku, item.selectedSize)
                      }
                      className="text-xl font-body font-light"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}
          {!isEmpty && (
            <div className="border-t px-6 py-6 space-y-3">
              <p className="font-heading font-bold">
                Total: R$ {totalPrice.toFixed(2)}
              </p>

              <button
                onClick={() => (window.location.href = "/checkout")}
                className="w-full border border-[#131819]
                font-body font-light
                py-3 uppercase"
              >
                Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full border border-[#131819]
                font-body font-light
                py-3 uppercase"
              >
                Limpar carrinho
              </button>
            </div>
          )}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}