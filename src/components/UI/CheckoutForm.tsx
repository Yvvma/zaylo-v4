import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  items: Array<{
    product: {
      id: string;
      title: string;
      price: number;
      weight?: number;
    };
    quantity: number;
  }>;
  onSuccess: () => void;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  days: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [shippingOption, setShippingOption] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [email, setEmail] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { id: "standard", name: "Standard Shipping", price: 5.99, days: "3-5" },
    { id: "express", name: "Express Shipping", price: 12.99, days: "1-2" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple_pay">("card");
  const [canMakeApplePayPayment, setCanMakeApplePayPayment] = useState(false);

  // Check if Apple Pay is available
  useEffect(() => {
    if (stripe) {
      stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: 100, // Just for checking availability
        },
        requestPayerName: true,
        requestPayerEmail: true,
      }).canMakePayment().then((result) => {
        if (result) {
          setCanMakeApplePayPayment(true);
        }
      });
    }
  }, [stripe]);

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Calculate shipping when zip code changes
  useEffect(() => {
    if (zipCode.length >= 5) {
      const calculateShipping = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/calculate-shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zipCode,
              items: items.map(item => ({
                weight: item.product.weight || 0.5, // default weight if not provided
                quantity: item.quantity
              }))
            })
          });
          
          const data = await response.json();
          if (response.ok) {
            setShippingOptions(data.options);
            setShippingCost(data.options[0].price);
            setShippingOption(data.options[0].id);
          } else {
            throw new Error(data.error || 'Failed to calculate shipping');
          }
        } catch (error) {
          console.error('Shipping calculation error');
          // Fallback to default shipping options if API fails
          setShippingOptions([
            { id: "standard", name: "Standard Shipping", price: 5.99, days: "3-5" },
            { id: "express", name: "Express Shipping", price: 12.99, days: "1-2" },
          ]);
          setShippingCost(5.99);
          setShippingOption("standard");
        } finally {
          setLoading(false);
        }
      };
      
      calculateShipping();
    }
  }, [zipCode, items]);

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Create payment intent with shipping
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          email,
          shipping: {
            cost: shippingCost,
            option: shippingOption
          },
          payment_method_types: ['card']
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      const { clientSecret } = data;
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { email },
        },
      });

      if (error) throw error;

      onSuccess();
    } catch (err) {
      console.error("Payment error");
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe) return;

    setLoading(true);

    try {
      const total = subtotal + shippingCost;
      
      // Create payment request
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: Math.round(total * 100), // Convert to cents
        },
        displayItems: [
          {
            label: 'Subtotal',
            amount: Math.round(subtotal * 100),
          },
          {
            label: 'Shipping',
            amount: Math.round(shippingCost * 100),
          },
        ],
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Create payment intent
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          email,
          shipping: {
            cost: shippingCost,
            option: shippingOption
          },
          payment_method_types: ['card']
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      const { clientSecret } = data;
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Handle payment method event
      paymentRequest.on('paymentmethod', async (ev) => {
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          throw confirmError;
        } else {
          ev.complete('success');
          onSuccess();
        }
      });

      // Show Apple Pay
      paymentRequest.show();

    } catch (err) {
      console.error("Apple Pay error");
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = paymentMethod === "card" ? handleCardSubmit : handleApplePaySubmit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-white"
    >
       <motion.button
        onClick={() => window.location.href = "/"} // Or use your router if you have one
        className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors"
        whileHover={{ x: -2 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Home
      </motion.button>
      <h2 className="font-heading text-2xl uppercase mb-6 tracking-tight">
        Complete Your Order
      </h2>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 border-b border-white/20 pb-6"
      >
        <h3 className="font-heading uppercase text-lg mb-4 tracking-tight">
          Your Items
        </h3>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <motion.li
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="flex justify-between"
            >
              <span>
                {item.quantity}x {item.product.title}
              </span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Shipping Calculator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8 border-b border-white/20 pb-6"
      >
        <h3 className="font-heading uppercase text-lg mb-4 tracking-tight">
          Shipping
        </h3>

        <div className="space-y-4">
          {/* Email field only shown for card payments */}
          {paymentMethod === "card" && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block mb-2 uppercase text-sm tracking-tight">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-white"
                required
              />
            </motion.div>
          )}

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block mb-2 uppercase text-sm tracking-tight">
              Zip Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-black/60 border border-white/20 px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-white"
              maxLength={5}
              required
            />
          </motion.div>

          {zipCode.length >= 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block mb-2 uppercase text-sm tracking-tight">
                Shipping Method
              </label>
              <div className="space-y-2">
                {shippingOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex justify-between p-3 border rounded cursor-pointer transition-colors ${
                      shippingOption === option.id
                        ? "border-white bg-white/10"
                        : "border-white/20 hover:border-white/40"
                    }`}
                    onClick={() => {
                      setShippingOption(option.id);
                      setShippingCost(option.price);
                    }}
                  >
                    <div>
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-white/60">
                        {option.days} business days
                      </p>
                    </div>
                    <p>${option.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Payment Method Selection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-6"
      >
        <h3 className="font-heading uppercase text-lg mb-4 tracking-tight">
          Payment Method
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod("card")}
            className={`py-3 border rounded transition-colors ${
              paymentMethod === "card"
                ? "border-white bg-white/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            Credit Card
          </button>
          <button
            onClick={() => setPaymentMethod("apple_pay")}
            disabled={!canMakeApplePayPayment}
            className={`py-3 border rounded transition-colors ${
              paymentMethod === "apple_pay"
                ? "border-white bg-white/10"
                : !canMakeApplePayPayment
                ? "border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            Apple Pay
          </button>
        </div>
        {!canMakeApplePayPayment && (
          <p className="text-sm text-white/60 mt-2">
            Apple Pay is not available on this device/browser
          </p>
        )}
      </motion.div>

      {/* Card Payment */}
      {paymentMethod === "card" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="bg-black/60 border border-white/20 p-4 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#fff",
                    "::placeholder": {
                      color: "#bbb",
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Apple Pay Info */}
      {paymentMethod === "apple_pay" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="bg-black/60 border border-white/20 p-4 rounded-lg text-center">
            <p className="text-white/80">
              You'll be prompted to use Touch ID, Face ID, or your device passcode to complete the payment.
            </p>
          </div>
        </motion.div>
      )}

      {/* Order Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mb-8"
      >
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {zipCode.length >= 5 ? `$${shippingCost.toFixed(2)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-white/20">
            <span>Total</span>
            <span>${(subtotal + shippingCost).toFixed(2)}</span>
          </div>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        onClick={handleSubmit}
        disabled={
          loading || 
          !stripe || 
          !shippingOption || 
          (paymentMethod === "card" && !email) ||
          (paymentMethod === "apple_pay" && !canMakeApplePayPayment)
        }
        className={`w-full py-3 uppercase font-heading tracking-tight border ${
          loading ||
          (paymentMethod === "apple_pay" && !canMakeApplePayPayment)
            ? "border-white/30 text-white/50 cursor-not-allowed"
            : "border-white hover:bg-white hover:text-black transition-colors"
        }`}
      >
        {loading ? "Processing..." : paymentMethod === "apple_pay" ? "Pay with Apple Pay" : "Complete Payment"}
      </motion.button>
    </motion.div>
  );
};

export default CheckoutForm;