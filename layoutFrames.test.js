const { concat, curryRight, first, round: lodashRound } = require('lodash')
const round = curryRight(lodashRound)(2)
const layoutFrames = require('./layoutFrames')

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

        const flyingIn = Array(10).fill(0).map((_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1),
                    endProgress: round(index * 0.1 - 1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingOut = Array(10).fill(0).map((_, index) => ({
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

        const twoEmptyFrames = Array(2).fill(0).map(() => ({
            flyingNotes: [],
            playingNotes: []
        }))
        
        const flyingIn = Array(6).fill(0).map((_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(index * 0.1),
                    endProgress: round(index * 0.1 - 0.6),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingCloser = Array(4).fill(0).map((_, index) => ({
            flyingNotes: [
                {
                    startProgress: round(0.6 + index * 0.1),
                    endProgress: round(index * 0.1),
                    midiNoteNumber: 0,
                }
            ],
            playingNotes: []
        }))

        const flyingOut = Array(6).fill(0).map((_, index) => ({
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
        console.log(JSON.stringify(frames, null, 4))
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

        // TODO: Expect stuff
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
                        start: 99, // just a tad before 2nd frame starts
                        end: 999, // just a tad before 11th frame starts
                        midiNoteNumber: 1,
                    }
                ]
            }
        })
        expect(first(frames)).toEqual({
            flyingNotes: [
                {
                    // TODO: Progress values
                    midiNoteNumber: 1,
                }
            ],
            playingNotes: [],
        })
        // TODO: More expectations
    })
})
