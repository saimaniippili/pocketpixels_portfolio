import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function CameraLens3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    if (!containerRef.current) return;
    
    containerRef.current.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    const lenses: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Create floating camera lenses
    for (let i = 0; i < 5; i++) {
      lenses.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 40 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const animate = () => {
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      lenses.forEach((lens) => {
        // Update position with original floating animation
        lens.x += lens.vx;
        lens.y += lens.vy;
        lens.rotation += lens.rotationSpeed;

        // Bounce off walls
        if (lens.x - lens.radius < 0 || lens.x + lens.radius > canvas.width) {
          lens.vx *= -1;
          lens.x = Math.max(lens.radius, Math.min(canvas.width - lens.radius, lens.x));
        }
        if (lens.y - lens.radius < 0 || lens.y + lens.radius > canvas.height) {
          lens.vy *= -1;
          lens.y = Math.max(lens.radius, Math.min(canvas.height - lens.radius, lens.y));
        }

        // Draw camera lens
        ctx.save();
        ctx.translate(lens.x, lens.y);
        ctx.rotate(lens.rotation);

        // Outer ring
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, lens.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circles (lens elements)
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const r = (lens.radius / 3) * (i + 1);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Aperture blades
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * lens.radius, Math.sin(angle) * lens.radius);
          ctx.stroke();
        }

        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = containerRef.current?.clientWidth || 0;
      canvas.height = containerRef.current?.clientHeight || 0;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
