"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface StickerPeelProps {
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

export function StickerPeel({ 
  children, 
  className, 
  isVisible = false,
  onClose 
}: StickerPeelProps) {
  const stickerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!stickerRef.current) return;

    if (isVisible) {
      setIsAnimating(true);
      gsap.fromTo(
        stickerRef.current,
        {
          scale: 0,
          opacity: 0,
          y: -50,
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.8)",
          onComplete: () => {
            setIsAnimating(false);
          },
        }
      );
    } else {
      setIsAnimating(true);
      gsap.to(stickerRef.current, {
        scale: 0,
        opacity: 0,
        y: 50,
        duration: 0.4,
        ease: "back.in(1.7)",
        onComplete: () => {
          setIsAnimating(false);
        },
      });
    }
  }, [isVisible]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      ref={stickerRef}
      className={cn(
        "relative bg-gradient-to-br from-white via-neutral-100/50 to-neutral-200/30 dark:from-neutral-900/20 dark:via-neutral-800/10 dark:to-neutral-700/5 backdrop-blur-lg border-neutral-300/50 dark:border-neutral-700/30 shadow-lg rounded-lg p-6 border-2",
        "transform-gpu",
        className
      )}
      style={{
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      }}
    >
      {/* Sticker peel effect */}
      <div className="absolute top-2 right-2 w-8 h-8 bg-neutral-300/20 dark:bg-neutral-600/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-neutral-400/30 dark:hover:bg-neutral-500/30 transition-colors"
           onClick={onClose}>
        <svg className="w-4 h-4 text-neutral-800 dark:text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="pr-8">
        {children}
      </div>
      
      {/* Peel effect shadow */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent to-black/10 dark:to-white/10 rounded-br-lg transform rotate-45 scale-150 origin-top-right" />
    </div>
  );
}
