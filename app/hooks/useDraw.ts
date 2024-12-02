"use client";

import {useRecoilValue} from "recoil";
import socket from "../components/SocketConnection";

import { MutableRefObject, RefObject, useEffect, useRef } from "react";
import {drawModeAtom, roomIDAtom} from "../Atoms/atoms";
import rough from "roughjs";
import {Lines, freeHand, updateFreeHand, updateLines} from "../components/Lines";
import { Shapes } from "lucide-react";



export function useDraw(drawType: any): { canvasRef: RefObject<HTMLCanvasElement> } {
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
    drawType: string;
    isCompleted?: boolean;
    currentPath?: point[];
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

      if (drawType === "free") {
        currentPath.current = [];
      }
    };

    // display other user's drawings
    socket.on("otherUsersDraw", (allCoordinates: any) => {

      if (!ctx || !canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();

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

      switch (allCoordinates.drawType) {
        case "eraser":
          const eraserRadius = 20;
          const newFreeHand = freeHand.filter((path) => {
            return !path.some(point => isPointInEraserRadius(point, allCoordinates.mousePosition, eraserRadius));
          });
          updateFreeHand(newFreeHand);

          const newLines = Lines.filter (shape => {
            // Line
            if (shape.ops?.[0]?.op === "move" && shape.ops?.[1]?.op === "lineTo") {
              const start = {x: shape.ops[0].data[0], y: shape.ops[0].data[1]};
                const end = {x: shape.ops[1].data[0], y: shape.ops[1].data[1]};
                return !isPointInEraserRadius(start, allCoordinates.mousePosition, eraserRadius) && !isPointInEraserRadius(end, allCoordinates.mousePosition, eraserRadius);
              }

              // rectangle
              if (shape.op?.[0].op === "move" && shape.ops?.[1]?.op === "rect") {
                const x = shape.ops[0].data[0];
                const y = shape.ops[0].data[1];
                const width = shape.ops[1].data[2];
                const height = shape.ops[1].data[3];
                const corners = [
                  {x, y},
                  {x: x + width, y},
                  {x, y: y + height},
                  {x: x + width, y: y + height}
                ]
                return !corners.some(corner => isPointInEraserRadius(corner, allCoordinates.mousePosition, eraserRadius));
              }

              // circle
              if (shape.ops?.[0]?.op === "move" && shape.ops?.[1]?.op === "circle") {
                const x = shape.ops[0].data[0];
                const y = shape.ops[0].data[1];
                return !isPointInEraserRadius({x: x, y: y}, allCoordinates.mousePosition, eraserRadius);
              }
              return true;
          })
          updateLines(newLines);

          // clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // draw all shapes
          Lines.forEach((shape) => {
            roughCanvas.draw(shape);
          });

          drawExistingFreeHandDrawings(freeHand);

          // eraser
          ctx.save();
          ctx.beginPath();
          ctx.globalCompositeOperation = "destination-out";
          ctx.arc(allCoordinates.mousePosition.x, allCoordinates.mousePosition.y, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
          break;

        case "free":
          if (allCoordinates.isCompleted && allCoordinates.currentPath) {
            freeHand.push([...allCoordinates.currentPath]);

            // redraw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Lines.forEach((shape) => {
              roughCanvas.draw(shape);
            });

            // draw all freehand drawings from saved
            drawExistingFreeHandDrawings(freeHand);
          } else {
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
        }

          // update the previous coordinates to current
          allCoordinates.initialPosition.current = {
            x: allCoordinates.mousePosition.x,
            y: allCoordinates.mousePosition.y,
          };
          break;

        case "line":
        case "rectangle":
        case "circle":
          // clear and redraw all shapes
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          //redraw
          Lines.forEach((shape) => {
            roughCanvas.draw(shape);
          });

          // current drawing of other users
          let currShape;
          if (allCoordinates.drawType === "line") {
            currShape = generator.line(
              allCoordinates.initialPosition.current.x,
              allCoordinates.initialPosition.current.y,
              allCoordinates.mousePosition.x,
              allCoordinates.mousePosition.y
            );
          } else if (allCoordinates.drawType == "rectangle") {
            currShape = generator.rectangle(
              allCoordinates.initialPosition.current.x,
              allCoordinates.initialPosition.current.y,
              allCoordinates.mousePosition.x - allCoordinates.initialPosition.current.x,
              allCoordinates.mousePosition.y - allCoordinates.initialPosition.current.y
            );
          } else if (allCoordinates.drawType == "circle") {
            const radius = Math.sqrt(
              Math.pow(allCoordinates.mousePosition.x - allCoordinates.initialPosition.current.x, 2) + Math.pow(allCoordinates.mousePosition.y - allCoordinates.initialPosition.current.y, 2)
            );
            currShape = generator.circle(
              allCoordinates.initialPosition.current.x,
              allCoordinates.initialPosition.current.y,
              radius*2
            );
          }

          if (currShape) {
            if (allCoordinates.isCompleted) {
              Lines.push(currShape);
            }
            roughCanvas.draw(currShape);
          }
          break;
      }
    });

    socket.on("closing", (closing: any) => {
      socket.removeAllListeners("otherUsersDraw");
    });

    // coordinated inside the eraser
    const isPointInEraserRadius = (point: point, eraser: point, radius: number) => {
      const x = point.x - eraser.x;
      const y = point.y - eraser.y;
      return Math.sqrt(x*x + y*y) <= radius;
    }

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
          drawType,
          isCompleted: false
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
          case "eraser":
            socket.emit("draw", DrawData);

            // removing freehand drawings inside
            const eraseRadius = 20;
            const newFreeHand = freeHand.filter((path) => {
              return !path.some(point => isPointInEraserRadius(point, mousePosition, eraseRadius));
            });
            updateFreeHand(newFreeHand);

            // lines and shapes
            const newLines = Lines.filter (shape => {
              // Line
              if (shape.ops?.[0]?.op === "move" && shape.ops?.[1]?.op === "lineTo") {
                const start = {x: shape.ops[0].data[0], y: shape.ops[0].data[1]};
                const end = {x: shape.ops[1].data[0], y: shape.ops[1].data[1]};
                return !isPointInEraserRadius(start, mousePosition, eraseRadius) && !isPointInEraserRadius(end, mousePosition, eraseRadius);
              }

              // Rectangle
              if (shape.ops?.[1]?.op === "rect") {
                const x = shape.ops[1].data[0];
                const y = shape.ops[1].data[1];
                const width = shape.ops[1].data[2];
                const height = shape.ops[1].data[3];
                const corners = [
                  {x, y},
                  {x: x + width, y},
                  {x, y: y + height},
                  {x: x + width, y: y + height}
                ];
                return !corners.some(corner => isPointInEraserRadius(corner, mousePosition, eraseRadius));
              }

              // Circle
              if (shape.ops?.[1]?.op === "circle") {
                const x = shape.ops[1].data[0];
                const y = shape.ops[1].data[1];
                return !isPointInEraserRadius({x, y}, mousePosition, eraseRadius);
              }
              return true;
            })

            updateLines(newLines);

            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // draw all shapes
            Lines.forEach((shape) => {
              roughCanvas.draw(shape);
            });

            drawExistingFreeHandDrawings(freeHand);

            // eraser
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.globalCompositeOperation = "destination-out";
            ctx.arc(mousePosition.x, mousePosition.y, eraseRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
            break;

          case "free":
            const freeDrawData: totalDrawDataType = {
              ...DrawData,
              currentPath: currentPath.current
            }
            socket.emit("draw", freeDrawData);

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
            socket.emit("draw", DrawData);
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
            socket.emit("draw", DrawData);
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
            socket.emit("draw", DrawData);
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

      const finalDrawData: totalDrawDataType = {
        initialPosition,
        mousePosition: endCoordinates,
        roomID,
        drawType,
        isCompleted: true
      };
      socket.emit("draw", finalDrawData);

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
        case "eraser":
          socket.emit("draw", finalDrawData);

          // clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // draw all shapes
          Lines.forEach((shape) => {
            roughCanvas.draw(shape);
          });

          drawExistingFreeHandDrawings(freeHand);
          break;

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
          const finalFreeHandData: totalDrawDataType = {
            initialPosition,
            mousePosition: endCoordinates,
            roomID,
            drawType,
            isCompleted: true,
            currentPath: currentPath.current
          };
          socket.emit("draw", finalFreeHandData);

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
