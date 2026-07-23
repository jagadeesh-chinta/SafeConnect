import { useEffect, useRef, useState } from "react";
import securityImage from "../assets/security.jpg";

function SecurityShowcaseSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutIdRef.current = setTimeout(() => {
            setIsVisible(true);
          }, 150);
        } else {
          setIsVisible(false);
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
          }
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[85vh] feature-page-bg px-4 py-14 sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-stretch overflow-visible rounded-3xl border border-border bg-bg-surface/50 p-2 shadow-2xl lg:min-h-[82vh] lg:grid-cols-[1.15fr_0.85fr] backdrop-blur-md">
        <div
          className={`group relative min-h-[320px] overflow-hidden rounded-2xl lg:rounded-[22px] transition-all duration-700 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(10, 14, 26, 0.4), rgba(79, 70, 229, 0.2)), url(${securityImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-bg-primary/80 via-transparent to-accent-primary/20" />
          <div className="absolute inset-0 transition duration-700 group-hover:scale-105 group-hover:bg-accent-primary/10" />
        </div>

        <div className="relative flex items-center lg:-ml-20">
          <div
            className={`relative z-10 mt-6 w-full rounded-2xl glass-card p-8 sm:p-12 lg:mt-0 transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-2xl ${
              isVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
            }`}
          >
            <p className="mb-4 text-sm font-bold tracking-[0.2em] uppercase text-accent-primary">
              Security First
            </p>

            <h3 className="text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Your Data Deserves Protection Beyond Today's Threats
            </h3>

            <p className="mt-6 text-base leading-relaxed text-text-secondary sm:text-lg">
              Chatify ensures next-generation communication security using advanced encryption
              methods like BB84 quantum protocols, protecting your conversations from modern and
              future cyber threats.
            </p>

            <button
              type="button"
              className="primary-button mt-10 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold tracking-wide"
            >
              <span>Explore Security</span>
              <span aria-hidden="true" className="text-lg leading-none">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecurityShowcaseSection;
