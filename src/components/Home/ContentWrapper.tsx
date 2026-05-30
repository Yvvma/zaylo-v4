import {motion} from 'framer-motion';
import RevendedorContainer from "../Revendedor/BannerContainer"
import BannerContainer from "./BannerContainer"
import ProductContainer from "./Product";
import NewArrivalsContainer from './NewArrivals';
import VestContainer from './VestContainer';
import FreedomLeashContainer from './FreedomLeashContainer';
import ProdutosContainer from '../Revendedor/ProdutosContainer';

const ContentWrapper = () => {
    return (
        <>
         <motion.section
         initial={{ opacity: 0}}
        whileInView={{ opacity: 1}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        viewport={{ once: true, amount: 0.2 }}
        className="relative flex flex-col  w-full gap-6  
        justify-center items-center bg-center bg-[#131819] border-b border-white z-30"
        >
            <div className='flex w-full h-full sm:flex-row flex-col gap-6  sm:gap-0'>
                <BannerContainer/>
                <NewArrivalsContainer/>
            </div>
            <ProdutosContainer/>
          

            <div className='flex w-full h-full sm:flex-row flex-col gap-6 sm:gap-0'>
                <VestContainer/>
                <FreedomLeashContainer/>
            </div>
           <RevendedorContainer/>

            <ProductContainer/>
            
        </motion.section>
    </>

    )
}

export default ContentWrapper;