const { set, reduce, reverse } = require("lodash")
const rgba = require('color-rgba')
const { calculateBezierCurvePoint, oscillate } = require("./utils")
const { create: createParticleSet } = require("../particles/particleSet")
const LinearPathParticle = require("../particles/linearPathParticle")

const particleFactories = {
    linearPath: (fps, particleLifetime, getPadLocation) => ({
        createParticle: (midiNoteNumber, color) => {
            const padLocation = getPadLocation(midiNoteNumber)
            return padLocation
                ? new LinearPathParticle(
                    fps,
                    particleLifetime,
                    color,
                    {
                        x: padLocation.x + Math.random() * padLocation.width,
                        y: padLocation.y - 1
                    },
                    200
                )
                : null
        }
    })
}

module.exports = (config) => {
    const {
        noteMap,
        padHeight,
        padY,
        padOrder,
        flyIn,
        fps,
        impactSize = 50,
        width,
        height,
        particles: {
            type: particleType = 'linearPath',
            lifetime: particleLifetime = 2000,
        }
    } = config

    const getMidiNoteNumber = (() => {
        const lookup = reduce(
            noteMap,
            (result, noteName, noteNumber) => {
                return set(result, noteName, noteNumber)
            },
            {}
        )
        return noteName => lookup[noteName]
    })()
    const padAssignments = padOrder.reduce((assignments, nextPadAssignments, padIndex) => {
        nextPadAssignments.forEach(noteName => {
            assignments[getMidiNoteNumber(noteName)] = padIndex
        })
        return assignments
    }, {})

    const spacing = 10
    const numberOfPads = padOrder.length
    const padWidth = (width - spacing * (numberOfPads + 1)) / numberOfPads
    const padLocations = Array(numberOfPads).fill(0).map((_, index) => ({
        x: (index + 1) * spacing + index * padWidth,
        y: padY,
        height: padHeight,
        width: padWidth,
    }))
    const padAspectRatio = padWidth / padHeight
    const startingPoint = {
        x: width * flyIn.startingPoint.x,
        y: height * flyIn.startingPoint.y
    }
    const getStartPointOffsetX = oscillate(fps, flyIn.startingPoint)

    const getPadLocation = (midiNoteNumber) => {
        const padIndex = padAssignments[midiNoteNumber]
        return padIndex >= 0
            ? padLocations[padIndex]
            : null
    }

    const drawPads = (ctx, { playingNotes }) => {
        const padColors = playingNotes.reduce((result, { sourceNote: { midiNoteNumber, color } }) => set(
            result,
            padAssignments[midiNoteNumber],
            color
        ), {})

        ctx.lineWidth = 3

        padLocations.forEach((pad, index) => {
            const { fillStyle: padColor } = padColors[index] || {}
            if (padColor) {
                ctx.fillStyle = padColor
                ctx.shadowColor = padColor
                ctx.shadowBlur = 25
                ctx.fillRect(
                    pad.x,
                    pad.y,
                    pad.width,
                    pad.height
                )
            }
            else {
                ctx.shadowBlur = 0
                ctx.strokeStyle = "white"
                ctx.strokeRect(
                    pad.x,
                    pad.y,
                    pad.width,
                    pad.height
                )
            }
        })

        ctx.shadowBlur = 0
    }

    const linear = () => {
        const easing = progress => Math.pow(2, 10 * (progress - 1))

        return (destinationPad, noteStartingPointX, progress) => {
            const destinationLocation = {
                x: destinationPad.x + 0.25 * destinationPad.width,
                y: destinationPad.y + 0.25 * destinationPad.height,
            }
            const easingProgress = easing(progress)
            return ({
                x: noteStartingPointX + (destinationLocation.x - noteStartingPointX) * easingProgress,
                y: startingPoint.y + (destinationLocation.y - startingPoint.y) * easingProgress,
                width: 0.5 * destinationPad.width * easingProgress,
                height: 0.5 * destinationPad.height * easingProgress
            })
        }
    }

    const bezierCurve = () => {
        const easing = x => x * x * x
        const calculateCurvePoint = (points, t) => calculateBezierCurvePoint(points, easing(t))

        return (destinationPad, noteStartingPointX, progress) => {
            const destinationTopLeft = {
                x: destinationPad.x + 0.25 * destinationPad.width,
                y: destinationPad.y + 0.25 * destinationPad.height,
            }
            const destinationTopRight = {
                x: destinationPad.x + 0.75 * destinationPad.width,
                y: destinationPad.y + 0.25 * destinationPad.height,
            }
            const leftCurvePoints = [
                {
                    x: noteStartingPointX,
                    y: startingPoint.y
                },
                {
                    x: noteStartingPointX + (destinationTopLeft.x - noteStartingPointX) * 0.75,
                    y: startingPoint.y,
                },
                destinationTopLeft
            ]
            const rightCurvePoints = [
                {
                    x: noteStartingPointX,
                    y: startingPoint.y
                },
                {
                    x: noteStartingPointX + (destinationTopRight.x - noteStartingPointX) * 0.75,
                    y: startingPoint.y,
                },
                destinationTopRight
            ]
            const easingProgress = easing(progress)
            const leftCurvePoint = calculateCurvePoint(leftCurvePoints, easingProgress)
            const rightCurvePoint = calculateCurvePoint(rightCurvePoints, easingProgress)
            const width = rightCurvePoint.x - leftCurvePoint.x
            return ({
                x: leftCurvePoint.x,
                y: leftCurvePoint.y,
                width,
                height: width / padAspectRatio
            })
        }
    }

    const flyInPathShapes = { linear, bezierCurve }
    const getFlyingNoteRectangle = flyInPathShapes[flyIn.shape || 'linear']()

    const particleFactory = (particleFactories[particleType] || noop)(fps, particleLifetime, getPadLocation)
    const particleSet = createParticleSet(particleFactory, config)

    return ({
        prepareNotesForLayout: (notes) => {
            notes.forEach(note => note.end = note.start + 100)
        },
        drawFrame: (ctx, frame, frameIndex) => {
            ctx.fillStyle = 'gray'
            ctx.strokeStyle = 'black'
            ctx.lineWidth = 1

            // flying notes
            const { flyingNotes } = frame
            const reversed = reverse([
                ...flyingNotes
            ])
            reversed.forEach(({ sourceNote: { midiNoteNumber, color: { fillStyle } }, startProgress }) => {
                const padIndex = padAssignments[midiNoteNumber]
                if (padIndex >= 0) {
                    const padLocation = padLocations[padIndex]

                    const centerStartingPointX = width * getStartPointOffsetX(frameIndex)
                    const noteStartingPointX = centerStartingPointX + 0.2 * (padLocation.x + 0.5 * padLocation.width - centerStartingPointX)

                    const flyingNoteLocation = getFlyingNoteRectangle(padLocation, noteStartingPointX, startProgress)

                    ctx.fillStyle = fillStyle
                    ctx.fillRect(
                        flyingNoteLocation.x,
                        flyingNoteLocation.y,
                        flyingNoteLocation.width,
                        flyingNoteLocation.height
                    )
                    ctx.strokeRect(
                        flyingNoteLocation.x,
                        flyingNoteLocation.y,
                        flyingNoteLocation.width,
                        flyingNoteLocation.height
                    )
                }
            })

            // pads and playing notes
            drawPads(ctx, frame)

            // note impact shockwaves
            ctx.lineWidth = 2
            const { noteImpacts } = frame
            noteImpacts.forEach((noteImpact) => {
                const { sourceNote: { midiNoteNumber, color: { fillStyle } }, progress } = noteImpact
                const padIndex = padAssignments[midiNoteNumber]
                if (padIndex >= 0) {
                    const [r, g, b] = rgba(fillStyle)
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(1 - progress) * 0.25})`

                    const destinationPad = padLocations[padIndex]
                    const easingProgress = -Math.pow(2, -10 * progress) + 1
                    const impactRectangle = {
                        x: destinationPad.x - 0.2 * progress * impactSize * easingProgress,
                        y: destinationPad.y - progress * impactSize * easingProgress,
                        width: destinationPad.width + 0.4 * impactSize * progress * easingProgress,
                        height: destinationPad.height + impactSize * progress * easingProgress,
                    }
                    ctx.fillRect(
                        impactRectangle.x,
                        impactRectangle.y,
                        impactRectangle.width,
                        impactRectangle.height
                    )
                }
            })

            // particles
            particleSet.drawFrame(frameIndex, ctx, frame.playingNotes)
        }
    })
}