"use client";
import React, { FC } from "react";
import { useDraw } from "./hooks/useDraw";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  // accessing the real dom element with a custom hook
  const { canvasRef } = useDraw();

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-white">
      {/* create a canvas give refference to canvasRef */}
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="border-black border-5"
      />
    </div>
  );
};

export default page;
