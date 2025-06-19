import { atom } from "recoil";

const roomIDAtom = atom({
  key: "roomID",
  default: "",
});

const drawModeAtom = atom ({
  key: "drawMode",
  default: "line"
});

export { roomIDAtom, drawModeAtom };
