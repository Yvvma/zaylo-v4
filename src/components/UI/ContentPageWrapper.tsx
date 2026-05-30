import { motion } from "framer-motion";

interface Props {
  title: string;
  children: React.ReactNode;
}

const ContentPageWrapper = ({ title, children }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="relative flex flex-col w-full max-w-4xl ml-8 mr-8 p-8 mb-16 rounded-xl justify-center items-center border border-[#02BED0] text-white z-30 text-center gap-6 bg-[#232222]/80"
    >
      {/* Page Title */}
      <h1 className="sm:text-3xl font-heading text-[#02BED0] uppercase text-xl rounded-xl py-2 px-4 border border-[#02BED0]">
        {title}
      </h1>

      {/* Page Content */}
      <div className="flex flex-col gap-6 sm:text-lg leading-8 tracking-widest uppercase text-sm font-body italic text-white text-center">
        {children}
      </div>
      <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className={`max-w-max p-2 flex justify-center items-center`}
          >
            <img className={`absolute -rotate-10 max-w-48 translate-y-16 sm:max-w-64 sm:translate-y-10 transition-opacity duration-300 `} src='https://res.cloudinary.com/dmbevpzna/image/upload/v1750371063/litco_skate_gl61vz.png'></img>
          </motion.div>
    </motion.div>
  );
};

export default ContentPageWrapper;
