const { keyBy, reverse } = require("lodash")
const rgba = require('color-rgba')
const { calculateBezierCurvePoint, oscillate } = require("./utils")

const whiteKeyMidiNoteNumbers = [
    21, // A0
    23,
    24,
    26,
    28,
    29,
    31,
]

const createKeyboard = (({ keyboardHeight, height, width }) => {
    const keyboardTop = height - keyboardHeight
    const keyboardWidth = width - 1
    const whiteKeyEdgeWidth = keyboardWidth / 52
    const blackKeyWidth = whiteKeyEdgeWidth * 0.583
    const halfBlackKeyWidth = blackKeyWidth * 0.5
    const blackKeyHeight = keyboardHeight * 0.65
    const octaveWidth = whiteKeyEdgeWidth * 7
    const sustainRectHeight = 10

    const xOctaveZero = 2 * whiteKeyEdgeWidth - octaveWidth

    const draw = (ctx, { playingNotes, sustainingNotes }) => {
        const playingNoteLookup = keyBy(playingNotes, 'midiNoteNumber')
        const sustainingNoteLookup = keyBy(sustainingNotes, 'midiNoteNumber')

        ctx.fillStyle = "white"
        ctx.fillRect(0, keyboardTop, keyboardWidth, keyboardHeight)

        ctx.lineWidth = 1
        ctx.strokeStyle = "black"

        for (let index = 0; index < 52; index++) {
            const octave = Math.floor(index / 7)
            const midiNoteNumber = whiteKeyMidiNoteNumbers[index % 7] + octave * 12
            if (playingNoteLookup[midiNoteNumber]) {
                ctx.fillStyle = playingNoteLookup[midiNoteNumber].color
                ctx.fillRect(
                    index * whiteKeyEdgeWidth,
                    keyboardTop,
                    whiteKeyEdgeWidth,
                    keyboardHeight
                )
            }
            if (sustainingNoteLookup[midiNoteNumber]) {
                ctx.fillStyle = sustainingNoteLookup[midiNoteNumber].color
                ctx.fillRect(
                    index * whiteKeyEdgeWidth,
                    keyboardTop,
                    whiteKeyEdgeWidth,
                    sustainRectHeight
                )
            }
            ctx.strokeRect(
                index * whiteKeyEdgeWidth,
                keyboardTop,
                whiteKeyEdgeWidth,
                keyboardHeight
            )
        }

        ctx.fillStyle = "black"

        const drawBlackKey = (x, midiNoteNumber) => {
            ctx.fillStyle = playingNoteLookup[midiNoteNumber]?.color || 'black'
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight)
            const sustainingNote = sustainingNoteLookup[midiNoteNumber]
            if (sustainingNote) {
                ctx.fillStyle = sustainingNote.color
                ctx.fillRect(x, keyboardTop, blackKeyWidth, sustainRectHeight)
            }
        }

        drawBlackKey(whiteKeyEdgeWidth - halfBlackKeyWidth, 22)

        const firstCSharpX = whiteKeyEdgeWidth * 3 - halfBlackKeyWidth
        const drawBlackKeyGroup = (x, numKeys, baseMidiNoteNumber) => {
            for (let index = 0; index < numKeys; index++) {
                drawBlackKey(x + index * whiteKeyEdgeWidth, baseMidiNoteNumber + 2 * index)
            }
        }
        for (let index = 0; index < 7; index++) {
            const cSharp = firstCSharpX + index * octaveWidth
            drawBlackKeyGroup(cSharp, 2, 25 + 12 * index)

            const fSharp = cSharp + 3 * whiteKeyEdgeWidth
            drawBlackKeyGroup(fSharp, 3, 30 + 12 * index)
        }
    }

    const getFlyingNotePosition = (() => {
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

        return (midiNoteNumber) => {
            if (midiNoteNumber < 21 || midiNoteNumber > 120) {
                return null
            }

            const octave = Math.floor((midiNoteNumber - 12) / 12)
            const xOctaveStart = xOctaveZero + octave * octaveWidth

            // C is 0, C# is 1, etc...
            const noteInOctave = midiNoteNumber % 12
            const notePositionInOctave = notePositionsInOctave[noteInOctave]

            return {
                xOffset: xOctaveStart + notePositionInOctave.xOffset,
                width: notePositionInOctave.width,
            }
        }
    })()

    return {
        draw,
        getFlyingNotePosition,
    }
})

const drawNote2d = ({ flyInHeight }) => (note, notePosition, ctx) => {
    ctx.fillRect(
        notePosition.xOffset,
        note.endProgress * flyInHeight,
        notePosition.width,
        note.startProgress * flyInHeight - note.endProgress * flyInHeight
    )
}

const drawNote3d = ({
    flyInHeight,
    fps,
    startingPoint = {
        x: 0.5,
        y: 0,
    },
    shape = 'linear',
    width,
    height
}) => {
    const startingPointY = height * startingPoint.y
    const getOscillatingStartPointOffsetX = oscillate(fps, startingPoint)

    const bezierCurve = () => {
        const easing = x => x * x * x // x => Math.pow(2, 10 * (x - 1))

        const calculateCurvePoint = (points, t) => calculateBezierCurvePoint(points, easing(t))

        const drawCurveSegment = (ctx, lineTo, points, t1, t2) => {
            t1 = Math.max(0, Math.min(1, t1))
            t2 = Math.max(0, Math.min(1, t2))
            const numLines = 14
            const stepSize = 1 / numLines * (t2 - t1)
            const coordinates = Array(numLines).fill().map((_, index) =>
                calculateCurvePoint(points, t1 + index * stepSize)
            )
            coordinates.push(calculateCurvePoint(points, t2))

            if (lineTo) {
                ctx.lineTo(coordinates[0].x, coordinates[0].y)
            }
            else {
                ctx.moveTo(coordinates[0].x, coordinates[0].y)
            }
            coordinates.slice(1).forEach(point => {
                ctx.lineTo(point.x, point.y)
            })
        }

        return (note, notePosition, startingPoint, ctx) => {
            const leftSidePoints = [
                {
                    x: startingPoint.x,
                    y: startingPoint.y,
                },
                {
                    x: startingPoint.x + (notePosition.xOffset - startingPoint.x) * 0.75,
                    y: startingPoint.y,
                },
                {
                    x: notePosition.xOffset,
                    y: flyInHeight,
                }
            ]
            const rightSidePoints = [leftSidePoints[0]].concat(leftSidePoints.slice(1).map(point => ({
                x: point.x + notePosition.width,
                y: point.y,
            })))
    
            ctx.beginPath()
            drawCurveSegment(ctx, false, leftSidePoints, note.endProgress, note.startProgress)
            drawCurveSegment(ctx, true, rightSidePoints, note.startProgress, note.endProgress)
            ctx.closePath()
            ctx.fill()
        }
    }

    const linear = () => {
        const easing = x => Math.pow(2, 10 * (x - 1))
        return (note, notePosition, startingPoint, ctx) => {
            const flyingNoteLocation = {
                front: {
                    x: startingPoint.x + (notePosition.xOffset - startingPoint.x) * easing(note.startProgress),
                    y: startingPoint.y + (flyInHeight - startingPoint.y) * easing(note.startProgress),
                    width: notePosition.width * easing(note.startProgress),
                    height: 2 // 0.2 * keyboardHeight * easing(note.startProgress)
                },
                back: {
                    x: startingPoint.x + (notePosition.xOffset - startingPoint.x) * easing(note.endProgress),
                    y: startingPoint.y + (flyInHeight - startingPoint.y) * easing(note.endProgress),
                    width: notePosition.width * easing(note.endProgress),
                    height: 2 // 0.2 * keyboardHeight * easing(note.endProgress)
                }
            }
            ctx.fillRect(
                flyingNoteLocation.front.x,
                flyingNoteLocation.front.y,
                flyingNoteLocation.front.width,
                flyingNoteLocation.front.height
            )
            ctx.fillRect(
                flyingNoteLocation.back.x,
                flyingNoteLocation.back.y,
                flyingNoteLocation.back.width,
                flyingNoteLocation.back.height
            )
            ctx.beginPath()
            if (flyingNoteLocation.front.x < startingPoint.x) {
                ctx.moveTo(flyingNoteLocation.front.x, flyingNoteLocation.front.y)
                ctx.lineTo(flyingNoteLocation.back.x, flyingNoteLocation.back.y)
                ctx.lineTo(flyingNoteLocation.back.x + flyingNoteLocation.back.width, flyingNoteLocation.back.y + flyingNoteLocation.back.height)
                ctx.lineTo(flyingNoteLocation.front.x + flyingNoteLocation.front.width, flyingNoteLocation.front.y + flyingNoteLocation.front.height)
            }
            else {
                ctx.moveTo(flyingNoteLocation.front.x, flyingNoteLocation.front.y + flyingNoteLocation.front.height)
                ctx.lineTo(flyingNoteLocation.back.x, flyingNoteLocation.back.y + flyingNoteLocation.back.height)
                ctx.lineTo(flyingNoteLocation.back.x + flyingNoteLocation.back.width, flyingNoteLocation.back.y)
                ctx.lineTo(flyingNoteLocation.front.x + flyingNoteLocation.front.width, flyingNoteLocation.front.y)
            }
            ctx.fill()
        }
    }

    const flyInPathShapes = { linear, bezierCurve }
    const draw = flyInPathShapes[shape]()

    return (note, notePosition, ctx, frameIndex) => {
        const centerStartingPointX = width * getOscillatingStartPointOffsetX(frameIndex)
        const noteStartingPoint = {
            x: centerStartingPointX + 0.2 * (notePosition.xOffset - centerStartingPointX),
            y: startingPointY
        }
        draw(note, notePosition, noteStartingPoint, ctx)
    }
}

const flyingNoteDrawers = {
    'topDown': drawNote2d,
    '3d': drawNote3d,
}

module.exports = ({
    keyboardHeightProportion = 0.1,
    flyIn: flyInConfig,
    fps,
    impactSize = 60,
    width = 480,
    height = 360
}) => {
    const keyboardHeight = height * (keyboardHeightProportion)
    const flyInHeight = height - keyboardHeight

    const keyboard = createKeyboard({
        keyboardHeight,
        height,
        width,
    })

    const drawNote = flyingNoteDrawers[flyInConfig.type || '2d']({
        ...flyInConfig,
        flyInHeight,
        fps,
        width,
        height,
    })

    const drawFrame = (ctx, frame, frameIndex) => {
        // flying notes
        const { flyingNotes } = frame
        const reversed = reverse([
            ...flyingNotes
        ])
        reversed.forEach(note => {
            ctx.strokeStyle = note.color
            ctx.fillStyle = note.color
            ctx.shadowColor = note.color
            ctx.shadowBlur = note.isPlaying ? 10 : 0
            const notePosition = keyboard.getFlyingNotePosition(note.midiNoteNumber)
            if (notePosition) {
                drawNote(note, notePosition, ctx, frameIndex)
            }
        })
        ctx.shadowBlur = 0

        // note impact shockwaves
        ctx.lineWidth = 2
        const { noteImpacts } = frame
        noteImpacts.forEach((noteImpact) => {
            const { midiNoteNumber, progress } = noteImpact
            const notePosition = keyboard.getFlyingNotePosition(midiNoteNumber)
            if (notePosition) {
                const [r, g, b] = rgba(noteImpact.color)
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(1 - progress) * 0.25})`

                const easingProgress = 1 // -Math.pow(2, -10 * progress) + 1
                const impactCircle = {
                    x: notePosition.xOffset + 0.5 * notePosition.width,
                    y: flyInHeight,
                    r: notePosition.width + 0.5 * impactSize * progress * easingProgress,
                }
                ctx.beginPath()
                ctx.arc(
                    impactCircle.x,
                    impactCircle.y,
                    impactCircle.r,
                    0,
                    2 * Math.PI
                )
                ctx.fill()
            }
        })

        // keyboard and playing/sustained notes
        keyboard.draw(ctx, frame)

        // particles
        const { particles } = frame
        particles.forEach(particle => {
            const { midiNoteNumber, origin: particleOrigin, progress, direction, color } = particle
            const notePosition = keyboard.getFlyingNotePosition(midiNoteNumber)
            if(notePosition) {
                const origin = {
                    x: notePosition.xOffset + particleOrigin * notePosition.width,
                    y: flyInHeight
                }
                const angle = direction * Math.PI // in radians
                const particleCoords = {
                    x: origin.x + Math.cos(angle) * progress * 100,
                    y: origin.y - Math.sin(angle) * progress * 100
                }
                const [r, g, b] = rgba(color)
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${1 - progress})`
                ctx.fillRect(particleCoords.x, particleCoords.y, 1, 1)
            }
        })
    }

    return { drawFrame }
}
