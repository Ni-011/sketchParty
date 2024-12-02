interface point {
    x: number;
    y: number;
}

let Lines: any[] = [];
let freeHand: Array<Array<point>> = [];

export const updateFreeHand = (newFreeHand: Array<Array<point>>) => {
    freeHand = newFreeHand;
}

export const updateLines = (newLines: any[]) => {
    Lines = newLines;
}

export {Lines, freeHand};