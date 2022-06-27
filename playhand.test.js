import { cardStringToObj } from "./playhand";

describe("cardStringToObj", () => {
    test("converts 2-card hand", () => {
        const hand = "2C?3C";
        const expected = [
            { suit: "C", rank: "3", ranknum: 1 },
            { suit: "C", rank: "2", ranknum: 0 },
        ];
        expect(cardStringToObj(hand)).toEqual(expected);
    })

    test("converts face cards", () => {
        const hand = "TD?QS";
        const expected = [
            { suit: "S", rank: "Q", ranknum: 10 },
            { suit: "D", rank: "T", ranknum: 8 },
        ]
        expect(cardStringToObj(hand)).toEqual(expected);
    })
})