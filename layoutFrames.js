const { last, sortBy, chain, get, memoize } = require('lodash')
const path = require("path")
const round2 = require('./round2')
const configReader = require('./configReader')

module.exports = ({ config, song }) => {
    const {
        endPaddingTime = 3000,
        fps,
        noteApproachTime = 1000,
        noteImpactTime = 500,
        tracks,
    } = config
    const { notes = [], pitchBends = [] } = song

    const frameLength = 1000 / fps
    const lastNote = last(sortBy(notes, 'end'))
    const numFramesInSong = (() => {
        const end = lastNote.sustainEnd || lastNote.end
        const impactEnd = lastNote.start + noteImpactTime
        return Math.ceil(Math.max(end, impactEnd) / 1000 * fps)
    })()
    const numFramesInNoteApproach = Math.round(noteApproachTime / 1000 * fps)
    const numFramesInNoteImpact = Math.round(noteImpactTime / 1000 * fps)
    const numFramesInEndPadding = Math.round(endPaddingTime / 1000 * fps)
    const frames = Array(numFramesInNoteApproach + numFramesInSong + numFramesInEndPadding).fill(0).map((x, frameIndex) => ({
        frameIndex,
        flyingNotes: [],
        playingNotes: [],
        noteImpacts: [],
        sustainingNotes: [],
        newParticles: []
    }))

    const frameNumberFor = songTime => Math.floor((songTime + noteApproachTime) / 1000 * fps)
    const noteProgressIncrementPerFrame = 1 / numFramesInNoteApproach
    const noteImpactProgressIncrementPerFrame = 1 / numFramesInNoteImpact
    const frameOffsetPercent = songTime => -round2(songTime % frameLength / frameLength * noteProgressIncrementPerFrame)

    const pitchBendLookupByTrackAndFrame = chain(pitchBends)
        .groupBy('track')
        .mapValues(trackPitchBends => chain(trackPitchBends)
            .map(pitchBend => ({
                ...pitchBend,
                frameNumber: frameNumberFor(pitchBend.time)
            }))
            .groupBy('frameNumber')
            .mapValues(last)
            .value()
        )
        .value()

    const getTrackColorizer = memoize(trackIndex => {
        const colorizer = configReader(config).getObject('colorizer', trackIndex)
        return colorizer
            ? require(`./${path.join("colorizers", colorizer.type)}`)({ ...colorizer, lastNote, track: tracks[trackIndex] })
            : (() => {
                const white = { fillStyle: 'white' }
                return () => white
            })()
    })

    notes.forEach((note) => {
        note.color = getTrackColorizer(note.track)(note)
        const noteStartFrameOffset = frameOffsetPercent(note.start)
        const noteEndFrameOffset = frameOffsetPercent(note.end)
        const noteHeight = (note.end - note.start) / noteApproachTime
        const noteStartFrame = frameNumberFor(note.start)
        const noteEndFrame = frameNumberFor(note.end)

        // Note approaching
        frames.slice(
            noteStartFrame - numFramesInNoteApproach,
            noteStartFrame,
        ).forEach((frame, frameIndex) => {
            frame.flyingNotes.push({
                sourceNote: note,
                startProgress: Math.min(1, round2(noteStartFrameOffset + frameIndex * noteProgressIncrementPerFrame)),
                endProgress: Math.min(1, round2(noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame)),
            })
        })

        // Note impact animation
        frames.slice(
            noteStartFrame,
            frameNumberFor(note.start + noteImpactTime),
        ).forEach((frame, frameIndex) => {
            frame.noteImpacts.push({
                sourceNote: note,
                progress: round2(frameIndex * noteImpactProgressIncrementPerFrame),
            })
        })

        // Note playing
        let currentPitchBend = {}
        frames.slice(
            noteStartFrame,
            noteEndFrame
        ).forEach((frame, frameIndex) => {
            currentPitchBend = get(
                pitchBendLookupByTrackAndFrame,
                `${note.track}.${noteStartFrame + frameIndex}`
            ) || currentPitchBend
            frame.flyingNotes.push({
                sourceNote: note,
                startProgress: round2(1 + noteStartFrameOffset + frameIndex * noteProgressIncrementPerFrame),
                endProgress: Math.min(1, round2(1 + noteEndFrameOffset - noteHeight + frameIndex * noteProgressIncrementPerFrame)),
                isPlaying: true
            })
            frame.playingNotes.push({
                sourceNote: note,
                pitchBend: currentPitchBend?.amount || 0
            })    
        })

        // Note sustaining
        currentPitchBend = {}
        frames.slice(
            noteEndFrame,
            frameNumberFor(note.sustainEnd),
        ).forEach((frame, frameIndex) => {
            currentPitchBend = get(
                pitchBendLookupByTrackAndFrame,
                `${note.track}.${noteEndFrame + frameIndex}`
            ) || currentPitchBend
            frame.sustainingNotes.push({
                sourceNote: note,
                pitchBend: currentPitchBend?.amount || 0
            })
        })
    })

    return frames
}
