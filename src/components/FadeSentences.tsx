import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Props = {
  sentences: string[];
  intervalMs?: number;
  onIndexChange?: (index: number) => void; // ✅ new
};

export default function FadeSentences({
  sentences,
  intervalMs = 2200,
  onIndexChange,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const safeSentences = useMemo(
    () => (sentences.length ? sentences : ["Fresh bakes, made with care."]),
    [sentences]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeSentences.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, safeSentences.length]);

  // ✅ Notify parent when index changes
  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const current = safeSentences[index];

  if (reduceMotion) return <span>{safeSentences[0]}</span>;

  return (
    <span className="relative inline-block align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
