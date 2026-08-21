import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function Story() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this specific section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Dynamic mechanical rotation and scale linked directly to viewport scroll
  const lensRotation = useTransform(scrollYProgress, [0, 1], [-45, 90]);
  const bladeRotation = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const irisScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.15, 0.8]);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-6 md:px-12 bg-black pixel-grid overflow-hidden select-none border-t border-neutral-950"
    >
      {/* Decorative corner framing brackets */}
      <div className="absolute inset-x-8 inset-y-12 pointer-events-none z-10 opacity-30">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Column: Interactive Zeiss Mechanical Lens Construction */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative w-full h-[260px] lg:h-[350px]">
          
          {/* Outer Lens Housing Ring */}
          <motion.div 
            style={{ rotate: lensRotation }}
            className="relative w-56 h-56 lg:w-72 lg:h-72 border border-[#d4af37]/35 rounded-full flex items-center justify-center bg-neutral-950/40 backdrop-blur-md shadow-[0_0_35px_rgba(212,175,55,0.04)]"
          >
            {/* Alignment calibration ticks */}
            <div className="absolute inset-2 border border-dashed border-[#d4af37]/20 rounded-full" />
            <div className="absolute inset-6 border border-[#d4af37]/15 rounded-full" />
            
            {/* Precision SVG Reticle Rings */}
            <svg viewBox="0 0 100 100" className="absolute w-full h-full text-[#d4af37]/25 pointer-events-none">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="2" x2="50" y2="8" stroke="currentColor" strokeWidth="0.75" />
              <line x1="50" y1="92" x2="50" y2="98" stroke="currentColor" strokeWidth="0.75" />
              <line x1="2" y1="50" x2="8" y2="50" stroke="currentColor" strokeWidth="0.75" />
              <line x1="92" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.75" />
            </svg>

            {/* Inner Lens Glass Element */}
            <div className="relative w-40 h-40 lg:w-52 lg:h-52 border border-[#d4af37]/50 rounded-full overflow-hidden flex items-center justify-center bg-neutral-900/30">
              
              {/* Glass Cyan/Gold light reflection simulation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-[#d4af37]/10 pointer-events-none z-10" />

              {/* Dynamic Interlocking Aperture Blades */}
              <motion.svg 
                style={{ rotate: bladeRotation, scale: irisScale }}
                viewBox="0 0 100 100" 
                className="w-24 h-24 lg:w-32 lg:h-32 text-[#d4af37]/80 pointer-events-none"
              >
                {/* 6 Interlocking Aperture Blade Paths */}
                <path d="M 50 20 L 80 35 L 65 65 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                <path d="M 80 35 L 80 65 L 50 80 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                <path d="M 80 65 L 50 80 L 20 65 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                <path d="M 50 80 L 20 65 L 20 35 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                <path d="M 20 65 L 20 35 L 50 20 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                <path d="M 20 35 L 50 20 L 80 35 Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity="0.8" />
                
                {/* Center optic opening element */}
                <circle cx="50" cy="50" r="13" fill="none" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="3.5" fill="currentColor" />
              </motion.svg>

            </div>
          </motion.div>

          {/* Telemetry metadata tags floating next to outer ring */}
          <div className="absolute top-4 left-6 hidden lg:block font-mono text-[7px] tracking-[0.2em] text-neutral-600 font-bold">
            ZEISS APO PRIMES
          </div>
          <div className="absolute bottom-4 right-6 hidden lg:block font-mono text-[7px] tracking-[0.2em] text-[#d4af37]/70 font-bold">
            SYS • f/1.75 COATED
          </div>
        </div>

        {/* Right Column: Premium Brutalist Exhibition Card Layout */}
        <div className="lg:col-span-7 flex flex-col items-start text-left gap-6">
          
          {/* Zeiss Statement Tag */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#d4af37] font-black uppercase">
              [•] THE ZEISS T* OPTICS STATEMENT
            </span>
          </div>

          {/* Re-designed Core Title */}
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white uppercase">
            PHOTOGRAPHY ISN'T JUST A HOBBY—
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7d070] to-[#d4af37] text-red-accent font-black">
              IT'S HOW I SEE THE WORLD.
            </span>
          </h2>

          {/* Refined Description text block */}
          <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed tracking-wider max-w-2xl">
            EVERY FRAME TELLS A STORY. THROUGH THE LENS OF THE VIVO X300, I CAPTURE THE ESSENCE OF MOMENTS—THE INTERPLAY OF LIGHT, EMOTION, AND AUTHENTICITY.
          </p>

          {/* Monospaced Photographic Telemetry Grid under description */}
          <div className="w-full grid grid-cols-3 gap-4 pt-6 border-t border-neutral-900 mt-2 font-mono text-[8px] md:text-[10px] tracking-widest text-neutral-500">
            <div>
              <div className="text-neutral-600 font-black uppercase mb-1">OPTICAL ENGINE</div>
              <div className="text-white font-black truncate">ZEISS VARIO</div>
            </div>
            <div>
              <div className="text-neutral-600 font-black uppercase mb-1">COATING SPEC</div>
              <div className="text-[#d4af37] font-black truncate">ZEISS T* AR</div>
            </div>
            <div>
              <div className="text-neutral-600 font-black uppercase mb-1">SENSOR SYSTEM</div>
              <div className="text-white font-black truncate">50MP CUSTOM OIS</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
