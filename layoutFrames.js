const { curryRight, last, round: lodashRound } = require('lodash')
const round2 = curryRight(lodashRound)(2)
const round4 = curryRight(lodashRound)(4)

module.exports = ({ config, song }) => {
    const { fps, noteApproachTime } = config
    const { notes = [] } = song

    const frameLength = 1000 / fps
    const numFramesInSong = Math.ceil(last(notes).end / 1000 * fps)
    const numFramesInNoteApproach = Math.round(noteApproachTime / 1000 * fps)
    const frames = Array(numFramesInNoteApproach + numFramesInSong).fill(0).map((x, frameIndex) => ({
        frameIndex,
        flyingNotes: [],
        playingNotes: []
    }))

    const frameNumberFor = songTime => Math.floor((songTime + noteApproachTime) / 1000 * fps)
    const noteProgressIncrementPerFrame = 1 / numFramesInNoteApproach
    const frameOffsetPercent = songTime => -round2(songTime % frameLength / frameLength * noteProgressIncrementPerFrame)

    notes.forEach(note => {
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
                endProgress: Math.min(1, round2(noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame))
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
                endProgress: Math.min(1, round2(1 + noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame))
            })
            frame.playingNotes.push({
                midiNoteNumber: note.midiNoteNumber
            })    
        })
    })

    return frames
}
