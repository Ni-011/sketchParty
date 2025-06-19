"use client";
import React, { FC, useState } from "react";
import { useDraw } from "./hooks/useDraw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UUID } from "crypto";
import { uuidv4 } from "uuidv7";
import socket from "./components/SocketConnection";
import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { roomIDAtom } from "./Atoms/atoms";
import {Copytext} from "@/app/components/Copytext";

interface PageProps {}

const Page: FC<PageProps> = ({}) => {
  const router = useRouter();

  const [UUID, setUUID] = useState<string>("");
  const [roomID, setRoomID] = useRecoilState(roomIDAtom);

  const computeUUID = (): void => {
    const newUUID = String(uuidv4().substring(0, 8));
    setUUID(newUUID);
  };

  // when join is clicked, send request to server to join the room
  const JoinRoom = (): void => {
    socket.emit("joinRequest", roomID);
  };

  const handleInput = (e: any) => {
    setRoomID(e.target.value);
  };

  // if server sends succesful response, redirect to whiteboard
  socket.on("RoomJoined", (success: boolean) => {
    if (success) {
      router.push("/whiteBoard");
    }
  });

  return (
    // room join and generate id buttons
    <div className="flex flex-col items-center h-screen p-10">
      <div className="flex w-full max-w-md items-center space-x-2 mt-auto">
        <Input onChange={handleInput} type="text" placeholder="Enter Room Id" />
        <Button
          onClick={JoinRoom}
          className="h-[55px] px-10 text-xl"
          type="submit"
        >
          Join
        </Button>
      </div>
      <div className="flex w-full max-w-md items-center space-x-2 mt-auto">
        <Button
          onClick={computeUUID}
          className="h-[55px] px-10 text-xl"
          type="submit"
        >
          Generate ID
        </Button>
        <p className="text-xl">{UUID}</p>
        <Copytext text={UUID} />
      </div>
    </div>
  );
};

export default Page;
