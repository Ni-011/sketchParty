"use client";
import React, {useEffect, useState} from "react";
import { useDraw } from "../hooks/useDraw";
import {drawModeAtom, roomIDAtom} from "../Atoms/atoms";
import {useRecoilState, useRecoilValue} from "recoil";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import socket from "../components/SocketConnection";
import {Pen, Slash, RectangleHorizontal, Circle, Eraser, Trash2, X} from "lucide-react";
import {Copytext} from "@/app/components/Copytext";

const WhiteBoard = () => {
    // accessing the real dom element with a custom hook
    const [drawType, setDrawType] = useState<string>("line");
    const { canvasRef } = useDraw(drawType);
    const roomID = useRecoilValue(roomIDAtom);
    const router = useRouter();
    const [canvasWidth, setWidth] = useState<number>(800); // default width
    const [canvasHeight, setHeight] = useState<number>(600); // default height

    // Add resize handler
    useEffect(() => {
        // Set initial dimensions
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
        
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

    const handleClearAll = () => {
        socket.emit("clearAll", roomID);
    };

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen bg-white">
            {/* Responsive navbar */}
            <nav className="flex flex-col sm:flex-row w-full justify-between items-center gap-3 sm:gap-5 p-3 sm:p-5">
                {/* Top row on mobile: Close button and Room ID */}
                <div className="flex w-full sm:w-auto justify-between sm:justify-start items-center">
                    <button onClick={handleClose} className="flex-shrink-0 p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <X className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />
                    </button>
                    
                    {/* Room ID - show on mobile in top row */}
                    <div className="flex sm:hidden gap-2 items-center">
                        <b className="text-sm whitespace-nowrap">Room: </b>
                        <span className="flex items-center gap-1">
                            <span className="text-xs truncate max-w-[80px]">{roomID}</span>
                            <Copytext text={roomID} />
                        </span>
                    </div>
                </div>

                {/* Tools section - responsive grid */}
                <div className="flex justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div 
                        onClick={() => {
                            setDrawType("free")
                            console.log("free")
                        }} 
                        className={`p-2 sm:p-4 border-4 border-white hover:bg-gray-100 transition-colors duration-200 rounded-xl cursor-pointer
                            ${drawType === "free" ? "bg-gray-100" : ""}`}
                    >
                        <Pen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div 
                        onClick={() => {
                            setDrawType("line")
                            console.log("line")
                        }} 
                        className={`p-2 sm:p-4 border-4 border-white hover:bg-gray-100 transition-colors duration-200 rounded-xl cursor-pointer
                            ${drawType === "line" ? "bg-gray-100" : ""}`}
                    >
                        <Slash className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div 
                        onClick={() => {
                            setDrawType("rectangle")
                            console.log("rectangle")
                        }} 
                        className={`p-2 sm:p-4 border-4 border-white hover:bg-gray-100 transition-colors duration-200 cursor-pointer rounded-xl
                            ${drawType === "rectangle" ? "bg-gray-100" : ""}`}
                    >
                        <RectangleHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div 
                        onClick={() => {
                            setDrawType("circle")
                            console.log("circle")
                        }} 
                        className={`p-2 sm:p-4 border-4 border-white hover:bg-gray-100 transition-colors duration-200 cursor-pointer rounded-xl
                            ${drawType === "circle" ? "bg-gray-100" : ""}`}
                    >
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div 
                        onClick={() => {
                            setDrawType("eraser")
                            console.log("eraser")
                        }} 
                        className={`p-2 sm:p-4 border-4 border-white hover:bg-gray-100 transition-colors duration-200 cursor-pointer rounded-xl
                            ${drawType === "eraser" ? "bg-gray-100" : ""}`}
                    >
                        <Eraser className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div 
                        onClick={handleClearAll} 
                        className="p-2 sm:p-4 border-4 border-white hover:bg-red-100 hover:border-red-200 transition-colors duration-200 cursor-pointer rounded-xl"
                        title="Clear All"
                    >
                        <Trash2 className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                </div>

                {/* Room ID section - hidden on mobile, shown on desktop */}
                <div className="hidden sm:flex gap-2 md:flex-row flex-col items-end">
                    <b className="text-xl whitespace-nowrap">RoomID: </b>
                    <span className="flex items-center gap-2">
                        <span className="text-sm md:text-base truncate max-w-[100px] md:max-w-[200px]">{roomID}</span>
                        <Copytext text={roomID} />
                    </span>
                </div>
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

export default WhiteBoard;
