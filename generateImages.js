const { createCanvas } = require("canvas")
const { writeFileSync, mkdirSync, existsSync, rmSync } = require("fs")

const createKeyboard = (({ keyboardHeight, height, width }) => {
    const keyboardTop = height - keyboardHeight
    const keyboardWidth = width - 1
    const whiteKeyEdgeWidth = keyboardWidth / 52
    const blackKeyWidth = whiteKeyEdgeWidth * 0.583
    const halfBlackKeyWidth = blackKeyWidth * 0.5
    const blackKeyHeight = keyboardHeight * 0.65
    const octaveWidth = whiteKeyEdgeWidth * 7

    const xOctaveZero = 2 * whiteKeyEdgeWidth - octaveWidth

    const draw = (ctx) => {
        ctx.fillStyle = "white"
        ctx.fillRect(0, keyboardTop, keyboardWidth, keyboardHeight)

        ctx.lineWidth = 1
        ctx.strokeStyle = "black"

        for (let index = 0; index < 52; index++) {
            ctx.strokeRect(
                index * whiteKeyEdgeWidth,
                keyboardTop,
                whiteKeyEdgeWidth,
                keyboardHeight
            )
        }

        ctx.fillStyle = "black"

        const drawBlackKey = (x) => {
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight)
        }

        drawBlackKey(whiteKeyEdgeWidth - halfBlackKeyWidth)

        const firstCSharpX = whiteKeyEdgeWidth * 3 - halfBlackKeyWidth
        const drawBlackKeyGroup = (x, numKeys) => {
            for (let index = 0; index < numKeys; index++) {
                drawBlackKey(x + index * whiteKeyEdgeWidth)
            }
        }
        for (let index = 0; index < 7; index++) {
            const cSharp = firstCSharpX + index * octaveWidth
            drawBlackKeyGroup(cSharp, 2)

            const fSharp = cSharp + 3 * whiteKeyEdgeWidth
            drawBlackKeyGroup(fSharp, 3)
        }
    }

    const notePositionsInOctave = (() => {
        const whiteKeyFlyInWidth = whiteKeyEdgeWidth - 2
        const whiteKeyOffset = 1
        return {
            0: { // C
                xOffset: whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            1: { // C#
                xOffset: whiteKeyEdgeWidth - halfBlackKeyWidth,
                width: blackKeyWidth,
            },
            2: { // D
                xOffset: whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            3: { // D#
                xOffset: 2 * whiteKeyEdgeWidth - halfBlackKeyWidth,
                width: blackKeyWidth,
            },
            4: { // E
                xOffset: 2 * whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            5: { // F
                xOffset: 3 * whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            6: { // F#
                xOffset: 4 * whiteKeyEdgeWidth - halfBlackKeyWidth,
                width: blackKeyWidth,
            },
            7: { // G
                xOffset: 4 * whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            8: { // G#
                xOffset: 5 * whiteKeyEdgeWidth - halfBlackKeyWidth,
                width: blackKeyWidth,
            },
            9: { // A
                xOffset: 5 * whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
            10: { // A#
                xOffset: 6 * whiteKeyEdgeWidth - halfBlackKeyWidth,
                width: blackKeyWidth,
            },
            11: { // B
                xOffset: 6 * whiteKeyEdgeWidth + whiteKeyOffset,
                width: whiteKeyFlyInWidth,
            },
        }
    })()

    const getNotePosition = (midiNoteNumber) => {
        if (midiNoteNumber < 33 || midiNoteNumber > 120) {
            return null
        }

        const octave = Math.floor((midiNoteNumber - 24) / 12)
        const xOctaveStart = xOctaveZero + octave * octaveWidth

        // C is 0, C# is 1, etc...
        const noteInOctave = midiNoteNumber % 12
        const notePositionInOctave = notePositionsInOctave[noteInOctave]

        return {
            xOffset: xOctaveStart + notePositionInOctave.xOffset,
            width: notePositionInOctave.width,
        }
    }

    return {
        draw,
        getNotePosition,
    }
})

module.exports = (frames, width = 480, height = 360) => {
    const keyboardHeight = height * 0.1
    const flyInHeight = height - keyboardHeight
    console.log('flyInHeight', flyInHeight)
    const keyboard = createKeyboard({
        keyboardHeight,
        height,
        width,
    })

    function drawFrame(ctx, frame) {
        /** @type {CanvasRenderingContext2D} */
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, width, height)

        keyboard.draw(ctx)

        ctx.fillStyle = "white"
        frame.flyingNotes.forEach(note => {
            const notePosition = keyboard.getNotePosition(note.midiNoteNumber)
            if (notePosition) {
                // if (note.startProgress > 1) {
                //     console.log('startProgress', startProgress)
                // }
                ctx.fillRect(
                    notePosition.xOffset,
                    note.endProgress * flyInHeight,
                    notePosition.width,
                    note.startProgress * flyInHeight - note.endProgress * flyInHeight
                )
            }
        })
    }
    /** @type {HTMLCanvasElement} */
    var canvas = createCanvas(width, height)
    if (existsSync("./frames")) {
        rmSync("./frames", { recursive: true })
    }
    mkdirSync("./frames")
    var ctx = canvas.getContext("2d")
    console.log("")
    frames.forEach((frame, i) => {
        drawFrame(ctx, frame)
        var b64 = canvas.toDataURL("image/png").split("data:image/png;base64,")[1]
        writeFileSync(`./frames/frame${('' + i).padStart(7, '0')}.png`, b64, "base64")
        // if (i > 0 && i % 100 === 0) {
        //     console.log(`  done with ${i}...`)
        // }
        console.log(`\x1b[1A\x1b[2K\rDone with ${i}/${frames.length} frames...`)
    })
    console.log("\x1b[1A\x1b[2K\r\x1b[1A")
    return "frames"
}