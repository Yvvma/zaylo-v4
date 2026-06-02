import { motion } from "framer-motion";
import texts from "../../texts.json";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const TextFiveContainer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [userPlayed, setUserPlayed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    const video = videoRef.current;

    const tryAutoplay = async () => {
      try {
        if (video.readyState >= 2) {
          await video.play();
          setAutoplayFailed(false);
        } else {
          video.addEventListener(
            "loadeddata",
            async () => {
              try {
                await video.play();
                setAutoplayFailed(false);
              } catch (e) {
                console.warn("Autoplay failed after load:", e);
                setAutoplayFailed(true);
              }
            },
            { once: true }
          );
        }
      } catch (e) {
        console.warn("Autoplay failed:", e);
        setAutoplayFailed(true);
      }
    };

    const attemptAutoplay = () => {
      tryAutoplay();
      setTimeout(() => {
        if (video.paused && !userPlayed) {
          tryAutoplay();
        }
      }, 100);
    };

    attemptAutoplay();

    const handleUserInteraction = () => {
      if (video.paused && !userPlayed && !autoplayFailed) {
        tryAutoplay();
      }
    };

    document.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });
    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [isVisible, autoplayFailed, userPlayed]);

  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setUserPlayed(true);
        setAutoplayFailed(false);
      } catch (e) {
        console.error("Manual play failed:", e);
      }
    }
  };

  const handleVideoClick = () => {
    if (autoplayFailed || videoRef.current?.paused) {
      handleManualPlay();
    }
  };

  return (
    <section
      id="content"
      className="w-full flex flex-col justify-center items-center  "
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full flex justify-center items-center cursor-pointer bg-[radial-gradient(ellipse_at_center,_#1A2327_0%,_#131819_45%,_#000000_100%)]"
        onClick={handleVideoClick}
      >
        
        <div className="relative w-full aspect-[3/4] overflow-hidden sm:max-h-212">
     <img
  src="/photos/sobre/05.webp"
  alt="Welcome Zaylo"
  className="absolute inset-0 w-full h-full object-cover"
/>

        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-6 p-4">
       <div className="flex flex-col justify-between items-center w-full h-full py-4">

<div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>

    {/* Botão */}
    <div className="flex justify-end z-20 py-8 h-full items-center flex-col w-full gap-2 ">
    
       <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white text-xs md:text-xs font-body font-light tracking-base px-4 text-center"
      >
        {"Agradeço a todos que acreditaram nessa jornada — amigos, designers, família — e especialmente ao Zico e à Ana Clara, que estiveram ao meu lado em cada passo. Sem vocês, nada disso teria sido possível."}
      </motion.p>  
  <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white text-xs md:text-xs font-body font-light tracking-base px-4 text-center"
      >
        {"Com carinho,"}
      </motion.p>  
        <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white text-xs md:text-xs font-body tracking-base px-4 text-center"
      >
        {"Fabio Beltrão | Fundador"}
      </motion.p>  

      <img src='/logos/favicon-zaylo.png' className="max-w-8" />

    
    </div>

  </div>
        </div>

        {/* Thumbnail fallback + Play button */}
        {autoplayFailed && !userPlayed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex justify-center items-center"
            >
             
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleManualPlay();
              }}
              className="z-10 border-2 border-[#02BED0] text-[#02BED0] hover:bg-[#02BED0] hover:text-black p-4 rounded-full transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center backdrop-blur-sm bg-black/20"
            >
              <Play className="w-8 h-8" strokeWidth={2.5} fill="currentColor" />
            </motion.button>
          </motion.div>
        )}
        </div>

    
      </motion.div>
      
      


   
    </section>
  );
};

export default TextFiveContainer;
