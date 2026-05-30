import React, { useState } from "react";
import { motion } from "framer-motion";

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle signup
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
      <motion.h2 className="text-3xl fill-over-stroke font-heading stroke-4 stroke-black text-center mb-6" variants={fieldVariants}>
        Create Account
      </motion.h2>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <motion.div variants={fieldVariants}>
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

        <motion.div variants={fieldVariants}>
          <label className="block mb-1 font-body italic">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-black border border-[#02BED0] text-white"
            placeholder="********"
          />
        </motion.div>

        <motion.button type="submit" className="font-heading text-[#02BED0] text-lg border border-[#02BED0] px-8 py-1 rounded-xl uppercase" variants={fieldVariants}>
          Sign Up
        </motion.button>
      </form>
    </motion.div>
  );
}
