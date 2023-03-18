const { keyBy, reverse, noop } = require("lodash")
const rgba = require('color-rgba')
const { calculateBezierCurvePoint, oscillate } = require("./utils")
const LinearPathParticle = require("../particles/linearPathParticle")
const BubbleParticle = require("../particles/bubbleParticle")
const RippleParticle = require("../particles/rippleParticle")
const { default: SvgPath } = require('svg-path-to-canvas')
const { create: createParticleSet } = require("../particles/particleSet")

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
    const sustainRectHeight = 5

    const whiteNotePitchBendOffsetX = (pitchBend) => (pitchBend || 0) * 0.8 * whiteKeyEdgeWidth
    const blackNotePitchBendOffsetX = (pitchBend) => (pitchBend || 0) * 0.8 * blackKeyWidth

    const xOctaveZero = 2 * whiteKeyEdgeWidth - octaveWidth

    const draw = (ctx, playingNotes, sustainingNotes) => {
        const playingNoteLookup = keyBy(playingNotes, 'sourceNote.midiNoteNumber')
        const sustainingNoteLookup = keyBy(sustainingNotes, 'sourceNote.midiNoteNumber')

        ctx.fillStyle = "white"
        ctx.fillRect(0, keyboardTop, keyboardWidth, keyboardHeight)

        ctx.lineWidth = 1
        ctx.strokeStyle = "black"

        for (let index = 0; index < 52; index++) {
            const octave = Math.floor(index / 7)
            const midiNoteNumber = whiteKeyMidiNoteNumbers[index % 7] + octave * 12
            const { sourceNote: playingNote, pitchBend: playingNotePitchBend } = playingNoteLookup[midiNoteNumber] || {}
            if (playingNote) {
                const pitchBendOffsetX = whiteNotePitchBendOffsetX(playingNotePitchBend)
                const gradient = ctx.createLinearGradient(
                    (index - 0.5) * whiteKeyEdgeWidth + pitchBendOffsetX,
                    keyboardTop,
                    (index + 1.5) * whiteKeyEdgeWidth + pitchBendOffsetX,
                    keyboardTop
                )
                gradient.addColorStop(0, 'white')
                gradient.addColorStop(0.3, playingNote.color.fillStyle)
                gradient.addColorStop(0.7, playingNote.color.fillStyle)
                gradient.addColorStop(1, 'white')
                ctx.fillStyle = gradient
                ctx.fillRect(
                    index * whiteKeyEdgeWidth, // + Math.max(0, pitchBendOffsetX),
                    keyboardTop,
                    whiteKeyEdgeWidth, // - Math.abs(pitchBendOffsetX),
                    keyboardHeight
                )
            }
            const { sourceNote: sustainingNote, pitchBend: sustainingNotePitchBend } = sustainingNoteLookup[midiNoteNumber] || {}
            if (playingNote || sustainingNote) {
                const note = sustainingNote || playingNote
                const pitchBendOffsetX = whiteNotePitchBendOffsetX(sustainingNotePitchBend || playingNotePitchBend)
                const gradient = ctx.createLinearGradient(
                    (index - 0.5) * whiteKeyEdgeWidth + pitchBendOffsetX,
                    keyboardTop,
                    (index + 1.5) * whiteKeyEdgeWidth + pitchBendOffsetX,
                    keyboardTop
                )
                gradient.addColorStop(0, 'white')
                gradient.addColorStop(0.3, note.color.fillStyle)
                gradient.addColorStop(0.7, note.color.fillStyle)
                gradient.addColorStop(1, 'white')
                ctx.fillStyle = gradient
                ctx.shadowColor = note.color.fillStyle
                ctx.shadowBlur = 10
                ctx.fillRect(
                    index * whiteKeyEdgeWidth, // + Math.max(0, pitchBendOffsetX),
                    keyboardTop - sustainRectHeight,
                    whiteKeyEdgeWidth, // - Math.abs(pitchBendOffsetX),
                    sustainRectHeight
                )
                ctx.shadowBlur = 0
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
            ctx.fillStyle = 'black'
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight)

            const { sourceNote: playingNote, pitchBend: playingNotePitchBend } = playingNoteLookup[midiNoteNumber] || {}
            if (playingNote) {
                const pitchBendOffsetX = blackNotePitchBendOffsetX(playingNotePitchBend)
                const gradient = ctx.createLinearGradient(
                    x - 0.5 * blackKeyWidth + pitchBendOffsetX,
                    keyboardTop,
                    x + 1.5 * blackKeyWidth + pitchBendOffsetX,
                    keyboardTop
                )
                gradient.addColorStop(0, 'white')
                gradient.addColorStop(0.3, playingNote.color.fillStyle)
                gradient.addColorStop(0.7, playingNote.color.fillStyle)
                gradient.addColorStop(1, 'white')
                ctx.fillStyle = gradient
                ctx.fillRect(
                    x, // + Math.max(0, pitchBendOffsetX),
                    keyboardTop,
                    blackKeyWidth, // - Math.abs(pitchBendOffsetX),
                    blackKeyHeight
                )
            }

            const { sourceNote: sustainingNote, pitchBend: sustainingNotePitchBend } = sustainingNoteLookup[midiNoteNumber] || {}
            if (playingNote || sustainingNote) {
                const note = sustainingNote || playingNote
                const pitchBendOffsetX = blackNotePitchBendOffsetX(sustainingNotePitchBend || playingNotePitchBend)
                const gradient = ctx.createLinearGradient(
                    x - 0.5 * blackKeyWidth + pitchBendOffsetX,
                    keyboardTop,
                    x + 1.5 * blackKeyWidth + pitchBendOffsetX,
                    keyboardTop
                )
                gradient.addColorStop(0, 'white')
                gradient.addColorStop(0.3, note.color.fillStyle)
                gradient.addColorStop(0.7, note.color.fillStyle)
                gradient.addColorStop(1, 'white')
                ctx.fillStyle = gradient
                ctx.shadowColor = note.color.fillStyle
                ctx.shadowBlur = 10
                ctx.fillRect(
                    x + Math.max(0, pitchBendOffsetX),
                    keyboardTop - sustainRectHeight,
                    blackKeyWidth - Math.abs(pitchBendOffsetX),
                    sustainRectHeight
                )
                ctx.shadowBlur = 0
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

const drawNote2d = ({ flyInHeight }) => (notePosition, startProgress, endProgress, ctx) => {
    ctx.fillRect(
        notePosition.xOffset,
        endProgress * flyInHeight,
        notePosition.width,
        startProgress * flyInHeight - endProgress * flyInHeight
    )
}

const drawLiquidNote = ({ flyInHeight, noteApproachTime, width }) => {
    const gravity = flyInHeight / (0.5 * noteApproachTime * noteApproachTime)
    
    // source: https://www.svgrepo.com/svg/58467/water-drop
    const liquidNotePath = 'M132.281,264.564c51.24,0,92.931-41.681,92.931-92.918c0-50.18-87.094-164.069-90.803-168.891L132.281,0l-2.128,2.773c-3.704,4.813-90.802,118.71-90.802,168.882C39.352,222.883,81.042,264.564,132.281,264.564z'
    const svgNote = new SvgPath(liquidNotePath).scale(width / 640 * 0.05)
    const [centerX] = svgNote.center
    const [dropWidth, dropHeight] = svgNote.size
    svgNote.translate(-centerX, -dropHeight)
    
    const drawDrop = (x, y, ctx) => {
        svgNote
            .save()
            .translate(x, y)
            .beginPath()
            .to(ctx)
            .fill()
        svgNote.restore()
    }
    return (notePosition, startProgress, endProgress, ctx) => {
        if (startProgress <= 1) {
            drawDrop(
                notePosition.xOffset + 0.5 * notePosition.width,
                0.5 * gravity * Math.pow(startProgress * noteApproachTime, 2),
                ctx
            )
        }
    }
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
    const getStartPointOffsetX = oscillate(fps, startingPoint)

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

        return (notePosition, startingPoint, startProgress, endProgress, ctx) => {
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
            drawCurveSegment(ctx, false, leftSidePoints, endProgress, startProgress)
            drawCurveSegment(ctx, true, rightSidePoints, startProgress, endProgress)
            ctx.closePath()
            ctx.fill()
        }
    }

    const linear = () => {
        const easing = x => Math.pow(2, 10 * (x - 1))
        return (notePosition, startingPoint, startProgress, endProgress, ctx) => {
            const flyingNoteLocation = {
                front: {
                    x: startingPoint.x + (notePosition.xOffset - startingPoint.x) * easing(startProgress),
                    y: startingPoint.y + (flyInHeight - startingPoint.y) * easing(startProgress),
                    width: notePosition.width * easing(startProgress),
                    height: 2
                },
                back: {
                    x: startingPoint.x + (notePosition.xOffset - startingPoint.x) * easing(endProgress),
                    y: startingPoint.y + (flyInHeight - startingPoint.y) * easing(endProgress),
                    width: notePosition.width * easing(endProgress),
                    height: 2
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

    return (notePosition, startProgress, endProgress, ctx, frameIndex) => {
        const centerStartingPointX = width * getStartPointOffsetX(frameIndex)
        const noteStartingPoint = {
            x: centerStartingPointX + 0.2 * (notePosition.xOffset - centerStartingPointX),
            y: startingPointY
        }
        draw(notePosition, noteStartingPoint, startProgress, endProgress, ctx)
    }
}

const flyingNoteDrawers = {
    'topDown': drawNote2d,
    '3d': drawNote3d,
    'liquidDrops': drawLiquidNote,
}

const particleFactories = {
    linearPath: (fps, particleLifetime, flyInHeight, { getFlyingNotePosition }) => ({
        createParticle: (midiNoteNumber, color) => {
            const notePosition = getFlyingNotePosition(midiNoteNumber)
            if (!notePosition) {
                return null
            }
            return new LinearPathParticle(
                fps,
                particleLifetime,
                color,
                {
                    x: notePosition.xOffset + Math.random() * notePosition.width,
                    y: flyInHeight
                },
                200
            )
        }
    }),
    bubble: (fps, particleLifetime, flyInHeight, { getFlyingNotePosition }) => ({
        createParticle: (midiNoteNumber, color) => {
            const notePosition = getFlyingNotePosition(midiNoteNumber)
            if (!notePosition) {
                return null
            }
            return new BubbleParticle(
                fps,
                particleLifetime,
                color,
                {
                    x: notePosition.xOffset + Math.random() * notePosition.width,
                    y: flyInHeight - 1
                },
                flyInHeight,
                notePosition.width * 0.25
            )
        }
    }),
    ripple: (fps, particleLifetime, flyInHeight, { getFlyingNotePosition }) => ({
        createParticle: (midiNoteNumber, color) => {
            const notePosition = getFlyingNotePosition(midiNoteNumber)
            if (!notePosition) {
                return null
            }
            return new RippleParticle(
                fps,
                particleLifetime,
                color,
                {
                    x: notePosition.xOffset + 0.5 * notePosition.width,
                    y: flyInHeight - 1
                },
                flyInHeight
            )
        }
    })
}

module.exports = (config) => {
    const {
        keyboardHeightProportion = 0.1,
        flyIn: flyInConfig,
        fps,
        impactSize = 60,
        width = 480,
        height = 360,
        noteApproachTime,
        particles: {
            type: particleType = 'linearPath',
            lifetime: particleLifetime = 2000,
        } = {},
        tracks
    } = config

    const myTracks = tracks.reduce((result, track, index) => {
        if (track.visualizer === 'keyboard') {
            result[index] = true
        }
        return result
    }, {})

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
        noteApproachTime
    })

    const particleFactory = (particleFactories[particleType] || noop)(fps, particleLifetime, flyInHeight, keyboard)
    const particleSet = createParticleSet(particleFactory, config)

    const drawFrame = (ctx, frame, frameIndex) => {
        const notes = {
            flying: frame.flyingNotes.filter(n => myTracks[n.sourceNote.track]),
            playing: frame.playingNotes.filter(n => myTracks[n.sourceNote.track]),
            sustaining: frame.sustainingNotes.filter(n => myTracks[n.sourceNote.track]),
            impacts: frame.noteImpacts.filter(n => myTracks[n.sourceNote.track]),
        }

        // flying notes
        const reversed = reverse([
            ...notes.flying
        ])
        reversed.filter(n => myTracks[n.sourceNote.track]).forEach(({
            sourceNote: {
                color: { fillStyle },
                midiNoteNumber
            },
            isPlaying,
            startProgress,
            endProgress
        }) => {
            ctx.strokeStyle = fillStyle
            ctx.fillStyle = fillStyle
            ctx.shadowColor = fillStyle
            ctx.shadowBlur = isPlaying ? 10 : 0
            const notePosition = keyboard.getFlyingNotePosition(midiNoteNumber)
            if (notePosition) {
                drawNote(notePosition, startProgress, endProgress, ctx, frameIndex)
            }
        })
        ctx.shadowBlur = 0

        // note impact shockwaves
        ctx.lineWidth = 2
        notes.impacts.forEach(({ sourceNote: { midiNoteNumber, color }, progress }) => {
            const notePosition = keyboard.getFlyingNotePosition(midiNoteNumber)
            if (notePosition) {
                const [r, g, b] = rgba(color.fillStyle)
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
        keyboard.draw(ctx, notes.playing, notes.sustaining)

        // particles
        particleSet.drawFrame(frameIndex, ctx, [...notes.playing, ...notes.sustaining])
    }

    return { drawFrame }
}
