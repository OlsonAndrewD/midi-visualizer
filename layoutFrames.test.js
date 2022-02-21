const { concat, curryRight, first, last, round: lodashRound } = require('lodash')
const round = curryRight(lodashRound)(2)
const layoutFrames = require('./layoutFrames')

const fillArray = (numberOfItems, itemCreator) => Array(numberOfItems).fill(0).map(itemCreator)

describe("frame layout", () => {
    it("animates a single note through the viewport", () => {
        const frames = layoutFrames({
            config: {
                fps: 10,
                noteApproachTime: 1000,
            },
            song: {
                notes: [
                    {
                        start: 0,
                        end: 1000,
                        midiNoteNumber: 0,
                    }
                ]
            }
        })

        const flyingIn = fillArray(10, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1),
                    endProgress: round(index * 0.1 - 1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingOut = fillArray(10, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1 + 1),
                    endProgress: round(index * 0.1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: [{ midiNoteNumber: 0 }]
        }))

        const expectedFrames = concat(flyingIn, flyingOut).map((frame, frameIndex) => ({
            ...frame,
            frameIndex
        }))
        expect(frames.length).toBe(expectedFrames.length)
        expect(frames).toEqual(expectedFrames)
    })

    it("animates a shorter note through the viewport", () => {
        const frames = layoutFrames({
            config: {
                fps: 10,
                noteApproachTime: 1000,
            },
            song: {
                notes: [
                    {
                        start: 200,
                        end: 800,
                        midiNoteNumber: 0,
                    }
                ]
            }
        })

        const twoEmptyFrames = fillArray(2, () => ({
            flyingNotes: [],
            playingNotes: []
        }))

        const flyingIn = fillArray(6, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1),
                    endProgress: round(index * 0.1 - 0.6),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingCloser = fillArray(4, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(0.6 + index * 0.1),
                    endProgress: round(index * 0.1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingOut = fillArray(6, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(1 + index * 0.1),
                    endProgress: round(0.4 + index * 0.1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: [{ midiNoteNumber: 0 }]
        }))

        const expectedFrames = concat(twoEmptyFrames, flyingIn, flyingCloser, flyingOut).map((frame, frameIndex) => ({
            ...frame,
            frameIndex
        }))
        expect(frames.length).toBe(expectedFrames.length)
        expect(frames).toEqual(expectedFrames)
    })

    it("animates a longer note through the viewport", () => {
        const frames = layoutFrames({
            config: {
                fps: 10,
                noteApproachTime: 1000,
            },
            song: {
                notes: [
                    {
                        start: 200,
                        end: 1500,
                        midiNoteNumber: 0,
                    }
                ]
            }
        })

        const emptyFrames = fillArray(2, () => ({
            flyingNotes: [],
            playingNotes: []
        }))

        const flyingIn = fillArray(10, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1),
                    endProgress: round(index * 0.1 - 1.3),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const playing = fillArray(13, (_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(1 + index * 0.1),
                    endProgress: round(1 - 1.3 + index * 0.1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: [{ midiNoteNumber: 0 }]
        }))

        const expectedFrames = concat(emptyFrames, flyingIn, playing).map((frame, frameIndex) => ({
            ...frame,
            frameIndex
        }))
        expect(frames.length).toBe(expectedFrames.length)
        expect(frames).toEqual(expectedFrames)
    })

    xit("rounds down when choosing frame numbers, so you see before you hear", () => {
        const frames = layoutFrames({
            config: {
                fps: 10,
                noteApproachTime: 1000,
            },
            song: {
                notes: [
                    {
                        start: 50,
                        end: 1050,
                        midiNoteNumber: 127,
                    }
                ]
            }
        })
        expect(first(frames)).toEqual({
            frameIndex: 0,
            flyingNotes: [
                {
                    startProgress: -0.05,
                    endProgress: -1.05,
                    midiNoteNumber: 127,
                }
            ],
            playingNotes: [],
        })
        expect(frames[20]).toEqual({
            frameIndex: 20,
            flyingNotes: [
                {
                    startProgress: 1.95,
                    endProgress: 0.95,
                    midiNoteNumber: 127,
                }
            ],
            playingNotes: [{ midiNoteNumber: 127 }]
        })
    })
})
