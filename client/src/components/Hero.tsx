import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CameraLens3D } from './CameraLens3D';
import { useGalleryData } from '@/hooks/useGalleryData';
import { Download } from 'lucide-react';
import { downloadImage, getFilenameFromUrl } from '@/lib/utils';
import { toast } from 'sonner';

export function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [topCardIndex, setTopCardIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [windowHeight, setWindowHeight] = useState(800);
  const [hudX, setHudX] = useState(0);
  const [hudY, setHudY] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Fetch gallery images (environment aware)
  const { data: dbImages = [] } = useGalleryData();

  // Initialize coordinates, viewport size, and event trackers
  useEffect(() => {
    setIsLoaded(true);

    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      setIsMobile(window.innerWidth < 1024);
      
      // Default initial center coordinates
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
      
      const handleResize = () => {
        setWindowHeight(window.innerHeight);
        setIsMobile(window.innerWidth < 1024);
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        setIsInteracting(true);
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        setIsInteracting(true);
        if (e.touches.length > 0) {
          mouseX.set(e.touches[0].clientX);
          mouseY.set(e.touches[0].clientY);
        }
      };
      
      const handleTouchStart = (e: TouchEvent) => {
        setIsInteracting(true);
        if (e.touches.length > 0) {
          mouseX.set(e.touches[0].clientX);
          mouseY.set(e.touches[0].clientY);
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, [mouseX, mouseY]);

  // Sinusoidal Focus Autopilot when inactive
  useEffect(() => {
    if (isInteracting) return;
    
    let animationFrameId: number;
    const startTime = Date.now();
    
    const animateAutopilot = () => {
      if (typeof window === 'undefined') return;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const cx = width / 2;
      const cy = height / 2;
      
      const rx = Math.min(width * 0.12, 160);
      const ry = Math.min(height * 0.12, 90);
      
      const x = cx + Math.sin(elapsed * 0.7) * rx;
      const y = cy + Math.sin(elapsed * 1.4) * ry;
      
      mouseX.set(x);
      mouseY.set(y);
      
      animationFrameId = requestAnimationFrame(animateAutopilot);
    };

    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animateAutopilot);
    }, 1200);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInteracting, mouseX, mouseY]);

  // Sync state variables with motion values for the HUD
  useEffect(() => {
    const unsubscribeX = cursorX.on('change', (v) => setHudX(Math.round(v)));
    const unsubscribeY = cursorY.on('change', (v) => setHudY(Math.round(v)));
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [cursorX, cursorY]);

  const rollY = useTransform(cursorY, [0, windowHeight || 800], [-48, 48]);
  const evY = useTransform(cursorY, [0, windowHeight || 800], [48, -48]);

  const triggerShutter = () => {
    setShutterFlash(true);
    setTimeout(() => {
      setShutterFlash(false);
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleCardDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    const velocityThreshold = 400;
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      setTopCardIndex((prev) => (prev + 1) % stackImages.length);
    }
  };

  // Helper to generate EXIF dynamically for custom uploaded images
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

  // Three beautiful default images if no hero cards exist in the DB
  const defaultStackImages = [
    {
      id: 0,
      src: '/exported-images/8_radiance.jpg',
      title: 'RADIANCE',
      exif: 'ISO 100 • f/1.8 • 1/250s • 50mm',
      category: 'MOMENTS',
      rotation: -8,
      xOffset: -25,
      yOffset: 10,
    },
    {
      id: 1,
      src: '/exported-images/10_silent_skies.png',
      title: 'SILENT SKIES',
      exif: 'ISO 200 • f/2.0 • 1/500s • 23mm',
      category: 'MOMENTS',
      rotation: 2,
      xOffset: 0,
      yOffset: -15,
    },
    {
      id: 2,
      src: '/exported-images/6_gentle_bloom.png',
      title: 'GENTLE BLOOM',
      exif: 'ISO 50 • f/2.4 • 1/1000s • 85mm',
      category: 'LANDSCAPES',
      rotation: 8,
      xOffset: 25,
      yOffset: 15,
    }
  ];

  // Filter and map database images in the 'hero' category dynamically, limiting to top 3 cards
  const heroDbImages = dbImages.filter((img) => img.category === 'hero').slice(0, 3);

  const stackImages = heroDbImages.length > 0
    ? heroDbImages.map((img, idx) => {
        const rotations = [-8, 2, 8, -5, 4, -2];
        const xOffsets = [-25, 0, 25, -15, 18, -8];
        const yOffsets = [10, -15, 15, -10, 8, -5];
        return {
          id: idx,
          src: img.imageUrl,
          title: img.title.toUpperCase(),
          exif: img.description || getExifData(img.id),
          category: 'HERO CARD',
          rotation: rotations[idx % rotations.length],
          xOffset: xOffsets[idx % xOffsets.length],
          yOffset: yOffsets[idx % yOffsets.length],
        };
      })
    : defaultStackImages;

  const getCardStyles = (relativeIndex: number) => {
    switch (relativeIndex) {
      case 0:
        return {
          zIndex: 30,
          scale: 1,
          rotate: 0,
          x: 0,
          y: 0,
          opacity: 1,
        };
      case 1:
        return {
          zIndex: 20,
          scale: 0.92,
          rotate: 4,
          x: 18,
          y: -12,
          opacity: 0.85,
        };
      case 2:
      default:
        return {
          zIndex: 10,
          scale: 0.84,
          rotate: -5,
          x: -18,
          y: -24,
          opacity: 0.70,
        };
    }
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black pixel-grid select-none">
      {/* Dynamic 3D Camera Lenses Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <CameraLens3D />
      </div>

      {/* Shutter Camera Flash Effect Overlay */}
      <AnimatePresence>
        {shutterFlash && (
          <motion.div 
            className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Viewfinder Rule-of-Thirds Gridlines */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
        <div className="absolute top-1/3 left-0 right-0 h-[1px] border-t border-dashed border-[#d4af37]" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] border-t border-dashed border-[#d4af37]" />
        <div className="absolute left-1/3 top-0 bottom-0 w-[1px] border-l border-dashed border-[#d4af37]" />
        <div className="absolute left-2/3 top-0 bottom-0 w-[1px] border-l border-dashed border-[#d4af37]" />
      </div>

      {/* Viewfinder Four Corner Brackets */}
      <div className="absolute inset-4 md:inset-8 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 md:w-8 h-8 border-t-2 border-l-2 border-[#d4af37]/30" />
        <div className="absolute top-0 right-0 w-6 h-6 md:w-8 h-8 border-t-2 border-r-2 border-[#d4af37]/30" />
        <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 h-8 border-b-2 border-l-2 border-[#d4af37]/30" />
        <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 h-8 border-b-2 border-r-2 border-[#d4af37]/30" />
      </div>

      {/* Viewfinder Left Pitch Roll Level Meter (Desktop only) */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-2 font-mono text-[8px] text-neutral-600">
        <span>+90°</span>
        <div className="h-32 w-[2px] bg-neutral-800 relative flex items-center justify-center">
          <motion.div 
            className="absolute w-4 h-[2px] bg-[#d4af37]"
            style={{ y: rollY }}
          />
        </div>
        <span>-90°</span>
        <span className="text-[7px] text-[#d4af37]/50 font-black tracking-widest mt-1">ROLL</span>
      </div>

      {/* Viewfinder Right Exposure Level Scale (Desktop only) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-2 font-mono text-[8px] text-neutral-600">
        <span>+2.0</span>
        <div className="h-32 w-[2px] bg-neutral-800 relative flex items-center justify-center">
          <motion.div 
            className="absolute w-4 h-[2px] bg-[#d4af37]"
            style={{ y: evY }}
          />
        </div>
        <span>-2.0</span>
        <span className="text-[7px] text-[#d4af37]/50 font-black tracking-widest mt-1">EV</span>
      </div>

      {/* Viewfinder HUD Text - Top Left */}
      <div className="absolute top-6 md:top-12 left-6 md:left-12 z-10 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-500 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-red-500 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          REC [•]
        </div>
        <div className="hidden sm:block">STILL MODE: PRO</div>
        <div>RAW 14BIT • 3:2</div>
      </div>

      {/* Viewfinder HUD Text - Top Right */}
      <div className="absolute top-6 md:top-12 right-6 md:right-12 z-10 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-500 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="border border-neutral-600 px-1 py-0.5 rounded-[2px] text-[6px] md:text-[7px] font-black text-neutral-400">AF-C</span>
          <span className="hidden sm:inline">ZEISS T*</span>
        </div>
        <div>BATTERY 98% [||||]</div>
        <div className="text-[#d4af37] font-bold">VIVO X300 SERIES</div>
      </div>

      {/* Viewfinder HUD Text - Bottom Left */}
      <div className="absolute bottom-6 md:bottom-12 left-6 md:left-12 z-10 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-500 flex flex-col gap-1.5">
        <div>FOCUS LOCK COORDINATES</div>
        <div className="text-white font-black tracking-widest">X: {hudX}px • Y: {hudY}px</div>
        <div className="flex items-center gap-1 text-[#d4af37]/70 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
          AUTOFOCUS ACTIVE
        </div>
      </div>

      {/* Viewfinder HUD Text - Bottom Right */}
      <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-10 font-mono text-[8px] md:text-[9px] tracking-widest text-neutral-500 flex flex-col items-end gap-1.5">
        <div className="hidden sm:block">ZEISS PRO PRESETS</div>
        <div className="flex items-center gap-2 text-white font-bold">
          <span>ISO 100</span>
          <span>•</span>
          <span>f/1.8</span>
          <span>•</span>
          <span className="text-[#d4af37]">EV +0.3</span>
        </div>
        <div>1/250s SHUTTER</div>
      </div>

      {/* Interactive Cursor Reticle Overlay */}
      <motion.div 
        className="absolute pointer-events-none z-20 flex items-center justify-center"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="relative w-12 h-12 md:w-16 h-16 border border-[#d4af37]/45 flex items-center justify-center">
          <div className="absolute w-2 md:w-3 h-[1px] bg-[#d4af37]" />
          <div className="absolute h-2 md:h-3 w-[1px] bg-[#d4af37]" />
          <span className="absolute -bottom-4 md:-bottom-5 text-[6px] md:text-[7px] font-mono tracking-widest text-[#d4af37]/75 font-bold uppercase whitespace-nowrap">
            ZEISS TRACKING
          </span>
        </div>
      </motion.div>

      {/* Hero Page Core Grid Layout */}
      <div className="container mx-auto px-6 md:px-12 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center py-20 lg:py-0 min-h-screen">
        
        {/* Left Column: Branding, Typography, CTA */}
        <div className="lg:col-span-7 flex flex-col items-start gap-6 md:gap-8 text-left mt-8 sm:mt-12 lg:mt-0">
          
          {/* Zeiss Certified Optics Tag */}
          <motion.div 
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[#d4af37]/20 bg-neutral-900/70 backdrop-blur-md text-[9px] md:text-xs font-black tracking-widest text-[#d4af37]"
            initial={{ opacity: 0, y: -20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            ZEISS CO-ENGINEERED LENS SYSTEM
          </motion.div>

          {/* Core Title */}
          <div className="flex flex-col gap-1 md:gap-2">
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none uppercase select-none text-white"
              initial={{ opacity: 0, x: -50 }}
              animate={isLoaded ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              POCKET<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f5d782] to-[#d4af37] text-red-accent">PIXELS</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-neutral-400 text-xs md:text-base max-w-lg leading-relaxed font-medium tracking-wider"
            initial={{ opacity: 0, x: -30 }}
            animate={isLoaded ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            An interactive mobile photography showcase documenting culture, stories, and landscapes, shot with high-fidelity camera optics.
          </motion.p>

          {/* Controls CTA (Single brutalist Action Button) */}
          <motion.div
            className="flex items-center gap-4 sm:gap-6 mt-2 md:mt-4"
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <button 
              onClick={triggerShutter}
              className="brutal-button flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#d4af37]/10 to-transparent hover:from-[#d4af37]/25 border border-[#d4af37] text-[#d4af37] px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black tracking-widest text-[10px] sm:text-xs uppercase"
            >
              EXPLORE GALLERY
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            </button>
          </motion.div>
        </div>

        {/* Right Column: Layered Swipeable/Hoverable Print Stack */}
        <div className="lg:col-span-5 relative w-full h-[360px] md:h-[450px] flex flex-col items-center justify-center mt-6 sm:mt-12 lg:mt-0">
          
          {/* Print Stack Container (Clears hover smoothly on leaving the entire deck) */}
          <div 
            className="relative w-[230px] md:w-[320px] h-[310px] md:h-[380px]"
            onMouseLeave={() => !isMobile && setHoveredCard(null)}
          >
            {stackImages.map((img, idx) => {
              // Circular index position for Mobile Swipe
              const relativeIndex = (img.id - topCardIndex + stackImages.length) % stackImages.length;
              
              // Device aware parameter routing
              const isTop = isMobile ? (relativeIndex === 0) : false;
              const isHovered = !isMobile && (hoveredCard === img.id);

              // Calculate transforms dynamically
              let targetRotate = img.rotation;
              let targetX = img.xOffset;
              let targetY = img.yOffset;
              let targetScale = 1;
              let targetOpacity = 1;
              let targetZIndex = 10 + idx;

              if (isMobile) {
                const cardStyles = getCardStyles(relativeIndex);
                targetRotate = cardStyles.rotate;
                targetX = cardStyles.x;
                targetY = cardStyles.y;
                targetScale = cardStyles.scale;
                targetOpacity = cardStyles.opacity;
                targetZIndex = cardStyles.zIndex;
              } else {
                // Desktop STABLE (locked position) hover to completely eliminate flickering
                if (isHovered) {
                  targetScale = 1.06; // Scale up gently in place
                  targetZIndex = 40;  // Lift card to the top
                } else if (hoveredCard !== null) {
                  targetOpacity = 0.55; // Dim the other non-hovered cards beautifully
                }
              }

              const showEXIF = isMobile ? (relativeIndex === 0) : isHovered;

              return (
                <motion.div
                  key={img.id}
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1.1}
                  onDragEnd={isTop ? handleCardDragEnd : undefined}
                  className={`absolute inset-0 bg-white p-2.5 md:p-3 pb-12 md:pb-16 rounded-xl md:rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col ${
                    isMobile ? (isTop ? 'cursor-grab active:cursor-grabbing' : 'cursor-default') : 'cursor-pointer'
                  }`}
                  style={{
                    zIndex: targetZIndex,
                    transformOrigin: 'center center',
                  }}
                  animate={{
                    rotate: targetRotate,
                    x: targetX,
                    y: targetY,
                    scale: targetScale,
                    opacity: targetOpacity,
                    boxShadow: (isMobile ? isTop : isHovered)
                      ? '0 20px 45px rgba(212, 175, 55, 0.35), 0 0 30px rgba(212, 175, 55, 0.15)'
                      : '0 10px 25px rgba(0,0,0,0.6)',
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 220, 
                    damping: 22,
                    opacity: { duration: 0.25 }
                  }}
                  onMouseEnter={!isMobile ? () => setHoveredCard(img.id) : undefined}
                  onClick={() => (isMobile ? isTop : true) && triggerShutter()}
                >
                  {/* Photo Print */}
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-neutral-950">
                    <img 
                      src={img.src} 
                      alt={img.title} 
                      className="w-full h-full object-cover grayscale-[15%] pointer-events-none select-none"
                    />
                    <div className="absolute inset-0 border border-black/10 rounded-lg pointer-events-none" />
                  </div>

                  {/* Print Title Bottom Board */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-white px-3 md:px-4 flex flex-col justify-center font-mono">
                    <div className="flex justify-between items-center text-[7px] md:text-[8px] font-bold text-neutral-400 tracking-wider">
                      <span className="text-[#d4af37] font-black">{img.category}</span>
                      <div className="flex items-center gap-1.5 z-30">
                        <span>ZEISS SYSTEM</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`Downloading ${img.title}...`);
                            downloadImage(img.src, getFilenameFromUrl(img.src, img.title));
                          }}
                          className="text-[#d4af37] hover:text-neutral-800 transition-colors p-0.5 rounded cursor-pointer flex items-center justify-center"
                          title="Download Image"
                        >
                          <Download size={10} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-[10px] md:text-xs font-black text-neutral-800 tracking-widest mt-0.5 uppercase truncate">{img.title}</h3>
                  </div>

                  {/* Glassmorphic EXIF Overlay - Device optimized triggers */}
                  <AnimatePresence>
                    {showEXIF && (
                      <motion.div 
                        className="absolute top-4 left-4 right-4 bg-black/85 backdrop-blur-md border border-[#d4af37]/35 p-2 md:p-3 rounded-lg md:rounded-xl flex flex-col pointer-events-none"
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-[6px] md:text-[7px] text-[#d4af37] font-black tracking-widest">ZEISS CERTIFIED OPTICS</span>
                        <span className="text-[8px] md:text-[9px] text-white font-bold tracking-widest mt-1">{img.exif}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Device adaptive micro-guide help text indicators */}
          <div className="mt-8 font-mono text-[8px] text-[#d4af37]/65 font-black tracking-[0.2em] flex items-center gap-1.5 uppercase whitespace-nowrap">
            <span>{isMobile ? '← Swipe to Cycle' : '← Hover to Inspect'}</span>
            <span className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse" />
            <span>{isMobile ? 'Tap to Snap →' : 'Click to Snap →'}</span>
          </div>
        </div>

      </div>

      {/* Floating Scroll Indicator */}
      <motion.div
        className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="w-[1.5px] h-6 bg-gradient-to-b from-[#d4af37] to-transparent" />
          <p className="text-[7px] md:text-[8px] text-[#d4af37] font-black tracking-widest uppercase">SCROLL</p>
        </div>
      </motion.div>

    </section>
  );
}
