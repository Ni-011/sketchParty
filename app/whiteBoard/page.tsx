"use client";
import React, {useEffect, useState} from "react";
import { useDraw } from "../hooks/useDraw";
import {drawModeAtom, roomIDAtom} from "../Atoms/atoms";
import {useRecoilState, useRecoilValue} from "recoil";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import socket from "../components/SocketConnection";
import {Pen, Slash, RectangleHorizontal, Circle} from "lucide-react";
import {Copytext} from "@/app/components/Copytext";

const page = () => {
    // accessing the real dom element with a custom hook
    const [drawType, setDrawType] = useState<string>("line");
    const { canvasRef } = useDraw(drawType);
    const roomID = useRecoilValue(roomIDAtom);
    const router = useRouter();
    const [canvasWidth, setWidth] = useState<number>(window.innerWidth);
    const [canvasHeight, setHeight] = useState<number>(window.innerHeight);

    const handleClose = () => {
        router.push("/");
    socket.emit("close", roomID);
  };

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen bg-white p-10">
            {/* "items-center" align items vertically */}
            <nav className="flex w-full justify-between items-center space-x-10 mt-20 p-5">
                <button onClick={handleClose}>
                    <Image src="/close.svg" alt="close" width={30} height={30}/>
                </button>
                <div className="flex justify-between w-[30%]">
                    <div onClick={() => {
                        setDrawType("free")
                        console.log("free")
                    }} className="p-4 border-4 border-white hover:bg-gray-200 transition-colors duration-200 rounded-xl cursor-pointer">
                    <Pen  />
                    </div>

                    <div onClick={() => {
                        setDrawType("line")
                        console.log("line")
                    }} className="p-4 border-4 border-white hover:bg-gray-200 transition-colors duration-200 rounded-xl cursor-pointer">
                    <Slash  />
                    </div>

                    <div onClick={() => {
                        setDrawType("rectangle")
                        console.log("rectangle")
                    }} className="p-4 border-4 border-white hover:bg-gray-200 transition-colors duration-200 cursor-pointer rounded-xl">
                    <RectangleHorizontal  />
                    </div>

                    <div onClick={() => {
                        setDrawType("circle")
                        console.log("circle")
                    }} className="p-4 border-4 border-white hover:bg-gray-200 transition-colors duration-200 cursor-pointer rounded-xl">
                        <Circle />
                    </div>
                </div>
                <p className="flex gap-2">
                    <b className="text-xl">RoomID: </b>
                    {roomID}
                    <Copytext text={roomID} />
                </p>
            </nav>
            {/* create a canvas give refference to canvasRef */}
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="border-black border-5"
            />
        </div>
    );
};

export default page;
