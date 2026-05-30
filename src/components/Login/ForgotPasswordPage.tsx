import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle password reset
  };

  return (
    <motion.div
      className="max-w-md mx-auto mt-24 p-8 border border-[#02BED0] rounded-xl bg-[#232222] text-white shadow-xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
    >
      <motion.h2 className="text-3xl fill-over-stroke font-heading stroke-4 stroke-black text-center mb-6">
        Forgot Password
      </motion.h2>

      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <motion.div>
          <label className="block mb-1 font-body italic">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-black border border-[#02BED0] text-white"
            placeholder="you@example.com"
          />
        </motion.div>

        <motion.button type="submit" className="font-heading text-[#02BED0] text-lg border border-[#02BED0] px-8 py-1 rounded-xl uppercase">
          Send Reset Link
        </motion.button>
      </form>
    </motion.div>
  );
}
