import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 420;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={`fixed bottom-5 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan/20 bg-[linear-gradient(135deg,rgba(20,28,53,0.94),rgba(51,63,96,0.92))] text-cyan shadow-[0_18px_40px_rgba(6,182,212,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:text-white hover:shadow-[0_22px_46px_rgba(6,182,212,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 sm:bottom-7 sm:right-6 lg:bottom-8 lg:right-8 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
