"use client";
import React, {useEffect, useState} from "react";
import { useDraw } from "../hooks/useDraw";
import {drawModeAtom, roomIDAtom} from "../Atoms/atoms";
import {useRecoilState, useRecoilValue} from "recoil";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import socket from "../components/SocketConnection";
import {Pen, Slash, RectangleHorizontal, Circle, Eraser} from "lucide-react";
import {Copytext} from "@/app/components/Copytext";

const page = () => {
    // accessing the real dom element with a custom hook
    const [drawType, setDrawType] = useState<string>("line");
    const { canvasRef } = useDraw(drawType);
    const roomID = useRecoilValue(roomIDAtom);
    const router = useRouter();
    const [canvasWidth, setWidth] = useState<number>(window.innerWidth);
    const [canvasHeight, setHeight] = useState<number>(window.innerHeight);

    // Add resize handler
    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleClose = () => {
        router.push("/");
    socket.emit("close", roomID);
  };

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen bg-white">
            {/* "items-center" align items vertically */}
            <nav className="flex w-full justify-between items-center space-x-10 p-5">
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

                    <div onClick={() => {
                        setDrawType("eraser")
                        console.log("eraser")
                    }} className="p-4 border-4 border-white hover:bg-gray-200 transition-colors duration-200 cursor-pointer rounded-xl">
                        <Eraser />
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
                height={canvasHeight - 100}
                className="border-black border-5"
                style={{
                    width: '100%',
                    height: 'calc(100vh - 100px)',
                    touchAction: 'none'
                }}
            />
        </div>
    );
};

export default page;
