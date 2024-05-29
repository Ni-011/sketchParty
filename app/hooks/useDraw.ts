"use client";

import { useEffect, useRef } from "react";

export function useDraw() {
  interface mousePositionType {
    x: number;
    y: number;
  }

  // Ref to the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<Boolean>(false);
  const initialPosition = useRef<mousePositionType | null>(null);

  useEffect(() => {
    // getting the 2d context of canvas to draw
    const ctx: CanvasRenderingContext2D | null | undefined =
      canvasRef.current?.getContext("2d");

    const handleMouseDown: (e: MouseEvent) => void = (e: MouseEvent) => {
      isDrawing.current = true;
      console.log(isDrawing.current);
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      initialPosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // draw on the mouse coordinates
    const draw: (e: MouseEvent) => void = (e: MouseEvent) => {
      // current mouse position
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      if (
        !isDrawing ||
        initialPosition.current?.x == null ||
        initialPosition.current?.y == null
      ) {
        return;
      }

      if (isDrawing.current == true) {
        const mousePosition: mousePositionType = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        /// canvas properties and drawing
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";

        ctx.beginPath();
        ctx.moveTo(initialPosition.current.x, initialPosition.current.y);
        ctx.lineTo(mousePosition?.x ?? 0, mousePosition?.y ?? 0);
        ctx.stroke();
        ctx.beginPath();

        initialPosition.current = {
          x: mousePosition?.x ?? 0,
          y: mousePosition?.y ?? 0,
        };
      } else {
        return;
      }
    };

    // compute the coordinated from positions
    const computePositon: (e: MouseEvent) => mousePositionType | undefined = (
      e: MouseEvent
    ) => {
      if (!canvas) return;

      const rect: DOMRect = canvas.getBoundingClientRect();
      const x: number = e.clientX - rect.left;
      const y: number = e.clientY - rect.top;

      return { x, y };
    };

    const handleMouseUp: (e: MouseEvent) => void = (e: MouseEvent) => {
      isDrawing.current = false;
      console.log(isDrawing.current);
    };

    const handleMouseout: (e: MouseEvent) => void = (e: MouseEvent) => {
      isDrawing.current = false;
    };

    const canvas: HTMLCanvasElement | null = canvasRef.current;

    if (canvas) {
      // adding event listener to track mouse movements and draw
      canvas?.addEventListener("mousedown", handleMouseDown);
      canvas?.addEventListener("mousemove", draw);
      canvas?.addEventListener("mouseup", handleMouseUp);
      canvas?.addEventListener("mouseout", handleMouseout);
    }

    // removing event listener to track mouse movements and draw
    return () => {
      canvas?.addEventListener("mousedown", handleMouseDown);
      canvas?.addEventListener("mousemove", draw);
      canvas?.addEventListener("mouseup", handleMouseUp);
      canvas?.addEventListener("mouseout", handleMouseout);
    };
  }, []);

  return { canvasRef };
}
