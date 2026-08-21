import { motion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-12 px-6 md:px-12 bg-black border-t border-[#d4af37]/80 pixel-grid select-none">
      {/* Decorative layout grids in the corners of footer */}
      <div className="absolute top-0 left-8 w-8 h-[1px] bg-[#d4af37]/30" />
      <div className="absolute top-0 right-8 w-8 h-[1px] bg-[#d4af37]/30" />

      <div className="max-w-6xl mx-auto relative">
        
        {/* Viewfinder Concentric Calibration Target Ring */}
        <div className="absolute -top-6 right-1/4 md:right-1/3 flex items-center justify-center pointer-events-none opacity-85 z-10">
          <div className="relative w-8 h-8 rounded-full border border-[#d4af37]/35 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border border-dashed border-[#d4af37]/20 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-6 pb-8"
        >
          {/* Brand */}
          <div className="text-center md:text-left font-mono">
            <h3 className="text-xl md:text-2xl font-black text-[#d4af37] tracking-[0.15em] uppercase">
              VIVO X300
            </h3>
            <p className="text-[9px] md:text-[10px] text-neutral-500 font-bold tracking-[0.2em] mt-1.5">
              MOBILE PHOTOGRAPHY PORTFOLIO
            </p>
          </div>

          {/* Center text Statement */}
          <div className="text-center font-mono">
            <p className="text-[10px] md:text-xs text-neutral-400 font-black tracking-[0.25em] uppercase">
              CRAFTED WITH PRECISION AND PASSION
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right font-mono">
            <p className="text-[10px] md:text-xs text-neutral-400 font-black tracking-[0.2em] uppercase">
              © {currentYear} ALL RIGHTS RESERVED.
            </p>
          </div>
        </motion.div>

        {/* Divider Layout Line */}
        <div className="border-t border-[#d4af37]/30 pt-6">
          <p className="text-[9px] md:text-[10px] text-neutral-500 text-center font-black tracking-[0.3em] uppercase">
            DESIGNED & DEVELOPED WITH <span className="text-[#d4af37] text-xs font-black inline-block animate-pulse">✦</span> FOR PREMIUM VISUAL STORYTELLING
          </p>
        </div>
      </div>
    </footer>
  );
}
