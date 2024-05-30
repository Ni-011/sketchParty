"use client";

import { MutableRefObject, RefObject, useEffect, useRef } from "react";

export function useDraw(): () => RefObject<HTMLCanvasElement> {
  interface mousePositionType {
    x: number;
    y: number;
  }

  // Ref to the canvas element
  const canvasRef: RefObject<HTMLCanvasElement> =
    useRef<HTMLCanvasElement>(null);
  const isDrawing: MutableRefObject<Boolean> = useRef<Boolean>(false);
  const initialPosition: MutableRefObject<mousePositionType | null> =
    useRef<mousePositionType | null>(null);

  useEffect(() => {
    // getting the 2d context of canvas to draw
    const ctx: CanvasRenderingContext2D | null | undefined =
      canvasRef.current?.getContext("2d");

    // when mouse is is held down, save the coordinates as initial position
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
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      if (
        !isDrawing ||
        initialPosition.current?.x == null ||
        initialPosition.current?.y == null
      ) {
        return;
      }

      // if mouse down, record the coordinates
      if (isDrawing.current == true) {
        const mousePosition: mousePositionType = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        /// canvas properties and drawing
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";

        // move canvas pointer to initial positions of mousedown and make line to current coordinates
        ctx.beginPath();
        ctx.moveTo(initialPosition.current.x, initialPosition.current.y);
        ctx.lineTo(mousePosition?.x ?? 0, mousePosition?.y ?? 0);
        ctx.stroke();
        ctx.beginPath();

        // update the previous coordinates to current (to not make lines everywhere from first coordinate)
        initialPosition.current = {
          x: mousePosition?.x ?? 0,
          y: mousePosition?.y ?? 0,
        };
      } else {
        return;
      }
    };

    // when mouse up, quit drawing
    const handleMouseUp: (e: MouseEvent) => void = (e: MouseEvent) => {
      isDrawing.current = false;
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
