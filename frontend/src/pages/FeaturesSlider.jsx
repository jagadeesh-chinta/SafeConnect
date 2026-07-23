import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import quantumSecure from "../assets/quantum_secure.jpg";
import screenshotProtection from "../assets/screenshot_protection.jpg";
import mediaSharing from "../assets/media_sharing.jpg";
import notificationImg from "../assets/notification.jpg";
import friendSystem from "../assets/friend_system.jpg";
import chatRestore from "../assets/chat_restore.jpeg";
import chatBackup from "../assets/chat_backup.jpeg";

function FeaturesSlider() {
  const sliderRef = useRef(null);
  const sliderViewportRef = useRef(null);
  const sectionAnimationTimeoutRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [cardWidth, setCardWidth] = useState(0);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const isAnimatingRef = useRef(false);
  const [visibleCards, setVisibleCards] = useState(() => window.innerWidth < 768 ? 1 : 3);
  const GAP_PX = 32;
  const TRANSITION_MS = 550;

  const features = [
    {
      id: 1,
      title: "Quantum Secure Chat",
      subtitle: "Powered by BB84 encryption",
      icon: "🔐",
      color: "from-accent-primary to-blue-600",
      bgImage: quantumSecure,
    },
    {
      id: 2,
      title: "Screenshot Protection",
      subtitle: "Your privacy is always protected",
      icon: "📸",
      color: "from-teal-600 to-accent-primary",
      bgImage: screenshotProtection,
    },
    {
      id: 3,
      title: "Smart Chat Restore",
      subtitle: "Restore conversations anytime",
      icon: "♻️",
      color: "from-accent-secondary to-pink-600",
      bgImage: chatRestore,
    },
    {
      id: 4,
      title: "Media Sharing",
      subtitle: "Send files securely",
      icon: "📁",
      color: "from-orange-500 to-red-500",
      bgImage: mediaSharing,
    },
    {
      id: 5,
      title: "Real-Time Notifications",
      subtitle: "Instant message alerts & updates",
      icon: "🔔",
      color: "from-accent-primary to-accent-secondary",
      bgImage: notificationImg,
    },
    {
      id: 6,
      title: "Friend System",
      subtitle: "Manage connections effortlessly",
      icon: "👥",
      color: "from-rose-500 to-accent-secondary",
      bgImage: friendSystem,
    },
    {
      id: 7,
      title: "Chat Backup",
      subtitle: "Never lose your conversations",
      icon: "☁️",
      color: "from-blue-600 to-accent-primary",
      bgImage: chatBackup,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionAnimationTimeoutRef.current = setTimeout(() => {
              setIsSectionVisible(true);
            }, 300);
          } else {
            setIsSectionVisible(false);
            if (sectionAnimationTimeoutRef.current) {
              clearTimeout(sectionAnimationTimeoutRef.current);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }

    return () => {
      observer.disconnect();
      if (sectionAnimationTimeoutRef.current) {
        clearTimeout(sectionAnimationTimeoutRef.current);
      }
    };
  }, []);

  const loopedFeatures = useMemo(
    () => [...features, ...features.slice(0, visibleCards)],
    [features, visibleCards]
  );

  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(window.innerWidth < 768 ? 1 : 3);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sliderViewportRef.current) return;

    const updateCardWidth = () => {
      const viewportWidth = sliderViewportRef.current.clientWidth;
      const totalGapWidth = GAP_PX * (visibleCards - 1);
      setCardWidth((viewportWidth - totalGapWidth) / visibleCards);
    };

    updateCardWidth();

    const resizeObserver = new ResizeObserver(updateCardWidth);
    resizeObserver.observe(sliderViewportRef.current);

    return () => resizeObserver.disconnect();
  }, [GAP_PX, visibleCards]);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  useEffect(() => {
    if (currentIndex !== features.length) return;

    const timeoutId = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrentIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          isAnimatingRef.current = false;
        });
      });
    }, TRANSITION_MS);

    return () => clearTimeout(timeoutId);
  }, [currentIndex, features.length, TRANSITION_MS]);

  const moveSlide = (direction) => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    setIsAutoPlay(false);
    
    if (direction === "next") {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setTransitionEnabled(false);
      setCurrentIndex((prev) => {
        const normalized = prev % features.length;
        return normalized === 0 ? features.length - 1 : normalized - 1;
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
    }
    
    setTimeout(() => {
      isAnimatingRef.current = false;
      setIsAutoPlay(true);
    }, TRANSITION_MS);
  };

  return (
    <section
      ref={sliderRef}
      className="relative w-full min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 md:px-8 py-20 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-32 -left-40 w-96 h-96 bg-accent-primary rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent-secondary rounded-full blur-[150px]"></div>
      </div>

      <div
        className={`relative z-10 w-full max-w-7xl mx-auto transition-all duration-700 ease-out ${
          isSectionVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
        }`}
      >
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Talk Freely,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Communicate Securely
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Experience advanced features designed for your security and privacy
          </p>
        </div>

        <div className="flex items-center justify-between gap-6">
          <button
            onClick={() => moveSlide("prev")}
            className="flex-shrink-0 p-4 rounded-full glass-button hover:scale-110 transition-all duration-300"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="w-6 h-6 text-accent-primary" />
          </button>

          <div ref={sliderViewportRef} className="flex-1 overflow-hidden px-2 py-4">
            <div
              className="flex gap-8"
              style={{
                transform: `translateX(-${currentIndex * (cardWidth + GAP_PX)}px)`,
                transition: transitionEnabled ? `transform ${TRANSITION_MS}ms ease` : "none",
              }}
            >
              {loopedFeatures.map((feature, index) => (
                <div
                  key={`${feature.id}-${index}`}
                  className={`flex-shrink-0 transition-all duration-500 ease-out ${
                    index % features.length === (currentIndex + 1) % features.length
                      ? "scale-100 opacity-100"
                      : "scale-95 opacity-60 hover:opacity-90"
                  }`}
                  style={{
                    width: cardWidth > 0 ? `${cardWidth}px` : "calc((100% - 64px) / 3)",
                    minWidth: cardWidth > 0 ? `${cardWidth}px` : "calc((100% - 64px) / 3)",
                  }}
                >
                  <div
                    className={`relative h-[420px] rounded-[24px] overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
                  >
                    {feature.bgImage ? (
                      <>
                        <img
                          src={feature.bgImage}
                          alt={feature.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/60 to-transparent group-hover:from-[#0a0e1a] group-hover:via-[#0a0e1a]/40 transition-all duration-300"></div>
                      </>
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-90`}
                        ></div>
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-300"></div>
                      </>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-end text-white p-8 text-center">
                      <div className="text-6xl mb-6 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-xl">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-lg transform group-hover:-translate-y-2 transition-transform duration-500">
                        {feature.title}
                      </h3>
                      <p className="text-white/90 text-base max-w-xs drop-shadow-md leading-relaxed font-medium transform group-hover:-translate-y-1 transition-transform duration-500">
                        {feature.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => moveSlide("next")}
            className="flex-shrink-0 p-4 rounded-full glass-button hover:scale-110 transition-all duration-300"
            aria-label="Next"
          >
            <ChevronRightIcon className="w-6 h-6 text-accent-primary" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSlider;
