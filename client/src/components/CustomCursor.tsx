import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef<number | undefined>(undefined);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Smooth interpolation function
    const animate = () => {
      // Interpolate for smooth following (easing)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.25;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.25;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    // Mouse events (Desktop)
    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    // Touch events (Mobile)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        // Snap immediately on touch start to avoid delay
        currentPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setIsVisible(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    
    // Check if device supports hover to handle visibility gracefully on desktop
    if (window.matchMedia('(hover: hover)').matches) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <>
      {/* Cursor Dot */}
      <motion.div
        ref={cursorRef}
        className="fixed top-[-6px] left-[-6px] w-3 h-3 bg-[#d4af37] rounded-full pointer-events-none z-[100]"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isVisible ? 1 : 0,
          boxShadow: isVisible 
            ? ['0 0 0 0 rgba(212, 175, 55, 0.7)', '0 0 0 10px rgba(212, 175, 55, 0)']
            : 'none'
        }}
        transition={{
          boxShadow: { duration: 1.5, repeat: Infinity },
          opacity: { duration: 0.2 }
        }}
      />

      {/* Cursor Ring */}
      <motion.div
        ref={ringRef}
        className="fixed top-[-16px] left-[-16px] w-8 h-8 border-2 border-[#d4af37] rounded-full pointer-events-none z-[100]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isVisible ? [0.8, 0.3] : 0,
          scale: isVisible ? 1 : 0.8
        }}
        transition={{
          opacity: isVisible ? { duration: 1, repeat: Infinity, repeatType: 'reverse' } : { duration: 0.2 },
          scale: { duration: 0.2 }
        }}
      />
    </>
  );
}
