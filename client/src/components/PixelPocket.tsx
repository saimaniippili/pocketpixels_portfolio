import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export function PixelPocket() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number | undefined>(undefined);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);

    const animate = () => {
      // Easing interpolation for ultra-smooth movement
      currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * 0.1;
      currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * 0.1;

      setOffset({ 
        x: Number(currentOffset.current.x.toFixed(2)), 
        y: Number(currentOffset.current.y.toFixed(2)) 
      });

      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    const calculateOffset = (clientX: number, clientY: number) => {
      // Max translate range ~15px
      const offsetX = (clientX - window.innerWidth / 2) * 0.03;
      const offsetY = (clientY - window.innerHeight / 2) * 0.03;
      // Clamp values
      targetOffset.current = {
        x: Math.max(-15, Math.min(15, offsetX)),
        y: Math.max(-15, Math.min(15, offsetY))
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      calculateOffset(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        calculateOffset(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleReset = () => {
      targetOffset.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleReset);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleReset);
    window.addEventListener('touchcancel', handleReset);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleReset);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchend', handleReset);
      window.removeEventListener('touchcancel', handleReset);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Pixel art pocket SVG
  const pocketSVG = `
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <!-- Pocket outline -->
      <rect x="20" y="20" width="160" height="200" fill="none" stroke="#d4af37" stroke-width="4"/>
      
      <!-- Pocket flap -->
      <polygon points="20,20 180,20 170,40 30,40" fill="#141414" stroke="#d4af37" stroke-width="3"/>
      
      <!-- Pocket button -->
      <circle cx="100" cy="35" r="4" fill="#d4af37"/>
      
      <!-- Camera icon inside pocket -->
      <g transform="translate(100, 120)">
        <!-- Camera body -->
        <rect x="-30" y="-20" width="60" height="40" fill="none" stroke="#d4af37" stroke-width="2"/>
        
        <!-- Camera lens -->
        <circle cx="0" cy="0" r="15" fill="none" stroke="#d4af37" stroke-width="2"/>
        <circle cx="0" cy="0" r="10" fill="none" stroke="#d4af37" stroke-width="1"/>
        <circle cx="0" cy="0" r="5" fill="#d4af37"/>
        
        <!-- Flash -->
        <rect x="15" y="-15" width="8" height="8" fill="none" stroke="#d4af37" stroke-width="1"/>
      </g>
      
      <!-- Decorative pixels -->
      <rect x="40" y="60" width="4" height="4" fill="#d4af37"/>
      <rect x="156" y="80" width="4" height="4" fill="#d4af37"/>
      <rect x="50" y="180" width="4" height="4" fill="#d4af37"/>
      <rect x="146" y="160" width="4" height="4" fill="#d4af37"/>
    </svg>
  `;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{
        x: offset.x,
        y: offset.y,
      }}
      className="relative w-48 h-64 mx-auto"
    >
      {/* Main pocket container */}
      <div
        className="w-full h-full relative"
        dangerouslySetInnerHTML={{ __html: pocketSVG }}
      />

      {/* Floating pixels animation */}
      <motion.div
        className="absolute top-12 left-8 w-2 h-2 bg-red-500"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-20 right-12 w-2 h-2 bg-red-500"
        animate={{
          y: [0, -15, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute bottom-16 left-12 w-2 h-2 bg-red-500"
        animate={{
          y: [0, -18, 0],
          x: [0, 8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <motion.div
        className="absolute bottom-20 right-8 w-2 h-2 bg-red-500"
        animate={{
          y: [0, -12, 0],
          x: [0, -12, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      />

      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          border: '2px solid #d4af37',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(212, 175, 55, 0.3)',
            '0 0 40px rgba(212, 175, 55, 0.6)',
            '0 0 20px rgba(212, 175, 55, 0.3)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
