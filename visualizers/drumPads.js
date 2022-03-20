const { set, reduce, reverse } = require("lodash")
const rgba = require('color-rgba')

module.exports = ({
    noteMap,
    padHeight,
    padOrder,
    colors,
    flyFrom,
    impactSize = 50
}) => {
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
    const getNoteColor = ({ midiNoteNumber }) => colors[noteMap[midiNoteNumber] || 'unknown'] || colors.default

    return ({
        prepareNotesForLayout: (notes) => {
            notes.forEach(note => note.end = note.start + 100)
        },
        imageGenerator: {
            init: (width, height) => {
                const spacing = 10
                const numberOfPads = padOrder.length
                const padWidth = (width - spacing * (numberOfPads + 1)) / numberOfPads
                const padY = height - spacing - padHeight
                const padLocations = Array(numberOfPads).fill(0).map((_, index) => ({
                    x: (index + 1) * spacing + index * padWidth,
                    y: padY,
                    height: padHeight,
                    width: padWidth,
                }))
                const startingPoint = {
                    x: width * flyFrom.x,
                    y: height * flyFrom.y
                }

                const drawPads = (ctx, { playingNotes }) => {
                    const padColors = playingNotes.reduce((result, note) => set(
                        result,
                        padAssignments[note.midiNoteNumber],
                        getNoteColor(note)
                    ), {})

                    ctx.lineWidth = 3

                    padLocations.forEach((pad, index) => {
                        const padColor = padColors[index]
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

                return {
                    drawFrame: (ctx, frame) => {
                        ctx.fillStyle = 'gray'
                        ctx.strokeStyle = 'black'
                        ctx.lineWidth = 1

                        // flying notes
                        const { flyingNotes } = frame
                        const reversed = reverse([
                            ...flyingNotes
                        ])
                        // if (flyingNotes.length) {
                        //     console.log(flyingNotes[0])
                        // }
                        reversed.forEach(note => {
                            const padIndex = padAssignments[note.midiNoteNumber]
                            if (padIndex >= 0) {
                                ctx.fillStyle = getNoteColor(note)

                                const destinationPad = padLocations[padIndex]
                                const destinationLocation = {
                                    x: destinationPad.x + 0.25 * destinationPad.width,
                                    y: destinationPad.y + 0.25 * destinationPad.height,
                                }
                                const progress = note.startProgress
                                const easingProgress = Math.pow(2, 10 * (progress - 1))
                                const flyingNoteLocation = {
                                    x: startingPoint.x + (destinationLocation.x - startingPoint.x) * easingProgress,
                                    y: startingPoint.y + (destinationLocation.y - startingPoint.y) * easingProgress,
                                    width: 0.5 * destinationPad.width * easingProgress,
                                    height: 0.5 * destinationPad.height * easingProgress
                                }
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
                            const { midiNoteNumber, progress } = noteImpact
                            const padIndex = padAssignments[midiNoteNumber]
                            if (padIndex >= 0) {
                                const [r, g, b] = rgba(getNoteColor(noteImpact))
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
                    }
                }
            }
        }
    })
}