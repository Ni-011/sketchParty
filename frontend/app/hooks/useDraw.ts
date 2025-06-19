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
            console.log("Shape data:", shape);

            // Line
            if (shape.shape === "line") {
              const path = shape.sets[0].ops;
              const start = {x: path[0].data[0], y: path[0].data[1]};
              const end = {x: path[1].data[0], y: path[1].data[1]};
              const isErased = isPointInEraserRadius(start, allCoordinates.mousePosition, eraserRadius) || 
                               isPointInEraserRadius(end, allCoordinates.mousePosition, eraserRadius);
              console.log("Line erased:", isErased);
              return !isErased;
            }

            // Rectangle
            if (shape.shape === "rectangle") {
              const path = shape.sets[0].ops;
              const x = path[0].data[0];
              const y = path[0].data[1];
              const width = path[1].data[2];
              const height = path[1].data[3];
              const corners = [
                {x, y},
                {x: x + width, y},
                {x, y: y + height},
                {x: x + width, y: y + height}
              ];
              const isErased = corners.some(corner => isPointInEraserRadius(corner, allCoordinates.mousePosition, eraserRadius));
              console.log("Rectangle erased:", isErased);
              return !isErased;
            }

            // Circle
            if (shape.shape === "circle") {
              const path = shape.sets[0].ops;
              const x = path[0].data[0];
              const y = path[0].data[1];
              const radius = path[1].data[2] / 2;
              const points = [
                {x, y}, // center
                {x: x + radius, y}, // right
                {x: x - radius, y}, // left
                {x, y: y + radius}, // bottom
                {x, y: y - radius}  // top
              ];
              const isErased = points.some(point => isPointInEraserRadius(point, allCoordinates.mousePosition, eraserRadius));
              console.log("Circle erased:", isErased);
              return !isErased;
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
          drawExistingFreeHandDrawings(freeHand);

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

    // handle clear canvas event from other users
    socket.on("clearCanvas", () => {
      if (!ctx || !canvas) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Clear the stored drawing data
      updateLines([]);
      updateFreeHand([]);
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

            const eraserRadius = 20;
            // Filter freehand
            const newFreeHand = freeHand.filter((path) => {
              return !path.some(point => isPointInEraserRadius(point, mousePosition, eraserRadius));
            });
            updateFreeHand(newFreeHand);

            // Filter Lines shapes
            const newLines = Lines.filter(shape => {
              console.log("Shape being checked:", shape);

              // Helper function to check if a line segment intersects with eraser circle
              const isLineIntersectingEraser = (x1: number, y1: number, x2: number, y2: number) => {
                // Get vector between points
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                
                if (len === 0) return false;
                
                // Get closest point on line to eraser center
                const t = Math.max(0, Math.min(1, (
                  (mousePosition.x - x1) * dx +
                  (mousePosition.y - y1) * dy
                ) / (len * len)));
                
                const closestX = x1 + t * dx;
                const closestY = y1 + t * dy;
                
                // Check if closest point is within eraser radius
                const distance = Math.sqrt(
                  Math.pow(mousePosition.x - closestX, 2) +
                  Math.pow(mousePosition.y - closestY, 2)
                );
                
                return distance <= eraserRadius;
              };

              // Line
              if (shape.shape === "line") {
                const path = shape.sets[0].ops;
                const start = {x: path[0].data[0], y: path[0].data[1]};
                const end = {x: path[1].data[0], y: path[1].data[1]};
                
                return !isLineIntersectingEraser(start.x, start.y, end.x, end.y);
              }

              // Rectangle
              if (shape.shape === "rectangle") {
                const path = shape.sets[0].ops;
                const x = path[0].data[0];
                const y = path[0].data[1];
                const width = path[1].data[2];
                const height = path[1].data[3];
                
                // Normalize rectangle coordinates (in case width or height is negative)
                const [rectX, rectWidth] = width >= 0 ? [x, width] : [x + width, -width];
                const [rectY, rectHeight] = height >= 0 ? [y, height] : [y + height, -height];
                
                // Calculate distance from eraser center to nearest point on rectangle
                const dx = Math.max(rectX - mousePosition.x, 0, mousePosition.x - (rectX + rectWidth));
                const dy = Math.max(rectY - mousePosition.y, 0, mousePosition.y - (rectY + rectHeight));
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                console.log('Rectangle:', {
                  x: rectX,
                  y: rectY,
                  width: rectWidth,
                  height: rectHeight,
                  eraserX: mousePosition.x,
                  eraserY: mousePosition.y,
                  distance: distance,
                  eraserRadius: eraserRadius
                });
                
                // Only erase if the eraser actually touches the rectangle
                return distance > eraserRadius;
              }

              // Circle
              if (shape.shape === "circle") {
                const path = shape.sets[0].ops;
                const centerX = path[0].data[0];
                const centerY = path[0].data[1];
                const shapeRadius = path[1].data[2] / 2;
                
                // Distance between circle center and eraser center
                const distance = Math.sqrt(
                  Math.pow(mousePosition.x - centerX, 2) +
                  Math.pow(mousePosition.y - centerY, 2)
                );
                
                return distance > (eraserRadius + shapeRadius);
              }

              return true;
            });
            updateLines(newLines);

            // Clear and redraw
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              Lines.forEach(shape => {
                roughCanvas.draw(shape);
              });
              drawExistingFreeHandDrawings(freeHand);

              // Show eraser cursor
              ctx.save();
              ctx.beginPath();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 1;
              ctx.arc(mousePosition.x, mousePosition.y, eraserRadius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
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
      socket.off("clearCanvas");
    };
  }, [drawType, roomID]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear the stored drawing data
    updateLines([]);
    updateFreeHand([]);
  };

  return { canvasRef };
}
