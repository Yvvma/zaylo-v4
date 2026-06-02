import { motion } from "framer-motion";
import texts from "../../texts.json";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const MainVideoContainer = () => {
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
      className="w-full flex flex-col justify-center items-center relative "
    >
     
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full flex justify-center items-center cursor-pointer z-20"
        onClick={handleVideoClick}
      >
        
        <div className="relative w-full aspect-[3/4] overflow-hidden sm:max-h-212">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/welcome-zaylo.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          onCanPlay={() => {
            if (videoRef.current?.paused && !userPlayed) {
              videoRef.current
                .play()
                .catch(() => setAutoplayFailed(true));
            }
          }}
          onError={() => setAutoplayFailed(true)}
        />

        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-6 p-4">
       <div className="flex flex-col justify-between items-center w-full h-full py-4 max-w-6xl">

 <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
    <div className="flex flex-col w-full  py-12">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white text-2xl md:text-4xl font-heading font-bold tracking-base px-4 text-left"
      >
        {"Sobre a Zaylo"}
      </motion.h2>

  
    </div>

    {/* Botão */}
    <div className="flex justify-between items-end w-full gap-2">
        <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white text-xs md:text-xs font-body z-20 font-light tracking-base px-4 text-left"
      >
        {"Há quatro anos, minha vida ganhou um novo sentido quando o Zico, meu cachorro, passou a fazer parte dela. Foi nesse momento que percebi o poder transformador que os cães têm na vida de um ser humano. A conexão entre nós e eles é única — e foi dessa inspiração que nasceu a Zaylo."}
      </motion.h2>  
    
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

export default MainVideoContainer;
