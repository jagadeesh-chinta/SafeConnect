import { useEffect, useRef, useState } from "react";

function PrivacySection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[70vh] bg-bg-primary flex items-center justify-center px-4 md:px-8 py-20 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent-secondary/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-accent-primary text-sm md:text-base font-semibold tracking-widest uppercase mb-6">
            Our Commitment
          </p>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-text-primary">
            Privacy is not an option,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              it is a necessity in the digital world.
            </span>
          </h2>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Your conversations are yours alone. With quantum-resistant encryption and
            advanced privacy features, we ensure your data remains protected at every step.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-6 py-3 rounded-xl glass-card text-text-primary font-medium flex items-center gap-2">
              <span className="text-accent-primary">🔐</span> End-to-End Encrypted
            </div>
            <div className="px-6 py-3 rounded-xl glass-card text-text-primary font-medium flex items-center gap-2">
              <span className="text-accent-primary">🛡️</span> Zero Knowledge Storage
            </div>
            <div className="px-6 py-3 rounded-xl glass-card text-text-primary font-medium flex items-center gap-2">
              <span className="text-accent-primary">⚡</span> Quantum Safe
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrivacySection;
