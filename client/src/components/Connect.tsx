import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export function Connect() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Interactive Camera Controls States (Focal Length & Zeiss Color only)
  const [focal, setFocal] = useState<'24mm' | '35mm' | '50mm' | '85mm'>('35mm');
  const [colorMode, setColorMode] = useState<'standard' | 'zeiss-classic' | 'zeiss-natural'>('zeiss-natural');

  // Focus Ring Rotation State based on Mouse Movement
  const [lensRotation, setLensRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Tracking rotation effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Calculate angle in degrees
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    setLensRotation(angle);
  };

  // Maps values to physical style classes
  const getFocalScale = () => {
    switch (focal) {
      case '24mm': return 0.85;
      case '35mm': return 1.0;
      case '50mm': return 1.15;
      case '85mm': return 1.35;
      default: return 1.0;
    }
  };

  const getColorFilter = () => {
    switch (colorMode) {
      case 'standard': return 'saturate-100 contrast-100 brightness-100';
      case 'zeiss-classic': return 'grayscale contrast-[1.2] brightness-[0.9]';
      case 'zeiss-natural': return 'saturate-[1.15] contrast-[1.05] hue-rotate-[4deg]';
      default: return 'saturate-[1.15] contrast-[1.05] hue-rotate-[4deg]';
    }
  };

  return (
    <section
      ref={ref}
      className="relative py-28 px-4 md:px-12 bg-black pixel-grid select-none border-t border-neutral-950 overflow-hidden"
    >
      {/* Dynamic Viewfinder grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-0 right-0 h-[1px] border-t border-[#d4af37]" />
        <div className="absolute top-3/4 left-0 right-0 h-[1px] border-t border-[#d4af37]" />
        <div className="absolute left-1/4 top-0 bottom-0 w-[1px] border-l border-[#d4af37]" />
        <div className="absolute left-3/4 top-0 bottom-0 w-[1px] border-l border-[#d4af37]" />
      </div>

      <div className="absolute inset-8 pointer-events-none z-10 opacity-15">
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#d4af37]" />
      </div>

      {/* SVG Grain Overlay Pattern (Constant premium noise texture at 0.05 opacity) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ opacity: 0.05 }}>
        <filter id="grainNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainNoise)" />
      </svg>

      <div className="max-w-5xl mx-auto flex flex-col items-center relative z-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col items-center text-center gap-4"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/20 bg-neutral-900/60 backdrop-blur-md text-[9px] md:text-[10px] tracking-[0.25em] text-[#d4af37] font-black uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            [•] OPTICAL TRANSCEIVER LINK HUB
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none uppercase font-mono">
            LET'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7d070] to-[#d4af37] font-black">CONNECT</span>
          </h2>
          <p className="text-[10px] md:text-xs text-neutral-500 font-mono tracking-widest uppercase max-w-md mt-1">
            ZEISS INTEGRATED HIGH-FIDELITY OPTICS INTERFACE SYSTEM v1.3
          </p>
        </motion.div>

        {/* 2-Column Balanced Tactical Dashboard Layout */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mt-4">
          
          {/* COLUMN 1: Viewfinder Telemetry Calibration Dials (Left) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="md:col-span-5 lg:col-span-4 flex flex-col gap-6 p-6 border border-neutral-900 bg-neutral-950/40 backdrop-blur-sm rounded-2xl justify-between font-mono"
          >
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-3 mb-6">
                <span className="text-[10px] text-[#d4af37] font-black tracking-widest uppercase">HUD CALIBRATION</span>
                <span className="text-[8px] text-neutral-600 font-bold uppercase">SEC: 01_OPT</span>
              </div>

              {/* Focal Controls */}
              <div className="flex flex-col gap-2.5 mb-8">
                <span className="text-[9px] text-neutral-500 font-black tracking-wider uppercase">FOCAL DEPTH (ZOOM)</span>
                <div className="grid grid-cols-4 gap-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-900">
                  {(['24mm', '35mm', '50mm', '85mm'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFocal(opt)}
                      className={`text-[8px] font-black py-1.5 rounded transition-all duration-300 ${
                        focal === opt
                          ? 'bg-[#d4af37] text-black shadow-lg font-bold'
                          : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Filters */}
              <div className="flex flex-col gap-2.5 mb-2">
                <span className="text-[9px] text-neutral-500 font-black tracking-wider uppercase">ZEISS T* COLOR DIALS</span>
                <div className="flex flex-col gap-1.5">
                  {(['standard', 'zeiss-classic', 'zeiss-natural'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setColorMode(opt)}
                      className={`text-[9px] font-black text-left px-3 py-2 rounded-lg transition-all duration-300 border ${
                        colorMode === opt
                          ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37] font-bold'
                          : 'border-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-900/40'
                      }`}
                    >
                      • {opt === 'standard' ? 'VIVO STANDARD' : opt === 'zeiss-classic' ? 'ZEISS CLASSIC MONO' : 'ZEISS NATURAL CHROMATIC'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro Calibration Specifications footer */}
            <div className="border-t border-neutral-900 pt-4 flex flex-col gap-1.5 text-[7px] text-neutral-600 uppercase font-black tracking-[0.1em] mt-8">
              <div className="flex justify-between">
                <span>SYSTEM CORE</span>
                <span className="text-white">ZEISS T* COATED</span>
              </div>
              <div className="flex justify-between">
                <span>DIAL RESPONSE</span>
                <span className="text-green-500">LIVE SYNCED</span>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: Central Zeiss Focal Calibration Mirrorless Lens & Instagram Link (Right) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="md:col-span-7 lg:col-span-8 flex flex-col items-center justify-center p-8 border border-neutral-900 bg-neutral-950/20 backdrop-blur-sm rounded-2xl relative gap-2 overflow-hidden"
            onMouseMove={handleMouseMove}
            ref={containerRef}
          >
            {/* Viewfinder brackets inside image card */}
            <div className="absolute inset-4 pointer-events-none z-10 opacity-30">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]" />
            </div>

            {/* Lens Dial Assembly Container: Padded safe area (p-10) to prevent concentric SVGs from overflowing borders */}
            <div className="relative w-full flex items-center justify-center p-10 md:p-12 z-10">
              
              {/* Circular focus barrel containing lens picture */}
              <div className="relative rounded-full p-2 bg-neutral-950 flex items-center justify-center border border-[#d4af37]/15">
                
                {/* Outer calibration dial: Rotates on mouse movement speed */}
                <svg 
                  viewBox="0 0 120 120" 
                  style={{ transform: `rotate(${lensRotation}deg)` }}
                  className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] text-[#d4af37]/30 transition-transform duration-200 ease-out pointer-events-none"
                >
                  <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="0.75" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                  
                  {/* Visual Lens Ticks */}
                  <path d="M 60 2 L 60 7" stroke="currentColor" strokeWidth="1" />
                  <path d="M 60 113 L 60 118" stroke="currentColor" strokeWidth="1" />
                  <path d="M 2 60 L 7 60" stroke="currentColor" strokeWidth="1" />
                  <path d="M 113 60 L 118 60" stroke="currentColor" strokeWidth="1" />
                  
                  {/* Numbers printed directly in dial */}
                  <text x="56" y="16" fill="currentColor" className="text-[5px] font-mono font-bold tracking-widest">0.25</text>
                  <text x="100" y="62" fill="currentColor" className="text-[5px] font-mono font-bold tracking-widest">0.5</text>
                  <text x="57" y="110" fill="currentColor" className="text-[5px] font-mono font-bold tracking-widest">1.0</text>
                  <text x="12" y="62" fill="currentColor" className="text-[5px] font-mono font-bold tracking-widest">∞</text>
                </svg>

                {/* Inner focal length indicators ring */}
                <motion.div 
                  className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)] border border-dashed border-[#d4af37]/10 rounded-full flex items-center justify-center font-mono text-[6px] text-neutral-600 tracking-[0.25em] pointer-events-none"
                  animate={{ rotate: -lensRotation * 0.4 }}
                  transition={{ type: "tween", ease: "linear" }}
                >
                  <div className="absolute top-1 select-none">ZEISS LENS</div>
                  <div className="absolute right-1 select-none">T* AR</div>
                  <div className="absolute bottom-1 select-none">VARIO-VARIO</div>
                  <div className="absolute left-1 select-none">35MM APEX</div>
                </motion.div>

                {/* Constant premium portrait background bokeh blur ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#d4af37]/10 to-transparent blur-[9px] scale-[1.03] transition-all duration-500 pointer-events-none" />

                {/* Profile Avatar with Lens reflections */}
                <div className="relative rounded-full overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.12)] border border-[#d4af37]/20 z-10">
                  <motion.img 
                    src="/profile.jpg" 
                    alt="Optical profile lens target" 
                    animate={{
                      scale: getFocalScale(),
                    }}
                    className={`w-32 h-32 md:w-44 md:h-44 rounded-full object-cover transition-all duration-500 pointer-events-none select-none ${getColorFilter()}`}
                    onError={(e) => {
                      e.currentTarget.src = "https://ui-avatars.com/api/?name=Pocket+Pixels&background=141414&color=d4af37&size=200";
                    }}
                  />
                  
                  {/* Physical glass lens reflection simulations */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/15 via-transparent to-[#d4af37]/20 pointer-events-none mix-blend-overlay" />
                  <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full transform rotate-12 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Dynamic Real-time HUD EXIF statistics display */}
            <div className="font-mono text-center flex flex-col items-center z-10">
              <span className="text-[7px] text-[#d4af37]/65 tracking-[0.2em] font-black uppercase">LIVE EXIF CAPTURE DATA</span>
              <span className="text-[10px] md:text-[11px] text-white font-black tracking-widest mt-1 uppercase border border-neutral-900 bg-neutral-950/80 px-3 py-1.5 rounded-md shadow-inner mt-2">
                ISO 100 • f/2.0 • 1/250s • {focal} • {colorMode === 'standard' ? 'STD' : colorMode === 'zeiss-classic' ? 'CLASSIC' : 'ZEISS NAT*'}
              </span>
            </div>

            {/* Instagram follow card beautifully integrated directly underneath */}
            <motion.a
              href="https://www.instagram.com/pocket_pixels2004/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, borderColor: '#d4af37' }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-md flex items-center justify-between p-5 border border-neutral-900 bg-neutral-950/30 hover:bg-neutral-900/10 rounded-xl transition-all duration-300 group font-mono mt-6 z-10"
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[7px] text-neutral-500 font-black tracking-widest uppercase">PRIMARY UPLINK PATH</span>
                <span className="text-sm font-black text-white group-hover:text-[#d4af37] transition-colors uppercase">INSTAGRAM CHANNEL</span>
                <span className="text-[9px] text-[#d4af37] font-black mt-0.5">@pocket_pixels2004</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-neutral-900 group-hover:border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] transition-colors duration-300">
                <span className="text-[9px] font-bold group-hover:translate-x-0.5 transition-transform duration-300">→</span>
              </div>
            </motion.a>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
