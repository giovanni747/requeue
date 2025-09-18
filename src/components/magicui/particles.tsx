"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

export const Particles = ({
  className,
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const setCanvasSize = useCallback(() => {
    if (canvasContainerRef.current && canvasRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, []);

  const drawCircle = useCallback(
    (x: number, y: number, radius: number, color: string) => {
      if (context.current) {
        context.current.beginPath();
        context.current.arc(x, y, radius, 0, 2 * Math.PI);
        context.current.fillStyle = color;
        context.current.fill();
      }
    },
    []
  );

  const createCircle = useCallback(
    (x: number, y: number, vx: number, vy: number) => {
      const circle = {
        x,
        y,
        vx,
        vy,
        radius: Math.random() * size + 0.1,
        color: color,
        alpha: Math.random() * 0.5 + 0.5,
      };
      return circle;
    },
    [size, color]
  );

  const init = useCallback(() => {
    if (canvasRef.current && canvasContainerRef.current) {
      context.current = canvasRef.current.getContext("2d");
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      circlesRef.current = [];
      for (let i = 0; i < quantity; i++) {
        const circle = createCircle(
          Math.random() * width,
          Math.random() * height,
          (Math.random() - 0.5) * 0.1 + vx,
          (Math.random() - 0.5) * 0.1 + vy
        );
        circlesRef.current.push(circle);
      }
    }
  }, [quantity, createCircle, vx, vy]);

  const draw = useCallback(() => {
    if (context.current && canvasRef.current) {
      context.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      circlesRef.current.forEach((circle) => {
        drawCircle(circle.x, circle.y, circle.radius, circle.color);
      });
    }
  }, [drawCircle]);

  const animate = useCallback(
    (currentTime: number) => {
      if (currentTime - lastTimeRef.current < 16) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTimeRef.current = currentTime;
      if (canvasRef.current && canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        circlesRef.current.forEach((circle) => {
          circle.x += circle.vx;
          circle.y += circle.vy;
          if (circle.x < 0) {
            circle.x = width;
          } else if (circle.x > width) {
            circle.x = 0;
          }
          if (circle.y < 0) {
            circle.y = height;
          } else if (circle.y > height) {
            circle.y = 0;
          }
        });
        draw();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [draw]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (canvasRef.current && canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        circlesRef.current.forEach((circle) => {
          const dx = x - circle.x;
          const dy = y - circle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            const force = (100 - distance) / 100;
            circle.vx += (dx / distance) * force * 0.1;
            circle.vy += (dy / distance) * force * 0.1;
          }
        });
      }
    },
    []
  );

  const handleResize = useCallback(() => {
    setCanvasSize();
    init();
  }, [setCanvasSize, init]);

  useEffect(() => {
    init();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [init, handleResize, handleMouseMove, animate]);

  useEffect(() => {
    if (refresh) {
      init();
    }
  }, [refresh, init]);

  return (
    <div
      ref={canvasContainerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
