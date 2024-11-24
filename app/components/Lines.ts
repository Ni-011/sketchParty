import {useRef} from "react";

interface point {
    x: number;
    y: number;
}

const Lines: any[] = [];
const freeHand: Array<Array<point>> = [];

export {Lines, freeHand};