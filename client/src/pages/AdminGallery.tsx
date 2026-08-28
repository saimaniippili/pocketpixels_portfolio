import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Upload, Images, FileImage, AlertTriangle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { motion, Reorder, AnimatePresence } from "framer-motion";

// Premium browser-side image optimization to compress and resize large photo layers before uplink
const compressImage = (file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Bypass compression for animated GIFs or SVGs to preserve fidelity
    const type = file.type.toLowerCase();
    if (type.includes("gif") || type.includes("svg")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio scaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          file.type || "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Premium thumbnail generator to show instant previews for batch photo uploads
function BatchImagePreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string>("");
  
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!src) {
    return <div className="animate-pulse w-full h-full bg-neutral-900" />;
  }
  
}

// Premium Carousel Slide Drag-and-Drop Reorder Modal
function CarouselReorderModal({ 
  image, 
  isOpen, 
  onClose, 
  onSaved 
}: { 
  image: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onSaved: () => void; 
}) {
  const [slides, setSlides] = useState<{ url: string; key: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const updateMutation = trpc.gallery.update.useMutation();

  useEffect(() => {
    if (image) {
      try {
        const urls = JSON.parse(image.imageUrl) as string[];
        const keys = image.imageKey.startsWith('["')
          ? (JSON.parse(image.imageKey) as string[])
          : [image.imageKey];

        const mapped = urls.map((url, i) => ({
          url,
          key: keys[i] || "",
        }));
        setSlides(mapped);
      } catch (e) {
        console.error("Failed to parse carousel images for reordering", e);
      }
    }
  }, [image]);

  const handlePromote = (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    const target = newSlides[index];
    newSlides.splice(index, 1);
    newSlides.unshift(target);
    setSlides(newSlides);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    setSlides(newSlides);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error("Cannot delete the last slide. Delete the entire entry instead.");
      return;
    }
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const urls = slides.map(s => s.url);
      const keys = slides.map(s => s.key);

      await updateMutation.mutateAsync({
        id: image.id,
        imageUrl: JSON.stringify(urls),
        imageKey: JSON.stringify(keys),
      });

      toast.success("Carousel slide layout updated!");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(`Failed to update slides: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-4xl bg-neutral-950 border border-[#d4af37]/35 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden"
          >
            {/* Zeiss HUD elements */}
            <div className="absolute inset-2 pointer-events-none opacity-10">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]" />
            </div>

            <div className="flex justify-between items-center border-b border-neutral-900/60 pb-3 mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                TUNING CAROUSEL SLIDES: {image.title.toUpperCase()}
              </h3>
              <button onClick={onClose} className="text-xs text-neutral-500 hover:text-white uppercase font-black">
                [ CLOSE ]
              </button>
            </div>

            <p className="text-[10px] text-[#d4af37]/75 uppercase tracking-wider mb-4 leading-relaxed bg-[#d4af37]/5 border border-[#d4af37]/20 p-2.5 rounded-lg">
              💡 GRAB AND DRAG SLIDES TO REARRANGE THE VISUAL GRAPHIC TIMELINE. THE TOP CARD (POSITION ★ COVR) DEPICTS THE PORTFOLIO LANDING COVER LAYER.
            </p>

            <Reorder.Group 
              axis="y" 
              values={slides} 
              onReorder={setSlides} 
              className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2"
            >
              {slides.map((slide, index) => (
                <Reorder.Item 
                  value={slide} 
                  key={slide.key || slide.url} 
                  className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-neutral-900/20 hover:bg-neutral-900/40 border border-neutral-900/60 hover:border-[#d4af37]/35 rounded-xl cursor-grab active:cursor-grabbing transition-colors duration-200"
                >
                  <div className="text-[8px] sm:text-[9px] font-black text-neutral-500 w-6 sm:w-8 shrink-0 font-mono text-left">
                    {index === 0 ? "★" : `0${index + 1}`}
                  </div>
                  
                  <div className="w-12 h-9 sm:w-16 sm:h-12 rounded-lg bg-black border border-neutral-850 overflow-hidden shrink-0">
                    <img src={slide.url} className="w-full h-full object-cover" alt="Slide thumbnail" />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[9px] sm:text-[10px] text-white font-bold truncate max-w-[80px] sm:max-w-xs">{slide.url.split('/').pop()}</p>
                    <p className="text-[6px] sm:text-[7px] text-neutral-500 uppercase mt-0.5 font-bold tracking-wider">ZEISS CO-ENGINEERED OPTICS</p>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {index !== 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromote(index)}
                        className="border-[#d4af37]/35 text-[#d4af37] hover:bg-[#d4af37] hover:text-black text-[7px] sm:text-[8px] font-black tracking-widest px-2 py-1 h-auto rounded"
                      >
                        SET COVER
                      </Button>
                    )}
                    <div className="flex gap-0.5 sm:gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="border-neutral-850 text-white hover:border-[#d4af37]/45 text-[7px] sm:text-[8px] font-bold px-1.5 py-1 h-auto rounded disabled:opacity-30"
                      >
                        ▲
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === slides.length - 1}
                        className="border-neutral-850 text-white hover:border-[#d4af37]/45 text-[7px] sm:text-[8px] font-bold px-1.5 py-1 h-auto rounded disabled:opacity-30"
                      >
                        ▼
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSlide(index)}
                        className="border-red-900/50 text-red-500 hover:bg-red-950 hover:text-red-400 hover:border-red-500/50 text-[7px] sm:text-[8px] font-bold px-1.5 py-1 h-auto rounded ml-1"
                        title="Delete Slide"
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            <div className="flex gap-4 border-t border-neutral-900/60 pt-5 mt-6 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-neutral-800 text-neutral-400 hover:text-white text-xs font-black tracking-widest uppercase rounded-lg"
              >
                CANCEL
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="bg-[#d4af37] text-black hover:bg-[#d4af37]/90 text-xs font-black tracking-widest uppercase rounded-lg px-6"
              >
                {isSaving ? "SAVING LAYOUT..." : "SAVE REORDERED LAYOUT"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Premium Exhibition Category Timeline Reorder Modal
function CategoryReorderModal({ 
  category, 
  images, 
  isOpen, 
  onClose, 
  onSaved 
}: { 
  category: string; 
  images: any[]; 
  isOpen: boolean; 
  onClose: () => void; 
  onSaved: () => void; 
}) {
  const [cards, setCards] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const updateMutation = trpc.gallery.update.useMutation();

  useEffect(() => {
    if (category && images) {
      const filtered = images
        .filter(img => img.category === category)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      setCards(filtered);
    }
  }, [category, images]);

  const handlePromote = (index: number) => {
    if (index === 0) return;
    const newCards = [...cards];
    const target = newCards[index];
    newCards.splice(index, 1);
    newCards.unshift(target);
    setCards(newCards);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cards.length) return;
    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[targetIdx];
    newCards[targetIdx] = temp;
    setCards(newCards);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.info(`Syncing category displays...`);
      // Update each item displayOrder to equal its current drag index
      for (let i = 0; i < cards.length; i++) {
        await updateMutation.mutateAsync({
          id: cards[i].id,
          displayOrder: i,
        });
      }

      toast.success(`Successfully tuned the [${category.toUpperCase()}] exhibition sequence!`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(`Failed to update timeline: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-4xl bg-neutral-950 border border-[#d4af37]/35 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden"
          >
            {/* HUD brackets */}
            <div className="absolute inset-2 pointer-events-none opacity-10">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]" />
            </div>

            <div className="flex justify-between items-center border-b border-neutral-900/60 pb-3 mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                TUNING [{category.toUpperCase()}] EXHIBITION TIMELINE
              </h3>
              <button onClick={onClose} className="text-xs text-neutral-500 hover:text-white uppercase font-black">
                [ CLOSE ]
              </button>
            </div>

            <p className="text-[10px] text-[#d4af37]/75 uppercase tracking-wider mb-4 leading-relaxed bg-[#d4af37]/5 border border-[#d4af37]/20 p-2.5 rounded-lg">
              💡 GRAB AND DRAG ENTRIES TO SORT THE EXPENDITURE CATALOG. THIS REORDERS DYNAMIC LANDSCAPE SLIDESHOW CHANNELS OR HERO VISUAL CARD STACKS.
            </p>

            <Reorder.Group 
              axis="y" 
              values={cards} 
              onReorder={setCards} 
              className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2"
            >
              {cards.map((card, index) => {
                const isCarousel = card.imageUrl.startsWith('["');
                let displayUrl = card.imageUrl;
                let parsedLength = 1;
                if (isCarousel) {
                  try {
                    const parsed = JSON.parse(card.imageUrl) as string[];
                    displayUrl = parsed[0] || displayUrl;
                    parsedLength = parsed.length;
                  } catch (e) {}
                }

                return (
                  <Reorder.Item 
                    value={card} 
                    key={card.id} 
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-neutral-900/20 hover:bg-neutral-900/40 border border-neutral-900/60 hover:border-[#d4af37]/35 rounded-xl cursor-grab active:cursor-grabbing transition-colors duration-200"
                  >
                    <div className="text-[8px] sm:text-[9px] font-black text-neutral-500 w-6 sm:w-8 shrink-0 font-mono text-left">
                      {index === 0 ? "★" : `0${index + 1}`}
                    </div>
                    
                    <div className="w-12 h-9 sm:w-16 sm:h-12 rounded-lg bg-black border border-neutral-855 overflow-hidden shrink-0">
                      <img src={displayUrl} className="w-full h-full object-cover" alt="Card thumbnail" />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[9px] sm:text-[10px] text-white font-bold truncate max-w-[80px] sm:max-w-xs">{card.title.toUpperCase()}</p>
                      <p className="text-[6px] sm:text-[7px] text-[#d4af37]/75 uppercase mt-0.5 font-bold tracking-wider">
                        {isCarousel ? `CAROUSEL (${parsedLength})` : 'SINGLE PRINT'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {index !== 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromote(index)}
                          className="border-[#d4af37]/35 text-[#d4af37] hover:bg-[#d4af37] hover:text-black text-[7px] sm:text-[8px] font-black tracking-widest px-2 py-1 h-auto rounded"
                        >
                          PROMOTE
                        </Button>
                      )}
                      <div className="flex gap-0.5 sm:gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="border-neutral-850 text-white hover:border-[#d4af37]/45 text-[7px] sm:text-[8px] font-bold px-1.5 py-1 h-auto rounded disabled:opacity-30"
                        >
                          ▲
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === cards.length - 1}
                          className="border-neutral-850 text-white hover:border-[#d4af37]/45 text-[7px] sm:text-[8px] font-bold px-1.5 py-1 h-auto rounded disabled:opacity-30"
                        >
                          ▼
                        </Button>
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            <div className="flex gap-4 border-t border-neutral-900/60 pt-5 mt-6 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-neutral-800 text-neutral-400 hover:text-white text-xs font-black tracking-widest uppercase rounded-lg"
              >
                CANCEL
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="bg-[#d4af37] text-black hover:bg-[#d4af37]/90 text-xs font-black tracking-widest uppercase rounded-lg px-6"
              >
                {isSaving ? "SAVING ORDER..." : "SAVE TIMELINE ORDER"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminGallery() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "landscapes",
    displayOrder: 0,
  });
  
  // Upload configurations
  const [uploadMode, setUploadMode] = useState<'single' | 'carousel' | 'batch'>('single');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchTitles, setBatchTitles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Visual tactile drag-to-reorder dialog states
  const [reorderCarouselImage, setReorderCarouselImage] = useState<any | null>(null);
  const [reorderCategory, setReorderCategory] = useState<string | null>(null);

  // Fetch gallery images
  const { data: images = [], isLoading, refetch } = trpc.gallery.list.useQuery();
  
  // Upload mutation
  const uploadMutation = trpc.gallery.uploadImage.useMutation();

  // Create gallery entry mutation
  const createMutation = trpc.gallery.create.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress("");
      toast.error(`Failed to add entry: ${error.message}`);
    },
  });

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success("Image entry deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });

  const updateImageOrderMutation = trpc.gallery.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update display order: ${error.message}`);
    },
  });

  const shiftDisplayOrder = async (currentImage: typeof images[number], direction: 'up' | 'down') => {
    // 1. Find all images in the same category
    const categoryImages = images
      .filter(img => img.category === currentImage.category)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const currentIdx = categoryImages.findIndex(img => img.id === currentImage.id);
    if (currentIdx === -1) return;

    const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (swapIdx < 0 || swapIdx >= categoryImages.length) return;

    const swapImage = categoryImages[swapIdx];

    // Swap displayOrder values in database
    const tempOrder = currentImage.displayOrder;
    
    try {
      await updateImageOrderMutation.mutateAsync({
        id: currentImage.id,
        displayOrder: swapImage.displayOrder,
      });

      await updateImageOrderMutation.mutateAsync({
        id: swapImage.id,
        displayOrder: tempOrder,
      });

      toast.success(`Display order updated!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to identify active vs inactive hero cards in list
  const getHeroCardStatus = (imageId: number) => {
    // 1. Get all hero images
    const heroImages = images
      .filter(img => img.category === 'hero')
      // 2. Sort by displayOrder ascending
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    // 3. Find index of current image
    const idx = heroImages.findIndex(img => img.id === imageId);
    
    if (idx === -1) return null;
    
    return {
      isActive: idx < 3,
      slot: idx + 1,
    };
  };

  const moveFileInQueue = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedFiles.length) return;

    // Swap files
    const newFiles = [...selectedFiles];
    const tempFile = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = tempFile;
    setSelectedFiles(newFiles);

    // Swap titles if in batch mode
    if (uploadMode === 'batch') {
      const newTitles = [...batchTitles];
      const tempTitle = newTitles[index];
      newTitles[index] = newTitles[targetIdx];
      newTitles[targetIdx] = tempTitle;
      setBatchTitles(newTitles);
    }
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    
    const newFiles = [...selectedFiles];
    const targetFile = newFiles[index];
    
    // Remove from current position and insert at index 0
    newFiles.splice(index, 1);
    newFiles.unshift(targetFile);
    setSelectedFiles(newFiles);

    // Swap titles accordingly if in batch mode
    if (uploadMode === 'batch') {
      const newTitles = [...batchTitles];
      const targetTitle = newTitles[index];
      newTitles.splice(index, 1);
      newTitles.unshift(targetTitle);
      setBatchTitles(newTitles);
    }
  };

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-mono select-none">
        <div className="text-center p-8 border border-[#d4af37]/30 rounded-2xl bg-neutral-950/60 max-w-sm">
          <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-widest">ACCESS DENIED</h1>
          <p className="text-neutral-500 text-xs mb-6 uppercase tracking-wider">Please authenticate credentials to access transceiver panel</p>
          <Button 
            className="w-full bg-[#d4af37] text-black font-black hover:bg-[#d4af37]/90 text-xs tracking-widest"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            LOG IN TERMINAL
          </Button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-mono select-none">
        <div className="text-center p-8 border border-[#d4af37]/30 rounded-2xl bg-neutral-950/60 max-w-sm">
          <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-widest">UNAUTHORIZED</h1>
          <p className="text-neutral-500 text-xs uppercase tracking-wider">Your account role level does not possess admin clearances.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles: File[] = [];
      const defaultTitles: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          toast.warning(`Bypassed non-image file: ${file.name}`);
          continue;
        }
        validFiles.push(file);
        
        // Derive capital-cased title from file name
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const cleanName = baseName
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        defaultTitles.push(cleanName);
      }
      setSelectedFiles(validFiles);
      setBatchTitles(defaultTitles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Title is only required for single or carousel, batch gets individual titles
    if (uploadMode !== 'batch' && !formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (uploadMode === 'single' && !selectedFile) {
      toast.error("Please select a photo file to upload");
      return;
    }

    if (uploadMode === 'carousel' && selectedFiles.length === 0) {
      toast.error("Please select at least one photo file for the carousel group");
      return;
    }

    if (uploadMode === 'batch' && selectedFiles.length === 0) {
      toast.error("Please select at least one photo file to create separate cards");
      return;
    }

    // Verify all titles are entered for batch mode
    if (uploadMode === 'batch') {
      const hasEmptyTitle = selectedFiles.some((_, idx) => !batchTitles[idx]?.trim());
      if (hasEmptyTitle) {
        toast.error("Please enter a title for all selected cards");
        return;
      }
    }

    setIsUploading(true);
    
    try {
      if (uploadMode === 'single' && selectedFile) {
        setUploadProgress("Optimizing photo quality...");
        const optimizedBlob = await compressImage(selectedFile).catch(() => selectedFile);
        
        setUploadProgress("Uplinking graphics layer...");
        const buffer = await optimizedBlob.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        const data = await uploadMutation.mutateAsync({
          file: uint8Array,
          filename: selectedFile.name,
          mimeType: optimizedBlob.type || selectedFile.type,
        });

        // Create standard single image entry
        await createMutation.mutateAsync({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          imageUrl: data.url,
          imageKey: data.key,
          category: formData.category,
          displayOrder: formData.displayOrder,
        });

        toast.success("Image entry added to gallery!");
      } else if (uploadMode === 'carousel') {
        const urls: string[] = [];
        const keys: string[] = [];

        toast.info(`Initializing batch uplink for ${selectedFiles.length} layers...`);

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          
          setUploadProgress(`Optimizing segment ${i + 1}/${selectedFiles.length}...`);
          const optimizedBlob = await compressImage(file).catch(() => file);
          
          setUploadProgress(`Uplinking segment ${i + 1}/${selectedFiles.length}...`);
          const buffer = await optimizedBlob.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          
          const data = await uploadMutation.mutateAsync({
            file: uint8Array,
            filename: file.name,
            mimeType: optimizedBlob.type || file.type,
          });

          urls.push(data.url);
          keys.push(data.key);
        }

        setUploadProgress("Finalizing catalog index...");
        // Create Carousel group entry with JSON-stringified arrays
        await createMutation.mutateAsync({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          imageUrl: JSON.stringify(urls),
          imageKey: JSON.stringify(keys),
          category: formData.category,
          displayOrder: formData.displayOrder,
        });

        toast.success("Carousel entry added to gallery!");
      } else if (uploadMode === 'batch') {
        toast.info(`Initializing batch uplink for ${selectedFiles.length} separate cards...`);

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const customTitle = batchTitles[i]?.trim() || `${formData.title || "Photo"} Part ${i + 1}`;
          
          setUploadProgress(`Optimizing card ${i + 1}/${selectedFiles.length}...`);
          const optimizedBlob = await compressImage(file).catch(() => file);
          
          setUploadProgress(`Uplinking card ${i + 1}/${selectedFiles.length}...`);
          const buffer = await optimizedBlob.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          
          const data = await uploadMutation.mutateAsync({
            file: uint8Array,
            filename: file.name,
            mimeType: optimizedBlob.type || file.type,
          });

          setUploadProgress(`Registering card ${i + 1}/${selectedFiles.length}...`);
          // Create a separate standard image entry for each file
          await createMutation.mutateAsync({
            title: customTitle,
            description: formData.description.trim() || undefined,
            imageUrl: data.url,
            imageKey: data.key,
            category: formData.category,
            displayOrder: formData.displayOrder + i, // Increment displayOrder to maintain sorting order
          });
        }

        toast.success(`Successfully uploaded all ${selectedFiles.length} separate photo cards!`);
      }

      // Centralized state resetting upon successful uploads
      refetch();
      setFormData({ 
        title: "", 
        description: "", 
        category: "landscapes", 
        displayOrder: 0 
      });
      setSelectedFile(null);
      setSelectedFiles([]);
      setBatchTitles([]);
      setIsUploading(false);
      setUploadProgress("");

    } catch (error) {
      setIsUploading(false);
      setUploadProgress("");
      console.error("Upload error:", error);
      toast.error("Failed to compile or upload photo elements.");
    }
  };

  return (
    <div className="min-h-screen bg-black p-8 font-mono select-none">
      <div className="max-w-6xl mx-auto">
        
        {/* Header HUD */}
        <div className="flex justify-between items-center border-b border-[#d4af37]/30 pb-4 mb-8">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-widest uppercase">
            GALLERY <span className="text-[#d4af37]">ADMIN</span> PANEL
          </h1>
          <span className="text-[10px] text-[#d4af37] border border-[#d4af37]/30 bg-neutral-900/60 px-3 py-1.5 rounded-full font-bold">
            SECURE LINK ACTIVE
          </span>
        </div>

        {/* Upload Form */}
        <Card className="bg-neutral-950 border-[#d4af37]/45 border p-6 mb-12 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Brackets in corner */}
          <div className="absolute inset-4 pointer-events-none opacity-20">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]" />
          </div>

          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider border-b border-neutral-900 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            COMPILE NEW GALLERY INSTANCE
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5 text-left relative z-10">
            
            {/* Upload Mode Selector (Single vs Carousel Group vs Batch Cards) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-neutral-500 font-black tracking-widest uppercase">SELECT GRAPHIC INSTANCE MODE</label>
              <div className="grid grid-cols-3 gap-2 bg-neutral-900/40 p-1.5 rounded-xl border border-neutral-900 max-w-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('single');
                    setSelectedFiles([]);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                    uploadMode === 'single'
                      ? 'bg-[#d4af37] text-black shadow-lg'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <FileImage size={12} />
                  SINGLE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('carousel');
                    setSelectedFile(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                    uploadMode === 'carousel'
                      ? 'bg-[#d4af37] text-black shadow-lg'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Images size={12} />
                  CAROUSEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('batch');
                    setSelectedFile(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                    uploadMode === 'batch'
                      ? 'bg-[#d4af37] text-black shadow-lg'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Images size={12} className="rotate-90" />
                  BATCH CARDS
                </button>
              </div>
            </div>

            {uploadMode !== 'batch' && (
              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">TITLE ELEMENT *</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ENTER GRAPHIC CAPTURE HEADER..."
                  className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white rounded-lg text-xs tracking-wider placeholder-neutral-600 h-10 outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">DESCRIPTION STATEMENT</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="ENTER EXTRA OPTICAL METADATA LOGS (OPTIONAL)..."
                className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white rounded-lg text-xs tracking-wider placeholder-neutral-600 outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Dynamic File Upload inputs based on selected Mode */}
            {uploadMode === 'single' ? (
              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">UPLOAD PRINT LAYER *</label>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white text-xs h-10 cursor-pointer outline-none file:bg-neutral-900 file:border-none file:text-neutral-300 file:rounded-md file:mr-3 hover:file:bg-neutral-800"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Upload size={16} className="text-[#d4af37]" />
                  </div>
                </div>
                {selectedFile && (
                  <p className="text-green-500 text-[10px] font-bold mt-2">✓ SELECTED: {selectedFile.name} READY</p>
                )}
                <p className="text-neutral-600 text-[8px] tracking-wider mt-2 uppercase">UNRESTRICTED SIZE • FORMATS: JPG, PNG, WEBP, GIF</p>
              </div>
            ) : uploadMode === 'carousel' ? (
              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">UPLOAD CAROUSEL PRINT LAYERS *</label>
                <div className="relative">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFilesChange}
                    disabled={isUploading}
                    className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white text-xs h-10 cursor-pointer outline-none file:bg-neutral-900 file:border-none file:text-neutral-300 file:rounded-md file:mr-3 hover:file:bg-neutral-800"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Images size={16} className="text-[#d4af37]" />
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-900 flex flex-col gap-4 max-h-[350px] overflow-y-auto">
                    <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase border-b border-neutral-800 pb-1 mb-1">
                      CONFIGURE CAROUSEL SEGMENTS ({selectedFiles.length})
                    </span>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex flex-col gap-2.5 p-3.5 bg-black/60 rounded-xl border border-neutral-900 relative">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase tracking-wider">
                          <span className={index === 0 ? "text-[#d4af37] font-black" : ""}>
                            {index === 0 ? "★ COVER IMAGE" : `✓ SEGMENT_0${index + 1}`}
                          </span>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          {/* Thumbnail preview */}
                          <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                            <BatchImagePreview file={file} />
                          </div>
                          
                          <div className="flex-1 w-full flex flex-wrap gap-2 justify-between items-center text-left font-mono">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white text-xs font-bold truncate max-w-[200px]">{file.name}</span>
                              <span className="text-neutral-500 text-[8px]">POSITION: {index + 1}</span>
                            </div>
                            <div className="flex gap-2">
                              {index !== 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAsCover(index)}
                                  className="border-[#d4af37]/35 text-[#d4af37] hover:bg-[#d4af37] hover:text-black text-[8px] font-black tracking-widest px-2.5 py-1.5 h-auto rounded"
                                >
                                  SET COVER
                                </Button>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveFileInQueue(index, 'up')}
                                  disabled={index === 0}
                                  className="border-neutral-800 text-white hover:border-[#d4af37]/45 text-[8px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                                >
                                  ▲
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveFileInQueue(index, 'down')}
                                  disabled={index === selectedFiles.length - 1}
                                  className="border-neutral-800 text-white hover:border-[#d4af37]/45 text-[8px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                                >
                                  ▼
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-neutral-600 text-[8px] tracking-wider mt-2 uppercase">SELECT MULTIPLE PICTURES TO BUNDLE THEM INTO ONE CAROUSEL CARD • UNRESTRICTED SIZE</p>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">UPLOAD BATCH CARD PRINT LAYERS *</label>
                <div className="relative">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFilesChange}
                    disabled={isUploading}
                    className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white text-xs h-10 cursor-pointer outline-none file:bg-neutral-900 file:border-none file:text-neutral-300 file:rounded-md file:mr-3 hover:file:bg-neutral-800"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Images size={16} className="text-[#d4af37] rotate-90" />
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-900 flex flex-col gap-4 max-h-[350px] overflow-y-auto">
                    <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase border-b border-neutral-800 pb-1 mb-1">
                      CONFIGURE BATCH CARD TITLES ({selectedFiles.length})
                    </span>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex flex-col gap-2.5 p-3.5 bg-black/60 rounded-xl border border-neutral-900 relative">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase tracking-wider">
                          <span>✓ CARD ELEMENT_0{index + 1}</span>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          {/* Tiny preview */}
                          <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-850 overflow-hidden shrink-0 flex items-center justify-center">
                            <BatchImagePreview file={file} />
                          </div>
                          
                          <div className="flex-1 w-full text-left font-mono">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[8px] text-[#d4af37] font-black tracking-widest uppercase">
                                ENTER CARD TITLE *
                              </label>
                              <div className="flex gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveFileInQueue(index, 'up')}
                                  disabled={index === 0}
                                  className="border-neutral-800 text-white hover:border-[#d4af37]/45 text-[8px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                                >
                                  ▲ MOVE UP
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveFileInQueue(index, 'down')}
                                  disabled={index === selectedFiles.length - 1}
                                  className="border-neutral-800 text-white hover:border-[#d4af37]/45 text-[8px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                                >
                                  ▼ MOVE DOWN
                                </Button>
                              </div>
                            </div>
                            <Input
                              type="text"
                              value={batchTitles[index] || ""}
                              onChange={(e) => {
                                const newTitles = [...batchTitles];
                                newTitles[index] = e.target.value;
                                setBatchTitles(newTitles);
                              }}
                              placeholder="ENTER PHOTO CARD NAME..."
                              className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white rounded-lg text-xs h-9 outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-neutral-600 text-[8px] tracking-wider mt-2 uppercase">SELECT MULTIPLE PICTURES TO BUNDLE & NAME THEM AS SEPARATE CARDS • UNRESTRICTED SIZE</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">EXHIBITION CATEGORY</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-black border border-neutral-800 text-white rounded-lg p-2.5 text-xs focus:border-[#d4af37]/50 outline-none"
                >
                  <option value="landscapes">LANDSCAPES</option>
                  <option value="streets">STREETS</option>
                  <option value="moments">MOMENTS</option>
                  <option value="hero">HERO CARD (MAX 3 DISPLAYED)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 font-black tracking-widest uppercase mb-2">DISPLAY CH ORDER</label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="bg-black border-neutral-800 focus:border-[#d4af37]/50 text-white rounded-lg text-xs h-10 outline-none"
                  min="0"
                />
              </div>
            </div>

            {/* Smart 3-Hero-Card Warning Notice Banner */}
            {formData.category === 'hero' && (
              <div className="bg-[#d4af37]/5 border border-[#d4af37]/25 rounded-xl p-4 flex gap-3 text-left font-mono">
                <AlertTriangle className="text-[#d4af37] shrink-0 animate-pulse" size={18} />
                <div className="flex flex-col gap-1 text-[9px] md:text-[10px] text-[#d4af37] tracking-wider uppercase leading-relaxed font-bold">
                  <span>⚠️ HERO SLIDES LIMIT: MAX 3 CARDS ACTIVE</span>
                  <span className="text-neutral-400 font-medium leading-relaxed mt-1">
                    The homepage stack displays exactly the top 3 cards sorted by Display Order.
                    Use the <strong>BATCH CARDS</strong> mode to upload three images together and name each card individually to fill the fanned home page stack slots!
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isUploading || (uploadMode === 'single' ? !selectedFile : selectedFiles.length === 0)}
              className="w-full bg-[#d4af37] hover:bg-[#d4af37]/90 text-black font-black py-3 rounded-lg text-xs tracking-widest uppercase transition-all mt-6 shadow-md hover:shadow-[#d4af37]/10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={14} />
                  {uploadProgress || "COMPILING OPTICAL CHANNELS..."}
                </>
              ) : (
                <>
                  <Upload size={14} className="mr-2" />
                  UPLINK & REGISTER GRAPHIC ENTRY
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Gallery List */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider border-b border-neutral-900 pb-3 flex justify-between items-center flex-wrap gap-4">
            <span>REGISTERED INSTANCES ({images.length})</span>
            <span className="text-[8px] text-neutral-500 font-bold uppercase">DATABASE SOURCE: LIVE</span>
          </h2>
          
          {/* Category Reorder HUD Actions Bar */}
          <div className="flex gap-2 flex-wrap mb-8 bg-neutral-950 p-4 rounded-2xl border border-neutral-900 font-mono text-[9px] select-none">
            <span className="text-neutral-500 uppercase font-black self-center mr-2 tracking-widest text-[8px]">TUNING SWITCHBOARD:</span>
            <button
              type="button"
              onClick={() => setReorderCategory("landscapes")}
              className="border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-3.5 py-2 rounded-xl uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Images size={12} />
              TUNE LANDSCAPES (SLIDESHOW TIMELINE)
            </button>
            <button
              type="button"
              onClick={() => setReorderCategory("hero")}
              className="border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-3.5 py-2 rounded-xl uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Images size={12} className="rotate-90" />
              TUNE HERO (BATCH CARDS STACK)
            </button>
            <button
              type="button"
              onClick={() => setReorderCategory("streets")}
              className="border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-3.5 py-2 rounded-xl uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Images size={12} />
              TUNE STREETS
            </button>
            <button
              type="button"
              onClick={() => setReorderCategory("moments")}
              className="border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-3.5 py-2 rounded-xl uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Images size={12} />
              TUNE MOMENTS
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#d4af37]" size={32} />
            </div>
          ) : images.length === 0 ? (
            <Card className="bg-neutral-950 border border-neutral-900 p-12 text-center rounded-2xl">
              <p className="text-neutral-500 text-xs tracking-widest uppercase">No catalogued images found. Uplink your first file above!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => {
                const isCarouselCard = image.imageUrl.startsWith('["');
                let displayImg = image.imageUrl;
                let imagesCount = 1;

                if (isCarouselCard) {
                  try {
                    const parsed = JSON.parse(image.imageUrl) as string[];
                    displayImg = parsed[0] || displayImg;
                    imagesCount = parsed.length;
                  } catch (e) {}
                }

                // Check Hero Card Stack priority status
                const heroStatus = image.category === 'hero' ? getHeroCardStatus(image.id) : null;

                return (
                  <Card key={image.id} className="bg-neutral-950 border border-neutral-900 overflow-hidden hover:border-[#d4af37]/40 transition-colors rounded-2xl flex flex-col justify-between shadow-lg relative">
                    
                    {/* Active vs Inactive Hero Cards floating status indicator */}
                    {heroStatus && (
                      <div className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded text-[7px] font-black tracking-widest uppercase ${
                        heroStatus.isActive 
                          ? 'bg-[#d4af37] text-black animate-pulse font-bold' 
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}>
                        {heroStatus.isActive ? `ACTIVE HERO (SLOT ${heroStatus.slot})` : `QUEUED HERO (SLOT ${heroStatus.slot})`}
                      </div>
                    )}

                    <div className="relative h-48 bg-black overflow-hidden group">
                      <img
                        src={displayImg}
                        alt={image.title}
                        className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23141414' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                      
                      {/* Carousel Indicator Badge on admin card */}
                      {isCarouselCard && (
                        <div className="absolute top-3 left-3 bg-[#d4af37] text-black px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5">
                          <Images size={10} />
                          CAROUSEL ({imagesCount} IMAGES)
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 tracking-widest uppercase mb-1.5 font-bold">
                          <span className="text-[#d4af37]">{image.category}</span>
                          <span>CH_0{image.displayOrder}</span>
                        </div>
                        <h3 className="text-sm font-black text-white tracking-wider uppercase mb-2 line-clamp-1">{image.title}</h3>
                        {image.description && (
                          <p className="text-neutral-500 text-[11px] leading-relaxed mb-4 line-clamp-2">{image.description}</p>
                        )}
                      </div>
                      
                      {isCarouselCard && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-[#d4af37]/35 text-[#d4af37] hover:bg-[#d4af37] hover:text-black text-[10px] font-black tracking-widest uppercase py-2.5 h-auto mb-3 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                          onClick={() => setReorderCarouselImage(image)}
                        >
                          <Images size={12} />
                          REORDER CAROUSEL SLIDES
                        </Button>
                      )}

                      <div className="flex gap-2 border-t border-neutral-900/60 pt-4 mt-2">
                        <div className="flex gap-1 shrink-0 font-mono">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={updateImageOrderMutation.isPending}
                            onClick={() => shiftDisplayOrder(image, 'up')}
                            className="border-neutral-855 text-neutral-400 hover:text-[#d4af37] hover:border-[#d4af37]/40 text-[10px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                            title="Shift display order up"
                          >
                            ▲
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={updateImageOrderMutation.isPending}
                            onClick={() => shiftDisplayOrder(image, 'down')}
                            className="border-neutral-855 text-neutral-400 hover:text-[#d4af37] hover:border-[#d4af37]/40 text-[10px] font-bold px-2.5 py-1.5 h-auto rounded disabled:opacity-30"
                            title="Shift display order down"
                          >
                            ▼
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-neutral-800 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 text-[10px] font-black tracking-widest"
                          onClick={() => deleteMutation.mutate(image.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={12} className="mr-1" />
                          DELETE ENTRY
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
      {/* Visual Reordering Modals */}
      <CarouselReorderModal
        image={reorderCarouselImage}
        isOpen={reorderCarouselImage !== null}
        onClose={() => setReorderCarouselImage(null)}
        onSaved={refetch}
      />

      <CategoryReorderModal
        category={reorderCategory || ""}
        images={images}
        isOpen={reorderCategory !== null}
        onClose={() => setReorderCategory(null)}
        onSaved={refetch}
      />
      </div>
      </div>
    </div>
  );
}
