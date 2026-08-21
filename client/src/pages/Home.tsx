import { useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { Story } from '@/components/Story';
import { Gallery } from '@/components/Gallery';
import { Slideshow } from '@/components/Slideshow';
import { Connect } from '@/components/Connect';
import { Footer } from '@/components/Footer';
import { CustomCursor } from '@/components/CustomCursor';
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Premium Photography Portfolio for Vivo X300
 * 
 * Design Philosophy: Premium Minimalist Glassmorphism
 * - Smooth animations with spring physics
 * - Glassmorphic cards with backdrop blur
 * - Cyan-to-purple gradient accents
 * - Scroll-reveal animations
 * - Custom cursor with trailing effect
 * - Backend database for image management
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const initLenis = async () => {
      try {
        const Lenis = (await import('lenis')).default;
        const lenis = new Lenis({
          lerp: 0.05, // Lower lerp value makes it butter smooth
          smoothWheel: true,
          wheelMultiplier: 1.2, // Slightly faster responsiveness to wheel
        });

        let animationFrameId: number;
        const raf = (time: number) => {
          lenis.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        };

        animationFrameId = requestAnimationFrame(raf);

        return () => {
          cancelAnimationFrame(animationFrameId);
          lenis.destroy?.();
        };
      } catch (error) {
        console.warn('Lenis smooth scrolling not available');
        return () => {};
      }
    };

    let cleanup: (() => void) | null = null;
    initLenis().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div className="w-full bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <CustomCursor />
      <Hero />
      <Story />
      <Gallery />
      <Slideshow />
      <Connect />
      <Footer />
    </div>
  );
}
