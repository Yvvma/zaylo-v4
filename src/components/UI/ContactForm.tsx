import React from "react";
import { motion } from "framer-motion";

const ContactForm: React.FC = () => {
  return (
    <motion.form
      name="contact"
      method="POST"
      netlify
      encType="multipart/form-data"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="w-full max-w-xl flex flex-col gap-6"
    >
      <input type="hidden" name="form-name" value="contact" />

      {/* Name */}
      <div className="flex flex-col text-left">
        <label htmlFor="name" className="text-sm mb-1 text-white font-body italic uppercase">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col text-left">
        <label htmlFor="email" className="text-sm mb-1 text-white font-body italic uppercase">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        />
      </div>

      {/* Order Number (optional) */}
      <div className="flex flex-col text-left">
        <label htmlFor="order" className="text-sm mb-1 text-white font-body italic uppercase">
          Order Number (optional)
        </label>
        <input
          id="order"
          name="order"
          type="text"
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        />
      </div>

      {/* My Question */}
      <div className="flex flex-col text-left">
        <label htmlFor="question" className="text-sm mb-1 text-white font-body italic uppercase">
          My Question
        </label>
        <select
          id="question"
          name="question"
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        >
          <option value="">Select a question</option>
          <option value="order-status">Order Status</option>
          <option value="return">Return/Exchange</option>
          <option value="product-info">Product Information</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Subject */}
      <div className="flex flex-col text-left">
        <label htmlFor="subject" className="text-sm mb-1 text-white font-body italic uppercase">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        />
      </div>

      {/* Message/Description */}
      <div className="flex flex-col text-left">
        <label htmlFor="message" className="text-sm mb-1 text-white font-body italic uppercase">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="bg-transparent border border-white rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#02BED0]"
        />
      </div>

      {/* Attachments */}
      <div className="flex flex-col text-left">
        <label htmlFor="attachments" className="text-sm mb-1 text-white font-body italic uppercase">
          Attachments (optional)
        </label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          className="text-white"
        />
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="self-center mt-4 border border-[#02BED0] text-[#02BED0] font-bold py-3 px-6 rounded-xl uppercase font-heading hover:bg-[#02BED0] hover:text-black transition"
      >
        Send Message
      </motion.button>
    </motion.form>
  );
};

export default ContactForm;
