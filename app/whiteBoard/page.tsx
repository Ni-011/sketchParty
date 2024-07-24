"use client";
import React from "react";
import { useDraw } from "../hooks/useDraw";
import { roomIDAtom } from "../Atoms/atoms";
import { useRecoilValue } from "recoil";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import socket from "../components/SocketConnection";

const page = () => {
  // accessing the real dom element with a custom hook
  const { canvasRef } = useDraw();
  const roomID = useRecoilValue(roomIDAtom);

  const router = useRouter();

  const handleClose = () => {
    router.push("/");
    socket.emit("close", roomID);
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen bg-white p-10">
      <nav className="flex w-full justify-between space-x-10 pt-10">
        <button onClick={handleClose}>
          <Image src="/close.svg" alt="close" width={40} height={30} />
        </button>
        <p>
          <b className="text-xl">RoomID: </b>
          {roomID}
        </p>
      </nav>
      {/* create a canvas give refference to canvasRef */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="border-black border-5"
      />
    </div>
  );
};

export default page;
