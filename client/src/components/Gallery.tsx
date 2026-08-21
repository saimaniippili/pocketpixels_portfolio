import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { X, Loader2, Maximize2, ChevronLeft, ChevronRight, Images, Download } from 'lucide-react';
import { useGalleryData } from '@/hooks/useGalleryData';
import { downloadImage, getFilenameFromUrl } from '@/lib/utils';
import { toast } from 'sonner';

const filters = ['ALL', 'STREETS', 'LANDSCAPES', 'MOMENTS'];

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

// Self-contained GalleryCard sub-component to isolate hover-autoplay state for smooth grid reflows
interface GalleryCardProps {
  image: any;
  onClick: () => void;
}

function GalleryCard({ image, onClick }: GalleryCardProps) {
  const isCarousel = image.imageUrl.startsWith('["');
  const isLandscape = image.category.toLowerCase() === 'landscapes';
  const cardAspectClass = isLandscape ? 'aspect-[16/9]' : 'aspect-[4/5]';
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);

  let urls: string[] = [];
  if (isCarousel) {
    try {
      urls = JSON.parse(image.imageUrl) as string[];
    } catch (e) {}
  }

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    if (!showDownloadMenu) return;
    const handleOutsideClick = () => setShowDownloadMenu(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showDownloadMenu]);

  const handleDownloadIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCarousel && urls.length > 1) {
      setShowDownloadMenu((prev) => !prev);
    } else {
      toast.success(`Downloading ${image.title}...`);
      downloadImage(image.imageUrl, getFilenameFromUrl(image.imageUrl, image.title));
    }
  };

  const handleDownloadCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadMenu(false);
    const currentUrl = urls[activeSlide];
    toast.success(`Downloading slide ${activeSlide + 1} of ${image.title}...`);
    downloadImage(currentUrl, getFilenameFromUrl(currentUrl, `${image.title}_slide_${activeSlide + 1}`));
  };

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadMenu(false);
    toast.success(`Starting download of all ${urls.length} images from ${image.title}...`);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      downloadImage(url, getFilenameFromUrl(url, `${image.title}_slide_${i + 1}`));
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  };

  // Detect mobile viewports
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay slideshow loop (On mobile it always cycles automatically, on desktop only on hover unless manually paused)
  useEffect(() => {
    if (!isCarousel || urls.length <= 1) return;
    if (isManuallyControlled) return;
    if (!isMobile && !isHovered) return;
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % urls.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isCarousel, isHovered, isMobile, urls.length, isManuallyControlled]);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveSlide(0);
    setIsManuallyControlled(false); // Resume autoplay capability next time
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="break-inside-avoid group relative overflow-hidden bg-neutral-950 border border-[#d4af37]/25 hover:border-[#d4af37]/65 cursor-pointer w-full flex flex-col rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_28px_rgba(212,175,55,0.15)] transition-all duration-300 select-none mb-3 md:mb-6"
    >
      {/* Photo Container */}
      <div className="relative w-full overflow-hidden bg-neutral-950">
        {isCarousel && urls.length > 0 ? (
          <div className={`relative w-full ${cardAspectClass} overflow-hidden bg-neutral-950`}>
            {/* Swipable controlled drag viewport on mobile, absolute fade slideshow on desktop */}
            {isMobile ? (
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) {
                    setActiveSlide((prev) => (prev + 1) % urls.length);
                    setIsManuallyControlled(true);
                  } else if (info.offset.x > swipeThreshold) {
                    setActiveSlide((prev) => (prev - 1 + urls.length) % urls.length);
                    setIsManuallyControlled(true);
                  }
                }}
                className="w-full h-full absolute inset-0 bg-neutral-950 cursor-grab active:cursor-grabbing touch-pan-y"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeSlide}
                    src={urls[activeSlide]}
                    alt={`${image.title} slide ${activeSlide + 1}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="w-full h-full object-cover absolute inset-0 block grayscale-[20%] pointer-events-none select-none"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23141414' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23d4af37'%3EIMAGE%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </AnimatePresence>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide}
                  src={urls[activeSlide]}
                  alt={image.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover absolute inset-0 block grayscale-[20%] group-hover:grayscale-0"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23141414' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23d4af37'%3EIMAGE%3C/text%3E%3C/svg%3E";
                  }}
                />
              </AnimatePresence>
            )}

            {/* Carousel Type Badge */}
            <div className="absolute top-3 left-3 bg-[#d4af37] text-black px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase flex items-center gap-1 z-10 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              GROUP
            </div>

            {/* Left/Right manual slide flipping chevrons (Desktop only on hover) */}
            {isCarousel && urls.length > 1 && !isMobile && isHovered && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering card fullscreen lightbox click
                    setActiveSlide((prev) => (prev - 1 + urls.length) % urls.length);
                    setIsManuallyControlled(true); // Halt autoplay loop
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center cursor-pointer transition-all z-20 active:scale-90"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering card fullscreen lightbox click
                    setActiveSlide((prev) => (prev + 1) % urls.length);
                    setIsManuallyControlled(true); // Halt autoplay loop
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center cursor-pointer transition-all z-20 active:scale-90"
                >
                  <ChevronRight size={12} />
                </button>
              </>
            )}

            {/* Miniature index dots inside the grid card */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
              {urls.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === activeSlide ? 'w-3.5 bg-[#d4af37]' : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full h-auto block transition-all duration-500 grayscale-[20%] group-hover:grayscale-0 group-hover:scale-103"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23141414' width='100' height='100'/%3E%3C/svg%3E";
              }}
            />
          </>
        )}
        
        {/* Viewfinder overlay corners on card hover */}
        <div className="absolute inset-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#d4af37]" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#d4af37]" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#d4af37]" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#d4af37]" />
        </div>

        {/* Magnifier Icon in Top Right */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-[#d4af37]/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-10">
          <Maximize2 size={10} className="text-[#d4af37]" />
        </div>
      </div>

      {/* Telemetry Exif Bottom Block (Exhibition label style) */}
      <div className="p-3 md:p-4 bg-[#111111] border-t border-neutral-900/60 flex flex-col font-mono relative z-20">
        <div className="flex justify-between items-center text-[7px] md:text-[8px] font-black text-neutral-500 tracking-widest uppercase">
          <span className="text-[#d4af37]/80">{image.category}</span>
          <span className="flex items-center gap-1">
            {isCarousel && <Images size={10} className="text-[#d4af37]/75" />}
            {isCarousel ? 'ZEISS GROUP' : 'ZEISS SINGLE'}
          </span>
        </div>
        <h3 className="text-[10px] md:text-xs font-black text-white tracking-widest mt-1 uppercase truncate">{image.title}</h3>
        
        {/* Exif data readout */}
        <div className="text-[7px] md:text-[8px] text-neutral-500 mt-1.5 pt-1.5 border-t border-neutral-900 flex items-center justify-between gap-1 uppercase font-bold tracking-normal sm:tracking-wider min-w-0 overflow-hidden relative">
          <span className="truncate block w-[85%]">{getExifData(image.id)}</span>
          <div className="relative z-30">
            <button
              onClick={handleDownloadIconClick}
              className="text-[#d4af37] hover:text-white transition-colors p-1 rounded hover:bg-neutral-800 flex items-center justify-center cursor-pointer"
              title="Download image"
            >
              <Download size={10} />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 bottom-6 z-40 w-32 bg-neutral-950 border border-[#d4af37]/35 rounded-lg shadow-xl backdrop-blur-md flex flex-col py-1 text-[8px] font-mono tracking-wider">
                <button
                  onClick={handleDownloadCurrent}
                  className="text-left px-2.5 py-1.5 hover:bg-[#d4af37]/15 hover:text-[#d4af37] text-gray-300 font-bold transition-all cursor-pointer"
                >
                  SELECT PHOTO
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="text-left px-2.5 py-1.5 hover:bg-[#d4af37]/15 hover:text-[#d4af37] border-t border-neutral-900 text-gray-300 font-bold transition-all cursor-pointer"
                >
                  FULL ALBUM ({urls.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Gallery() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [activeLightboxSlide, setActiveLightboxSlide] = useState(0);
  const [showLightboxDownloadMenu, setShowLightboxDownloadMenu] = useState(false);

  useEffect(() => {
    if (!showLightboxDownloadMenu) return;
    const handleOutsideClick = () => setShowLightboxDownloadMenu(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showLightboxDownloadMenu]);

  const { ref, inView } = useInView({
    threshold: 0.05,
    triggerOnce: true,
  });

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset active slide when selected image changes
  useEffect(() => {
    setActiveLightboxSlide(0);
  }, [selectedImage]);

  // Fetch gallery images (environment aware)
  const { data: images = [], isLoading } = useGalleryData();

  // Filter images based on active filter
  const filteredImages = images.filter((img) => {
    if (activeFilter === 'ALL') return true;
    return img.category.toUpperCase() === activeFilter;
  });

  // Carousel modal navigation chevrons pagination
  const handleLightboxPaginate = (direction: number, totalSlides: number) => {
    if (totalSlides <= 1) return;
    setActiveLightboxSlide((prev) => (prev + direction + totalSlides) % totalSlides);
  };

  const handleDragEnd = (e: any, { offset, velocity }: any, totalSlides: number) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold) {
      handleLightboxPaginate(1, totalSlides);
    } else if (offset.x > swipeThreshold) {
      handleLightboxPaginate(-1, totalSlides);
    }
  };

  return (
    <section
      id="gallery"
      ref={ref}
      className="relative py-28 px-4 md:px-8 bg-black pixel-grid select-none border-t border-neutral-950"
    >
      {/* Viewfinder crosshairs framing the gallery section */}
      <div className="absolute inset-x-8 inset-y-12 pointer-events-none z-10 opacity-15">
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#d4af37]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-20">
        
        {/* Section Header with monospaced accents */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col items-start text-left gap-6"
        >
          {/* Section Indicator Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4af37]/20 bg-neutral-900/60 backdrop-blur-md text-[9px] md:text-[10px] tracking-[0.25em] text-[#d4af37] font-black uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            [•] PORTFOLIO PRINT CATALOGUE
          </div>

          <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none uppercase">
              VISUAL<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7d070] to-[#d4af37] text-red-accent font-black">GALLERY</span>
            </h2>

            {/* Filter Navigation */}
            <div className="flex gap-2 flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 md:px-5 py-2 md:py-2.5 font-mono text-[9px] md:text-xs font-black tracking-widest border transition-all rounded-lg flex items-center gap-2 ${
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#e6c200] text-black border-transparent shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-neutral-950 text-[#d4af37] border-[#d4af37]/35 hover:bg-[#d4af37]/10'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${activeFilter === filter ? 'bg-black' : 'bg-[#d4af37] animate-ping'}`} />
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#d4af37]" size={48} />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20 bg-neutral-950/40 rounded-2xl border border-neutral-900">
            <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">No catalogued images available in this category</p>
          </div>
        ) : (
          /* Masonry Grid - 2 columns on mobile, 3 on md, 4 on lg */
          <div className="w-full columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-6">
            <AnimatePresence>
              {filteredImages.map((image) => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Viewfinder-Style Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (() => {
          const isCarouselLightbox = selectedImage.imageUrl.startsWith('["');
          let urls: string[] = [];
          if (isCarouselLightbox) {
            try {
              urls = JSON.parse(selectedImage.imageUrl) as string[];
            } catch (e) {}
          }
          const totalSlides = urls.length;
          const displayImage = isCarouselLightbox ? urls[activeLightboxSlide] : selectedImage.imageUrl;

          const handleLightboxDownloadClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isCarouselLightbox && urls.length > 1) {
              setShowLightboxDownloadMenu((prev) => !prev);
            } else {
              toast.success(`Downloading ${selectedImage.title}...`);
              downloadImage(selectedImage.imageUrl, getFilenameFromUrl(selectedImage.imageUrl, selectedImage.title));
            }
          };

          const handleLightboxDownloadCurrent = (e: React.MouseEvent) => {
            e.stopPropagation();
            setShowLightboxDownloadMenu(false);
            const currentUrl = urls[activeLightboxSlide];
            toast.success(`Downloading slide ${activeLightboxSlide + 1} of ${selectedImage.title}...`);
            downloadImage(currentUrl, getFilenameFromUrl(currentUrl, `${selectedImage.title}_slide_${activeLightboxSlide + 1}`));
          };

          const handleLightboxDownloadAll = async (e: React.MouseEvent) => {
            e.stopPropagation();
            setShowLightboxDownloadMenu(false);
            toast.success(`Starting download of all ${urls.length} images from ${selectedImage.title}...`);
            for (let i = 0; i < urls.length; i++) {
              const url = urls[i];
              downloadImage(url, getFilenameFromUrl(url, `${selectedImage.title}_slide_${i + 1}`));
              await new Promise((resolve) => setTimeout(resolve, 400));
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 font-mono"
            >
              {/* Cinematic background glow matching visual style */}
              <div className="absolute w-[60%] h-[60%] rounded-full bg-[#d4af37]/5 blur-[120px] pointer-events-none z-0" />

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[94vw] md:max-w-[85vw] lg:max-w-5xl max-h-[90vh] flex flex-col bg-neutral-950 border border-[#d4af37]/25 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden p-4 md:p-6 z-10"
              >
                {/* Close Button Dial */}
                <button
                  onClick={() => setSelectedImage(null)}
                  aria-label="Close Viewfinder"
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Download Button Dial */}
                <div className="absolute top-4 right-14 z-20">
                  <button
                    onClick={handleLightboxDownloadClick}
                    aria-label="Download Image"
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-[#d4af37] border border-[#d4af37]/35 text-white hover:text-black flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {showLightboxDownloadMenu && (
                    <div className="absolute right-0 top-10 z-40 w-32 bg-neutral-950 border border-[#d4af37]/35 rounded-lg shadow-xl backdrop-blur-md flex flex-col py-1 text-[8px] font-mono tracking-wider">
                      <button
                        onClick={handleLightboxDownloadCurrent}
                        className="text-left px-2.5 py-1.5 hover:bg-[#d4af37]/15 hover:text-[#d4af37] text-gray-300 font-bold transition-all cursor-pointer"
                      >
                        SELECT PHOTO
                      </button>
                      <button
                        onClick={handleLightboxDownloadAll}
                        className="text-left px-2.5 py-1.5 hover:bg-[#d4af37]/15 hover:text-[#d4af37] border-t border-neutral-900 text-gray-300 font-bold transition-all cursor-pointer"
                      >
                        FULL ALBUM ({urls.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Viewfinder Field Monitor Framing */}
                <div className="relative flex-1 flex items-center justify-center min-h-[40vh] md:min-h-[55vh] max-h-[64vh] overflow-hidden rounded-xl bg-neutral-950 border border-neutral-900/60 p-2 md:p-4">
                  
                  {/* Rule of thirds for Lightbox */}
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

                  {/* Left / Right slider paginations inside Lightbox (for Carousel cards only) */}
                  {isCarouselLightbox && totalSlides > 1 && (
                    <>
                      <button 
                        onClick={() => handleLightboxPaginate(-1, totalSlides)}
                        aria-label="Previous Slide"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all active:scale-95 z-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => handleLightboxPaginate(1, totalSlides)}
                        aria-label="Next Slide"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg bg-black/60 border border-neutral-800 text-white hover:text-[#d4af37] hover:border-[#d4af37]/40 flex items-center justify-center cursor-pointer transition-all active:scale-95 z-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}

                  {/* Main Lightbox Image Viewport with stable outer drag tracker and child fade transitions */}
                  {isCarouselLightbox && totalSlides > 1 ? (
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.25}
                      onDragEnd={(e, info) => handleDragEnd(e, info, totalSlides)}
                      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing relative z-0"
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activeLightboxSlide}
                          src={displayImage}
                          alt={selectedImage.title}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="max-w-full max-h-[50vh] md:max-h-[58vh] object-contain block pointer-events-none select-none"
                        />
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.title}
                      className="w-full h-full object-contain max-h-[50vh] md:max-h-[58vh] relative z-0 pointer-events-none select-none"
                    />
                  )}
                  
                  {/* Zeiss Exif Hud overlay top left (Hidden on mobile/tablet to prevent obscuring image) */}
                  <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#d4af37]/30 text-[9px] sm:text-xs font-mono text-gray-300 tracking-widest shadow-[0_4px_15px_rgba(0,0,0,0.6)] z-10 hidden md:flex items-center gap-2 pointer-events-none">
                    <span className="text-[#d4af37] font-black uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      VIVO X300 • ZEISS
                    </span>
                    <span>{getExifData(selectedImage.id)}</span>
                  </div>
                  
                  {/* Field Monitor telemetry tag top right */}
                  <div className="absolute top-4 right-14 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-900 text-[8px] sm:text-[9px] font-mono text-neutral-500 tracking-widest shadow-lg hidden sm:flex items-center gap-1.5 uppercase font-bold pointer-events-none">
                    <span className="border border-neutral-600 px-1 py-0.2 rounded text-[7px] text-neutral-400">AF-C</span>
                    <span>14BIT RAW</span>
                  </div>
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
                      <span className="text-[#d4af37]/80">{selectedImage.category} EXPENDITURE</span>
                      <span className="md:hidden text-[#d4af37] font-bold">• {getExifData(selectedImage.id)}</span>
                    </div>
                    <span>
                      {isCarouselLightbox 
                        ? `SYSTEM LOG: GROUP SLIDE CH 0${activeLightboxSlide + 1} / 0${totalSlides}` 
                        : 'SYSTEM LOG: CATALOGUED'
                      }
                    </span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase">{selectedImage.title}</h3>
                  
                  {selectedImage.description && (
                    <p className="text-sm text-neutral-400 font-medium tracking-wider font-sans leading-relaxed mt-1">{selectedImage.description}</p>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
