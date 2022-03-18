const { set, reverse } = require("lodash")

module.exports = ({ padHeight, pads, midiNoteNumberAssignments, flyFrom }) => ({
    prepareNotesForLayout: (notes) => {
        notes.forEach(note => note.end = note.start + 100)
    },
    imageGenerator: {
        init: (width, height) => {
            const spacing = 10
            const padWidth = (width - spacing * (pads.length + 1)) / pads.length
            const padY = height - spacing - padHeight
            const padsWithLocations = pads.map((pad, index) => ({
                ...pad,
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
                const padColors = playingNotes.reduce((result, note) => {
                    const assignment = midiNoteNumberAssignments[note.midiNoteNumber]
                    return assignment
                        ? set(
                            result,
                            assignment.padIndex,
                            assignment.color || pads[assignment.padIndex].color
                        )
                        : result
                }, {})

                ctx.lineWidth = 3

                padsWithLocations.forEach((pad, index) => {
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
            }

            return {
                drawFrame: (ctx, frame) => {
                    ctx.fillStyle = 'gray'
                    ctx.strokeStyle = 'black'
                    ctx.lineWidth = 1

                    const { flyingNotes } = frame
                    const reversed = reverse([
                        ...flyingNotes
                    ])
                    reversed.forEach(note => {
                        const assignment = midiNoteNumberAssignments[note.midiNoteNumber] || {}
                        const { padIndex = -1 } = assignment
                        if (padIndex >= 0) {
                            ctx.fillStyle = assignment.color || pads[padIndex].color

                            const destinationPad = padsWithLocations[padIndex]
                            const destinationLocation = {
                                x: destinationPad.x + 0.25 * padWidth,
                                y: destinationPad.y + 0.25 * padHeight,
                            }
                            const progress = note.startProgress
                            const easingProgress = Math.pow(2, 10 * (progress - 1))
                            const flyingNoteLocation = {
                                x: startingPoint.x + (destinationLocation.x - startingPoint.x) * easingProgress,
                                y: startingPoint.y + (destinationLocation.y - startingPoint.y) * easingProgress,
                                width: 0.5 * padWidth * easingProgress,
                                height: 0.5 * padHeight * easingProgress
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
                    drawPads(ctx, frame)
                }
            }
        }
    }
})