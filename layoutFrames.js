const { curryRight, last, round: lodashRound } = require('lodash')
const round = curryRight(lodashRound)(2)

module.exports = ({ config, song }) => {
    const { fps, noteApproachTime } = config
    const { notes = [] } = song

    const numFramesInSong = Math.ceil(last(notes).end / 1000 * fps)
    const numFramesInNoteApproach = noteApproachTime / 1000 * fps
    const frames = Array(numFramesInNoteApproach + numFramesInSong).fill(0).map((x, frameIndex) => ({
        frameIndex,
        flyingNotes: [],
        playingNotes: []
    }))

    const frameNumberFor = songTime => (songTime + noteApproachTime) / 1000 * fps
    const noteProgressIncrementPerFrame = noteApproachTime / 1000 / fps

    notes.forEach(note => {
        const noteHeight = (note.end - note.start) / noteApproachTime

        // Note approach
        frames.slice(
            frameNumberFor(note.start) - numFramesInNoteApproach,
            frameNumberFor(note.start),
        ).forEach((frame, frameIndex) => {
            frame.flyingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                startProgress: round(frameIndex * noteProgressIncrementPerFrame),
                endProgress: round(-noteHeight + frameIndex * noteProgressIncrementPerFrame)
            })
        })

        // Note playing
        frames.slice(
            frameNumberFor(note.start),
            frameNumberFor(note.end)
        ).forEach((frame, frameIndex) => {
            frame.flyingNotes.push({
                midiNoteNumber: note.midiNoteNumber,
                startProgress: round(1 + frameIndex * noteProgressIncrementPerFrame),
                endProgress: round(1 - noteHeight + frameIndex * noteProgressIncrementPerFrame)
            })
            frame.playingNotes.push({
                midiNoteNumber: note.midiNoteNumber
            })    
        })
    })

    return frames
}
