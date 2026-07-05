import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { PublicGrid } from "../types";
import { WaffleMark } from "../components/WaffleLogo";

export function IntroScreen({ grid, onStart }: { grid: PublicGrid; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-ink px-8 text-center"
      style={
        grid.coverUrl
          ? { backgroundImage: `url(${grid.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {grid.coverUrl && <div className="absolute inset-0 bg-black/60" />}
      <div className="relative z-[2] flex flex-col items-center">
        <WaffleMark size={56} className="mb-4" />
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white/50">
          A swipeable grid
        </p>
        <h1 className="max-w-[16ch] font-display text-4xl font-semibold leading-[1.1] text-paper [text-wrap:balance] md:text-5xl">
          {grid.title}
        </h1>
        {grid.description && (
          <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-white/70">
            {grid.description}
          </p>
        )}
        <button
          onClick={onStart}
          className="mt-10 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-accent px-8 py-3 text-lg font-bold text-ink transition-[filter] hover:brightness-95"
        >
          Start exploring
          <ArrowRight size={20} />
        </button>
        <p className="mt-6 text-sm text-white/45">Swipe in any direction to explore.</p>
      </div>
    </motion.div>
  );
}
