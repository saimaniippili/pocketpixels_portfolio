import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Loader2, X, ChevronLeft, ChevronRight, Maximize2, Download } from 'lucide-react';
import { useGalleryData } from '@/hooks/useGalleryData';
import { downloadImage, getFilenameFromUrl } from '@/lib/utils';
import { toast } from 'sonner';

// Generate deterministic EXIF data based on ID to simulate real camera settings
const getExifData = (id: number | string) => {
  const hash = String(id).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const isos = [50, 100, 200, 400, 800, 1600];
  const apertures = ['f/1.8', 'f/2.0', 'f/2.4', 'f/2.8', 'f/4.0'];
  const speeds = ['1/1000s', '1/500s', '1/250s', '1/120s', '1/60s', '1/30s'];
  const focals = ['23mm', '35mm', '50mm', '85mm'];
  
  const absHash = Math.abs(hash);
  return `ISO ${isos[absHash % isos.length]} • ${apertures[absHash % apertures.length]} • ${speeds[absHash % speeds.length]} • ${focals[absHash % focals.length]}`;
};

export function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const { data: images = [], isLoading } = useGalleryData();

  const slides = useMemo(() => {
    const landscapes = images.filter(img => img.category.toLowerCase() === 'landscapes');
    const unpackedSlides: typeof images = [];

    landscapes.forEach(img => {
      const isCarousel = img.imageUrl.startsWith('["');
      if (isCarousel) {
        try {
          const urls = JSON.parse(img.imageUrl) as string[];
          const keys = img.imageKey.startsWith('["') 
            ? (JSON.parse(img.imageKey) as string[]) 
            : [img.imageKey];

          urls.forEach((url, idx) => {
            unpackedSlides.push({
              ...img,
              id: img.id * 1000 + idx, // Maintain unique numeric ID for distinct simulated EXIF metadata
              title: urls.length > 1 ? `${img.title} (${idx + 1}/${urls.length})` : img.title,
              imageUrl: url,
              imageKey: keys[idx] || img.imageKey,
            });
          });
        } catch (e) {
          // Fallback to original record if JSON parsing fails
          unpackedSlides.push(img);
        }
      } else {
        unpackedSlides.push(img);
      }
    });

    return unpackedSlides;
  }, [images]);

  // Handle ESC key for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto Slideshow Logic
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Reset current slide if it exceeds the new slides length
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pauseSlideshowTemporarily = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 4500); // Resume after 4.5 seconds
  };

  // Handle Keyboard Navigation for Desktop
  useEffect(() => {
    if (!inView && !isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        paginate(1);
        pauseSlideshowTemporarily();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paginate(-1);
        pauseSlideshowTemporarily();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inView, isLightboxOpen, slides.length]);

  const paginate = (newDirection: number) => {
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev + newDirection + slides.length) % slides.length);
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold) {
      paginate(1);
      pauseSlideshowTemporarily();
    } else if (offset.x > swipeThreshold) {
      paginate(-1);
      pauseSlideshowTemporarily();
    }
  };

  if (isLoading) {
    return (
      <section className="relative py-24 px-4 bg-black pixel-grid min-h-[50vh] flex items-center justify-center select-none">
        <Loader2 className="animate-spin text-[#d4af37]" size={40} />
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[currentSlide];

  return (
    <section
      ref={ref}
      className="relative py-28 px-4 md:px-8 bg-black pixel-grid select-none border-t border-neutral-950"
    >
      {/* Decorative calibration grids around landscape section */}
      <div className="absolute inset-x-8 inset-y-12 pointer-events-none z-10 opacity-15">
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#d4af37]" />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Section Header with monospaced accents */}
        <div className="w-full flex flex-col items-start gap-4 mb-16 text-left">
          {/* Section Indicator Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/20 bg-neutral-900/60 backdrop-blur-md text-[9px] md:text-[10px] tracking-[0.25em] text-[#d4af37] font-black uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            [•] CINEMATIC WIDESCREEN TIMELINE
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none uppercase">
            LANDSCAPE<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7d070] to-[#d4af37] text-red-accent font-black">VIEWPORT</span>
          </h2>
        </div>

        {/* Camera Viewfinder Slideshow Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-5xl flex flex-col items-center gap-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Viewfinder Field Monitor Frame */}
          <div className="w-full bg-[#0a0a0a] border-3 border-red-500 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.75)] relative group">
            
            {/* Viewfinder Corners inside frame */}
            <div className="absolute inset-4 pointer-events-none z-20 opacity-30">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white" />
            </div>

            {/* Viewfinder Rule-of-Thirds Gridlines inside frame */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10">
              <div className="absolute top-1/3 left-0 right-0 h-[1px] border-t border-dashed border-white" />
              <div className="absolute top-2/3 left-0 right-0 h-[1px] border-t border-dashed border-white" />
              <div className="absolute left-1/3 top-0 bottom-0 w-[1px] border-l border-dashed border-white" />
              <div className="absolute left-2/3 top-0 bottom-0 w-[1px] border-l border-dashed border-white" />
            </div>

            {/* Live Indicator Overlay top left */}
            <div className="absolute top-5 left-5 z-20 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-400 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE MONITOR [•] PLAY
            </div>

            {/* ZEISS Spec Tag top right */}
            <div className="absolute top-5 right-5 z-20 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-400 pointer-events-none hidden sm:flex items-center gap-2">
              <span className="border border-neutral-700 px-1 py-0.2 rounded text-[7px] text-neutral-400">16:9 PRO</span>
              <span className="text-[#d4af37] font-black">ZEISS T* AR</span>
            </div>

            {/* Telemetry log Overlay bottom left */}
            <div className="absolute bottom-5 left-5 z-20 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-400 pointer-events-none flex flex-col gap-0.5 max-w-[70vw]">
              <span className="text-white font-black uppercase text-[10px] md:text-sm truncate block">{activeSlide.title}</span>
              <span className="text-[#d4af37] font-bold text-[8px] md:text-[9px]">{getExifData(activeSlide.id)}</span>
            </div>

            {/* Download Slide Button bottom right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.success(`Downloading ${activeSlide.title}...`);
                downloadImage(activeSlide.imageUrl, getFilenameFromUrl(activeSlide.imageUrl, activeSlide.title));
              }}
              aria-label="Download Slide"
              className="absolute bottom-5 right-16 z-20 bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black p-2.5 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-100 md:scale-90 md:group-hover:scale-100"
            >
              <Download size={12} />
            </button>

            {/* Zoom / Lightbox Trigger Button bottom right */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Expand Widescreen Mode"
              className="absolute bottom-5 right-5 z-20 bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black p-2.5 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-100 md:scale-90 md:group-hover:scale-100"
            >
              <Maximize2 size={12} className="md:size-14" />
            </button>

            {/* Slider Navigation Chevrons (Desktop only) */}
            <button 
              onClick={() => paginate(-1)}
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => paginate(1)}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 hidden md:flex active:scale-95"
            >
              <ChevronRight size={20} />
            </button>

            {/* Main Slide view */}
            <div 
              className="relative w-full flex items-center justify-center min-h-[40vh] md:min-h-[60vh] max-h-[75vh] md:max-h-[80vh] p-2"
              onClick={(e) => {
                if (Math.abs(e.movementX || 0) < 5) {
                  setIsLightboxOpen(true);
                }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                >
                  <img
                    src={activeSlide.imageUrl}
                    alt={activeSlide.title || "Landscape photo print"}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl block pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23141414' width='100' height='100'/%3E%3C/svg%3E";
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Minimal Telemetry Ticks & Index indicators */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 font-mono text-[9px] text-neutral-500 mt-2 tracking-widest pointer-events-auto w-full max-w-5xl px-4 sm:px-0">
            <span className="hidden sm:inline font-bold">ZEISS LENS CHANNEL</span>
            <div className="flex items-center gap-1.5 h-6 max-w-[50vw] sm:max-w-none overflow-x-auto scrollbar-none py-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlide(idx);
                    pauseSlideshowTemporarily();
                  }}
                  className={`h-1.5 rounded transition-all duration-500 border cursor-pointer shrink-0 ${
                    idx === currentSlide 
                      ? 'w-10 bg-[#d4af37] border-transparent shadow-[0_0_10px_rgba(212,175,55,0.35)]' 
                      : 'w-4 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <span className="text-[#d4af37] font-black shrink-0">CH 0{currentSlide + 1} / 0{slides.length}</span>
          </div>

        </motion.div>
      </div>

      {/* Viewfinder Field Monitor Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          >
            {/* Soft gold ambient glow backdrop */}
            <div className="absolute w-[60%] h-[60%] rounded-full bg-[#d4af37]/5 blur-[120px] pointer-events-none z-0" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              className="relative w-full max-w-[94vw] md:max-w-[85vw] lg:max-w-5xl max-h-[90vh] flex flex-col bg-neutral-950 border border-neutral-900 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden p-4 md:p-6 z-10"
            >
              {/* Close Button Dial */}
              <button
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close Widescreen View"
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Download Image Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.success(`Downloading ${activeSlide.title}...`);
                  downloadImage(activeSlide.imageUrl, getFilenameFromUrl(activeSlide.imageUrl, activeSlide.title));
                }}
                aria-label="Download Image"
                className="absolute top-4 right-14 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Lightbox Monitor Framing */}
              <div className="relative flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden rounded-xl bg-neutral-950 border border-neutral-900 p-2 md:p-4">
                
                {/* Rule of thirds */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10">
                  <div className="absolute top-1/3 left-0 right-0 h-[1px] border-t border-dashed border-white" />
                  <div className="absolute top-2/3 left-0 right-0 h-[1px] border-t border-dashed border-white" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-[1px] border-l border-dashed border-white" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-[1px] border-l border-dashed border-white" />
                </div>

                {/* Viewfinder Corner Framing Brackets */}
                <div className="absolute inset-4 pointer-events-none z-10 opacity-30">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37]" />
                </div>

                {/* Lightbox Slide View */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={activeSlide.imageUrl}
                      alt={activeSlide.title || "Widescreen landscape photo print"}
                      className="max-w-full max-h-[58vh] md:max-h-[64vh] object-contain block pointer-events-none"
                    />
                  </motion.div>
                </AnimatePresence>
                       {/* Zeiss Exif Hud overlay top left (Hidden on mobile/tablet to prevent obscuring image) */}
                <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#d4af37]/30 text-[9px] sm:text-xs font-mono text-gray-300 tracking-widest shadow-[0_4px_15px_rgba(0,0,0,0.6)] z-10 hidden md:flex items-center gap-2 pointer-events-none">
                  <span className="text-[#d4af37] font-black uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    VIVO X300 • ZEISS
                  </span>
                  <span>{getExifData(activeSlide.id)}</span>
                </div>
                
                {/* Field Monitor telemetry tag top right */}
                <div className="absolute top-4 right-14 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-900 text-[8px] sm:text-[9px] font-mono text-neutral-500 tracking-widest shadow-lg hidden sm:flex items-center gap-1.5 uppercase font-bold pointer-events-none">
                  <span className="border border-neutral-600 px-1 py-0.2 rounded text-[7px] text-neutral-400">AF-C</span>
                  <span>14BIT RAW</span>
                </div>
 
                {/* Slider Side Chevrons inside lightbox (Desktop only) */}
                <button 
                  onClick={() => paginate(-1)}
                  aria-label="Previous Slide"
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all hidden md:flex active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => paginate(1)}
                  aria-label="Next Slide"
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all hidden md:flex active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
 
              {/* Lightbox Description label */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-none pt-5 text-white flex flex-col gap-2 text-left font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[8px] sm:text-[9px] font-black text-neutral-500 tracking-widest uppercase">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[#d4af37]/80">LANDSCAPES EXPEDITION</span>
                    <span className="md:hidden text-[#d4af37] font-bold">• {getExifData(activeSlide.id)}</span>
                  </div>
                  <span>SYSTEM LOG: MONITOR CH 0{currentSlide + 1}</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase">{activeSlide.title}</h3>
                
                {activeSlide.description && (
                  <p className="text-sm text-neutral-400 font-medium tracking-wider font-sans leading-relaxed mt-1">{activeSlide.description}</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
