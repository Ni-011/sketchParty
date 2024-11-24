"use client";

import {useRecoilValue} from "recoil";
import socket from "../components/SocketConnection";

import { MutableRefObject, RefObject, useEffect, useRef } from "react";
import {drawModeAtom, roomIDAtom} from "../Atoms/atoms";
import rough from "roughjs";
import {Lines, freeHand} from "../components/Lines";



export function useDraw(drawType): { canvasRef: RefObject<HTMLCanvasElement> } {
  const roomID = useRecoilValue(roomIDAtom);

  interface mousePositionType {
    x: number;
    y: number;
  }

  interface point {
    x: number,
    y: number,
  }

  const currentPath = useRef<point[]>([]);

  interface totalDrawDataType {
    initialPosition: MutableRefObject<mousePositionType | null>;
    mousePosition: mousePositionType;
    roomID: string;
  }

  // Ref to the canvas element
  const canvasRef: RefObject<HTMLCanvasElement> =
    useRef<HTMLCanvasElement | null>(null);
  const isDrawing: MutableRefObject<Boolean> = useRef<Boolean>(false);
  const initialPosition: MutableRefObject<mousePositionType | null> =
    useRef<mousePositionType | null>(null);

  useEffect(() => {
    // canvas and rect
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const rect: DOMRect = canvas.getBoundingClientRect();

    // using rough.js for drawing shapes
    if (!canvasRef.current) return;
    // getting canvas
    const roughCanvas = rough.canvas(canvasRef.current);
    // creating generator and defining shapes
    const generator = rough.generator();

    // getting the 2d context of canvas to draw
    const ctx: CanvasRenderingContext2D | null | undefined =
      canvasRef.current?.getContext("2d");



    // when mouse is held down, save the coordinates as initial position
    const handleMouseDown = (e: MouseEvent): void => {
      isDrawing.current = true;
      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

      initialPosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // display other user's drawings
    socket.on("otherUsersDraw", (allCoordinates: any) => {

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
    });

    socket.on("closing", (closing) => {
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

        const drawExistingFreeHandDrawings = (freeHand: Array<Array<point>>) => {
          freeHand.forEach((path) => {
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.strokeStyle = "black";
            path.forEach((point, index) => {
              if (index == 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
          });
        }

        switch (drawType) {
          case "free":
            socket.emit("draw", DrawData);

            // save current coordinates
            currentPath.current.push(mousePosition);

            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // draw other shapes
              Lines.forEach((shape) => {
                roughCanvas.draw(shape);
              });

            // draw all freehand drawings from saved
            drawExistingFreeHandDrawings(freeHand);

            // canvas properties and drawing
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.strokeStyle = "black";

            // move canvas pointer to initial positions of mousedown and make line to current coordinates
            ctx.beginPath();

            currentPath.current.forEach((point, index) => {
              if (index == 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
            // ctx.moveTo(initialPosition.current.x, initialPosition.current.y);
            // ctx.lineTo(mousePosition?.x ?? 0, mousePosition?.y ?? 0);
            // ctx.stroke();
            // ctx.beginPath();

            // update the previous coordinates to current (to not make lines everywhere from first coordinate)
            initialPosition.current = {
              x: mousePosition?.x ?? 0,
              y: mousePosition?.y ?? 0,
            };
            break;

          case "line":
            console.log("Line");
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // draw all lines
            Lines.forEach((line) => {
              roughCanvas.draw(line);
            });

            drawExistingFreeHandDrawings(freeHand);

            // draw the current line
            const line = generator.line(
                initialPosition.current.x,
                initialPosition.current.y,
                mousePosition.x,
                mousePosition.y
            );
            roughCanvas.draw(line);
            break;

          case "rectangle":
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // draw all rectangles
            Lines.forEach((rectangle) => {
              roughCanvas.draw(rectangle);
            });

            drawExistingFreeHandDrawings(freeHand);

            // draw the current line
            const rectangle = generator.rectangle(
                initialPosition.current.x,
                initialPosition.current.y,
                mousePosition.x - initialPosition.current.x,
                mousePosition.y - initialPosition.current.y
            );
            roughCanvas.draw(rectangle);
            break;

          case "circle":
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // draw all circles
            Lines.forEach((circle) => {
              roughCanvas.draw(circle);
            });

            drawExistingFreeHandDrawings(freeHand);

            const radius = Math.sqrt(
                Math.pow(mousePosition.x - initialPosition.current.x, 2) + Math.pow(mousePosition.y - initialPosition.current.y, 2)
            );
            // draw the current circle
            const circle = generator.circle(
                initialPosition.current.x,
                initialPosition.current.y,
                radius*2
            );
            roughCanvas.draw(circle);
            break;

          default:
            return;
        }
      }
    };

    // when mouse up, quit drawing
    const handleMouseUp = (e: MouseEvent): void => {
      if (!ctx || !canvas || !initialPosition.current) return;

      // save the coordinates as end position where mouse is released
      const endCoordinates = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const drawExistingFreeHandDrawings = (freeHand: Array<Array<point>>) => {
        freeHand.forEach((path) => {
          ctx.beginPath();
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "black";
          path.forEach((point, index) => {
            if (index == 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        });
      }

      switch (drawType) {
        case "line":
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

        drawExistingFreeHandDrawings(freeHand);
        break;

       case "rectangle":
        const newRect = generator.rectangle(
          initialPosition.current.x,
          initialPosition.current.y,
          endCoordinates.x - initialPosition.current.x,
          endCoordinates.y - initialPosition.current.y
        );

        Lines.push(newRect);

        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        //draw all rect
        Lines.forEach((rect) => {
          roughCanvas.draw(rect);
        });

        drawExistingFreeHandDrawings(freeHand);
         break;

         case "free":
           freeHand.push([...currentPath.current]);
           currentPath.current = [];

           ctx?.clearRect(0, 0, canvas.width, canvas.height);
           Lines.forEach((line) => {
             roughCanvas.draw(line);
           });

           drawExistingFreeHandDrawings(freeHand);

           break;

        case "circle":
          // radius of circle
          const radius = Math.sqrt(
              Math.pow(endCoordinates.x - initialPosition.current.x, 2) + Math.pow(endCoordinates.y - initialPosition.current.y, 2)
          );
          // making the final circle to be saved
          const newCircle = generator.circle(
              initialPosition.current.x,
              initialPosition.current.y,
              radius*2
          );
          // save in the db
          Lines.push(newCircle);
          // clear the screen and then redraw all shapes
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          //draw all circles
          Lines.forEach((circle) => {
            roughCanvas.draw(circle);
          });

          drawExistingFreeHandDrawings(freeHand);
      }

      isDrawing.current = false;
    };

    const handleMouseout = (e: MouseEvent): void => {
      isDrawing.current = false;
    };

    const attachListeners = () => {
      if (canvas) {
        // adding event listener to track mouse movements and draw
        canvas?.addEventListener("mousedown", handleMouseDown);
        canvas?.addEventListener("mousemove", draw);
        canvas?.addEventListener("mouseup", handleMouseUp);
        canvas?.addEventListener("mouseout", handleMouseout);
      }
    }

    const detachListeners = () => {
      canvas?.removeEventListener("mousedown", handleMouseDown);
      canvas?.removeEventListener("mousemove", draw);
      canvas?.removeEventListener("mouseup", handleMouseUp);
      canvas?.removeEventListener("mouseout", handleMouseout);
    }

    attachListeners();

    // removing event listener to track mouse movements and draw
    return () => {
        detachListeners()
      // important!!
      // wasted a whole day to figure out why other user's drawings were dotted on rejoining room
      socket.off("otherUsersDraw");
    };
  }, [drawType]);

  return { canvasRef };
}
