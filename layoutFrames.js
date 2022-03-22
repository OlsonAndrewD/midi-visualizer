const { curryRight, last, round: lodashRound, sortBy, pick, concat, noop } = require('lodash')
const round2 = curryRight(lodashRound)(2)
const path = require("path")

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
    const numFramesInParticleLifetime = Math.round(particleLifetime / 1000 * fps)
    const frames = Array(numFramesInNoteApproach + numFramesInSong + numFramesInEndPadding).fill(0).map((x, frameIndex) => ({
        frameIndex,
        flyingNotes: [],
        playingNotes: [],
        noteImpacts: [],
        sustainingNotes: [],
        particles: []
    }))

    const frameNumberFor = songTime => Math.floor((songTime + noteApproachTime) / 1000 * fps)
    const noteProgressIncrementPerFrame = 1 / numFramesInNoteApproach
    const noteImpactProgressIncrementPerFrame = 1 / numFramesInNoteImpact
    const particleProgressIncrementPerFrame = 1 / numFramesInParticleLifetime
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

        // Particles
        let particles = []
        const generateParticle = () => {
            let frameNumber = 0
            const origin = Math.random()
            const direction = Math.random()
            let progress = 0

            const particle = {
                addToNext: (frame) => {
                    frameNumber++
                    if (frameNumber > numFramesInParticleLifetime) {
                        particle.addToNext = noop
                    }
                    else {
                        progress += particleProgressIncrementPerFrame
                        frame.particles.push({
                            midiNoteNumber: note.midiNoteNumber,
                            color: noteColor,
                            origin,
                            direction,
                            progress,
                        })
                    }
                }
            }
            return particle
        }
        frames.slice(
            frameNumberFor(note.start),
            frameNumberFor(note.sustainEnd || note.end)
        ).forEach((frame) => {
            particles = concat(particles, Array(particlesPerFrame).fill().map(generateParticle))
            particles.forEach(particle => particle.addToNext(frame))
        })
        frames.slice(
            frameNumberFor((note.sustainEnd || note.end) + 1),
            frameNumberFor((note.sustainEnd || note.end) + 1 + particleLifetime)
        ).forEach((frame) => {
            particles.forEach(particle => particle.addToNext(frame))
        })
    })

    return frames
}
