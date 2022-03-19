const { curryRight, last, round: lodashRound, sortBy, pick } = require('lodash')
const round2 = curryRight(lodashRound)(2)
const path = require("path")

module.exports = ({ config, song }) => {
    const {
        endPaddingTime = 3000,
        fps,
        noteApproachTime = 1000,
        noteImpactTime = 500,
        colorizer
    } = config
    const { notes = [] } = song

    const frameLength = 1000 / fps
    const numFramesInSong = ((lastNote) => {
        const end = lastNote.sustainEnd || lastNote.end
        const impactEnd = lastNote.start + noteImpactTime
        return Math.ceil(Math.max(end, impactEnd) / 1000 * fps)
    })(last(sortBy(notes, 'end')))
    const numFramesInNoteApproach = Math.round(noteApproachTime / 1000 * fps)
    const numFramesInNoteImpact = Math.round(noteImpactTime / 1000 * fps)
    const numFramesInEndPadding = Math.round(endPaddingTime / 1000 * fps)
    const frames = Array(numFramesInNoteApproach + numFramesInSong + numFramesInEndPadding).fill(0).map((x, frameIndex) => ({
        frameIndex,
        flyingNotes: [],
        playingNotes: [],
        noteImpacts: [],
        sustainingNotes: []
    }))

    const frameNumberFor = songTime => Math.floor((songTime + noteApproachTime) / 1000 * fps)
    const noteProgressIncrementPerFrame = 1 / numFramesInNoteApproach
    const noteImpactProgressIncrementPerFrame = 1 / numFramesInNoteImpact
    const frameOffsetPercent = songTime => -round2(songTime % frameLength / frameLength * noteProgressIncrementPerFrame)

    const colorize = colorizer ? require(`./${path.join("colorizers", colorizer.type)}`)(colorizer.config) : () => "white"

    notes.forEach(note => {
        const noteColor = colorize(pick(note, ["midiNoteNumber", "track"]))
        const noteStartFrameOffset = frameOffsetPercent(note.start)
        const noteEndFrameOffset = frameOffsetPercent(note.end)
        const noteHeight = (note.end - note.start) / noteApproachTime

        // Note approaching
        frames.slice(
            frameNumberFor(note.start) - numFramesInNoteApproach,
            frameNumberFor(note.start),
        ).forEach((frame, frameIndex) => {
            frame.flyingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                startProgress: Math.min(1, round2(noteStartFrameOffset + frameIndex * noteProgressIncrementPerFrame)),
                endProgress: Math.min(1, round2(noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame)),
                color: noteColor
            })
        })

        // Note impact animation
        frames.slice(
            frameNumberFor(note.start),
            frameNumberFor(note.start + noteImpactTime),
        ).forEach((frame, frameIndex) => {
            frame.noteImpacts.push({
                ...note,
                progress: round2(frameIndex * noteImpactProgressIncrementPerFrame),
                color: noteColor,
            })
        })

        // Note playing
        frames.slice(
            frameNumberFor(note.start),
            frameNumberFor(note.end)
        ).forEach((frame, frameIndex) => {
            frame.flyingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                startProgress: Math.min(1, round2(1 + noteStartFrameOffset + frameIndex * noteProgressIncrementPerFrame)),
                endProgress: Math.min(1, round2(1 + noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame)),
                color: noteColor
            })
            frame.playingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                color: noteColor
            })    
        })

        // Note sustaining
        frames.slice(
            frameNumberFor(note.end),
            frameNumberFor(note.sustainEnd),
        ).forEach((frame) => {
            frame.sustainingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                color: noteColor
            })
        })
    })

    return frames
}
