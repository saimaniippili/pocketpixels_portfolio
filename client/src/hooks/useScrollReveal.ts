import { useInView } from 'react-intersection-observer';
import { useAnimation, useMotionTemplate, useMotionValue } from 'framer-motion';

export function useScrollReveal() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const controls = useAnimation();

  if (inView) {
    controls.start('visible');
  }

  return {
    ref,
    controls,
    inView,
  };
}
