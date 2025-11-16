import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HomePage() {
  // ------------------------------
  // ONE-TIME TYPEWRITER ANIMATION
  // ------------------------------
  const fullText = "AuctionSwift";
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;

      if (i === fullText.length) {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 300); // hide cursor shortly after
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // ------------------------------
  // PARALLAX EFFECT
  // ------------------------------
  const { scrollY } = useScroll();
  const parallax1 = useTransform(scrollY, [0, 600], [0, 120]);
  const parallax2 = useTransform(scrollY, [0, 600], [0, -80]);

  // ------------------------------
  // SCROLL TRIGGERS FOR CARDS
  // ------------------------------
  const { ref: cardRef1, inView: visible1 } = useInView({ threshold: 0.2 });
  const { ref: cardRef2, inView: visible2 } = useInView({ threshold: 0.2 });
  const { ref: cardRef3, inView: visible3 } = useInView({ threshold: 0.2 });

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-black via-zinc-900 to-indigo-950 text-white">

      {/* ============================================ */}
      {/* APPLE VISION PRO–STYLE PARALLAX BACKGROUND */}
      {/* ============================================ */}
      <motion.div
        style={{ y: parallax1 }}
        className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/20 blur-[200px] rounded-full"
      />
      <motion.div
        style={{ y: parallax2 }}
        className="absolute bottom-[-25%] right-[-15%] w-[45rem] h-[45rem] bg-indigo-400/10 blur-[180px] rounded-full"
      />

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative z-10">

        {/* ONE-TIME TYPEWRITER TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-xl mb-6"
        >
          {displayText}
          {showCursor && <span className="text-white">|</span>}
        </motion.h1>

        {/* SLOGAN */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-neutral-200 italic font-light mb-6"
        >
          Where every item finds its story.
        </motion.p>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-neutral-400 max-w-2xl"
        >
          Precision research, AI-powered clarity, instant comps — for auctioneers who move fast.
        </motion.p>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS — GLASSMORPHISM CARDS */}
      {/* ============================================ */}
      <section className="py-24 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-16">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-10">

          {/* CARD 1 */}
          <motion.div
            ref={cardRef1}
            initial={{ opacity: 0, y: 40 }}
            animate={visible1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-indigo-400/40 transition shadow-lg"
          >
            <h3 className="text-3xl font-semibold mb-4">1. Upload</h3>
            <p className="text-neutral-300">
              Import item photos — our AI analyzes them instantly.
            </p>
          </motion.div>

          {/* CARD 2 */}
          <motion.div
            ref={cardRef2}
            initial={{ opacity: 0, y: 40 }}
            animate={visible2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-indigo-400/40 transition shadow-lg"
          >
            <h3 className="text-3xl font-semibold mb-4">2. Describe</h3>
            <p className="text-neutral-300">
              Generate professional auction descriptions in seconds.
            </p>
          </motion.div>

          {/* CARD 3 */}
          <motion.div
            ref={cardRef3}
            initial={{ opacity: 0, y: 40 }}
            animate={visible3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-indigo-400/40 transition shadow-lg"
          >
            <h3 className="text-3xl font-semibold mb-4">3. Compare</h3>
            <p className="text-neutral-300">
              Instantly view eBay comps matched to your items.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CALL TO ACTION */}
      {/* ============================================ */}
      <section className="flex justify-center py-24">
        <motion.div whileHover={{ scale: 1.05 }} className="relative group">
          <Link to="/new">
            <button className="px-12 py-5 text-xl font-semibold bg-white text-black rounded-full shadow-2xl flex items-center gap-2 relative z-20">
              Get Started <ArrowRight className="w-6 h-6" />
            </button>
          </Link>

          {/* NEON GLOW */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 bg-indigo-500 blur-xl"></div>
        </motion.div>
      </section>

    </div>
  );
}
