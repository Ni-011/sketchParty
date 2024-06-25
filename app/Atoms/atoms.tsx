import { atom } from "recoil";

const roomIDAtom = atom({
  key: "roomID",
  default: "",
});

export { roomIDAtom };
