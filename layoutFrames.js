const { curryRight, last, round: lodashRound, sortBy, pick, chain, get } = require('lodash')
const round2 = curryRight(lodashRound)(2)
const path = require("path")
const Particle = require('./particle')

module.exports = ({ config, song }) => {
    const {
        endPaddingTime = 3000,
        fps,
        noteApproachTime = 1000,
        noteImpactTime = 500,
        particles: {
            perFrame: particlesPerFrame = 10,
            lifetime: particleLifetime = 2000,
            // angleSpread: particleAngleSpread = 0.5,
            // distanceMultiplier: particleDistanceMultiplier = 0.8,
        } = {},
        colorizer,
        noteMap,
    } = config
    const { notes = [], pitchBends = [] } = song

    const frameLength = 1000 / fps
    const numFramesInSong = ((lastNote) => {
        const end = lastNote.sustainEnd || lastNote.end
        const impactEnd = lastNote.start + noteImpactTime
        return Math.ceil(Math.max(end, impactEnd) / 1000 * fps)
    })(last(sortBy(notes, 'end')))
    const numFramesInNoteApproach = Math.round(noteApproachTime / 1000 * fps)
    const numFramesInNoteImpact = Math.round(noteImpactTime / 1000 * fps)
    const numFramesInEndPadding = Math.round(endPaddingTime / 1000 * fps)
    const numFramesInParticleLifetime = Math.round(particleLifetime / 1000 * fps)
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
    const particleProgressIncrementPerFrame = 1 / numFramesInParticleLifetime
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

    const colorize = colorizer
        ? require(`./${path.join("colorizers", colorizer.type)}`)(colorizer, noteMap)
        : (() => {
            const white = { fillStyle: 'white' }
            return () => white
        })()

    notes.forEach((note) => {
        note.color = colorize(pick(note, ["midiNoteNumber", "track"]))
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
                startProgress: Math.min(1, round2(1 + noteStartFrameOffset + frameIndex * noteProgressIncrementPerFrame)),
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

        // Particles
        frames.slice(
            noteStartFrame,
            frameNumberFor(note.sustainEnd || note.end)
        ).forEach((frame) => {
            frame.newParticles.push(...Array(particlesPerFrame).fill().map(() => new Particle(note, particleProgressIncrementPerFrame)))
        })
    })

    return frames
}
