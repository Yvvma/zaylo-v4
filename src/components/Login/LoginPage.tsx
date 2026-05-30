import React, { useState } from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.1,
      ease: "easeOut",
      duration: 0.3,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with your login logic
  };

  return (
    <motion.div
      className="max-w-md mx-auto mt-16 p-8 border border-[#02BED0] rounded-xl bg-[#232222] text-white shadow-xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-3xl fill-over-stroke font-heading stroke-4 stroke-black  text-center mb-6"
        variants={fieldVariants}
      >
        Welcome Back
      </motion.h2>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <motion.div variants={fieldVariants}>
          <label className="block mb-1 font-body italic">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-black border border-[#02BED0] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
            placeholder="you@example.com"
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <label className="block mb-1 font-body italic">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-black border border-[#02BED0] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
            placeholder="********"
          />
        </motion.div>

        <motion.button
          type="submit"
          className="font-heading text-[#02BED0] text-lg sm:text-xl border border-[#02BED0]-1 px-8 py-1 rounded-xl tracking-8 uppercase"
          variants={buttonVariants}
        >
          Login
        </motion.button>
        </form>
        <a href='/login/signup'>
    <motion.button
          type="submit"
          className="font-heading w-full mt-4 text-[#02BED0] text-lg sm:text-xl border border-[#02BED0]-1 px-8 py-1 rounded-xl tracking-8 uppercase"
          variants={buttonVariants}
        >
          Sign Up
        </motion.button>
        </a>
        

        <a href='/login/forgot'>
        <motion.button
          type="submit"
          className="font-heading w-full mt-4 text-[#02BED0] text-lg sm:text-xl border border-[#02BED0]-1 px-8 py-1 rounded-xl tracking-8 uppercase"
          variants={buttonVariants}
        >
          Forgot My Password
        </motion.button>
        </a>
      
    </motion.div>
  );
}
