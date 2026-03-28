import React from "react";

type UseScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
};

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px 0px -60px 0px", triggerOnce = true } = options;
  const ref = React.useRef<T>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

export function useScrollRevealBatch<T extends HTMLElement = HTMLElement>(
  count: number,
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px 0px -40px 0px", triggerOnce = true } = options;
  const refs = React.useRef<(T | null)[]>([]);
  const [visibleItems, setVisibleItems] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    refs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => {
              const next = new Set(prev);
              next.add(index);
              return next;
            });
            if (triggerOnce) observer.unobserve(el);
          }
        },
        { threshold, rootMargin }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [count, threshold, rootMargin, triggerOnce]);

  const setRef = React.useCallback((index: number) => (el: T | null) => {
    refs.current[index] = el;
  }, []);

  return { setRef, visibleItems };
}
