"use client";

import { useRecoilValue } from "recoil";
import socket from "../components/SocketConnection";

import { MutableRefObject, RefObject, useEffect, useRef } from "react";
import { roomIDAtom } from "../Atoms/atoms";
import rough from "roughjs";
import { init } from "next/dist/compiled/webpack/webpack";

export function useDraw(): { canvasRef: RefObject<HTMLCanvasElement> } {
  const roomID = useRecoilValue(roomIDAtom);

  interface mousePositionType {
    x: number;
    y: number;
  }

  interface totalDrawDataType {
    initialPosition: MutableRefObject<mousePositionType | null>;
    mousePosition: mousePositionType;
    roomID: string;
  }

  const drawType: String = "Rectangle";

  const Lines: any[] = [];

  // Ref to the canvas element
  const canvasRef: RefObject<HTMLCanvasElement> =
    useRef<HTMLCanvasElement>(null);
  const isDrawing: MutableRefObject<Boolean> = useRef<Boolean>(false);
  const initialPosition: MutableRefObject<mousePositionType | null> =
    useRef<mousePositionType | null>(null);

  useEffect(() => {
    // canvas and rect
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const rect: DOMRect = canvas.getBoundingClientRect();

    // using roughjs for drawing shapes
    if (!canvasRef.current) return;
    // getting canvas
    const roughCanvas = rough.canvas(canvasRef.current);
    // creating generator and defining shapes
    const generator = rough.generator();

    // getting the 2d context of canvas to draw
    const ctx: CanvasRenderingContext2D | null | undefined =
      canvasRef.current?.getContext("2d");

    // when mouse is is held down, save the coordinates as initial position
    const handleMouseDown = (e: MouseEvent): void => {
      isDrawing.current = true;
      console.log(isDrawing.current);
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      initialPosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // display other user's drawings
    socket.on("otherUsersDraw", (allCoordinates: any) => {
      console.log(
        "other user's coordinates: " + allCoordinates.initialPosition.current
      );
      console.log("other user's coordinates: " + allCoordinates.mousePosition);
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      /// canvas properties and drawing
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";

      // move canvas pointer to initial positions of mousedown and make line to current coordinates
      ctx.beginPath();
      ctx.moveTo(
        allCoordinates.initialPosition.current.x,
        allCoordinates.initialPosition.current.y
      );
      ctx.lineTo(
        allCoordinates.mousePosition.x,
        allCoordinates.mousePosition.y
      );
      ctx.stroke();
      ctx.beginPath();

      // update the previous coordinates to current (to not make lines everywhere from first coordinate)
      allCoordinates.initialPosition.current = {
        x: allCoordinates.mousePosition.x,
        y: allCoordinates.mousePosition.y,
      };

      console.log("other user's drawing rendering");
    });

    socket.on("closing", (closing) => {
      console.log("closing: " + closing);
      console.log("closing the room");
      socket.removeAllListeners("otherUsersDraw");
    });

    // draw on the mouse coordinates, record and draw coordinates
    const draw = (e: MouseEvent): void => {
      if (!ctx || !canvas) return;

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

        const DrawData: totalDrawDataType = {
          initialPosition,
          mousePosition,
          roomID,
        };

        if (drawType === "Free") {
          socket.emit("draw", DrawData);

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
          console.log("drawing for this user");
        } else if (drawType === "Line") {
          // clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // draw all lines
          Lines.forEach((line) => {
            roughCanvas.draw(line);
          });
          // draw the current line
          const line = generator.line(
            initialPosition.current.x,
            initialPosition.current.y,
            mousePosition.x,
            mousePosition.y
          );
          roughCanvas.draw(line);
        } else if (drawType === "Rectangle") {
          // clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // draw all rectangles
          Lines.forEach((rectangle) => {
            roughCanvas.draw(rectangle);
          });
          // draw the current line
          const rectangle = generator.rectangle(
            initialPosition.current.x,
            initialPosition.current.y,
            mousePosition.x - initialPosition.current.x,
            mousePosition.y - initialPosition.current.y
          );
          roughCanvas.draw(rectangle);
        } else {
          return;
        }
      }
    };

    // when mouse up, quit drawing
    const handleMouseUp = (e: MouseEvent): void => {
      if (drawType == "Line") {
        // save the coordinates as end position where mouse is released
        const endCoordinates = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        if (initialPosition.current == null) return;

        // create a new line using the initial position and end position and add it to the array then refresh the canvas
        const newLine = generator.line(
          initialPosition.current.x,
          initialPosition.current.y,
          endCoordinates.x,
          endCoordinates.y
        );

        Lines.push(newLine);

        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        //draw all lines
        Lines.forEach((line) => {
          roughCanvas.draw(line);
        });
      } else if (drawType == "Rectangle") {
        const endCoordinates = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        if (initialPosition.current == null) return;

        const newRect = generator.rectangle(
          initialPosition.current.x,
          initialPosition.current.y,
          endCoordinates.x - initialPosition.current.x,
          endCoordinates.y - initialPosition.current.y
        );

        Lines.push(newRect);

        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        //draw all lines
        Lines.forEach((rect) => {
          roughCanvas.draw(rect);
        });
      }

      isDrawing.current = false;
    };

    const handleMouseout = (e: MouseEvent): void => {
      isDrawing.current = false;
    };

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

      // important!!
      // wasted a whole day to figure out why other user's drawings were dotted on rejoining room
      socket.off("otherUsersDraw");
    };
  }, []);

  return { canvasRef };
}
