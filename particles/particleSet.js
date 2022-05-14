const { chain } = require("lodash")

module.exports = {
    create: (
        particleFactory,
        {
            fps,
            noteApproachTime,
            particles: {
                perFrame: particlesPerFrame = 10,
                oneEveryNMilliseconds: oneParticleEveryNMilliseconds = null,
            } = {},
        }
    ) => {
        const particles = []
        const msPerFrame = 1000 / fps

        const numParticlesThisFrame = oneParticleEveryNMilliseconds
            ? (frameIndex, note) => {
                const frameTime = frameIndex * msPerFrame
                const noteTime = note.start + noteApproachTime
                const noteOffsetFromFrameTime = noteTime - frameTime
                const noteOffsetFromPreviousFrameTime = noteOffsetFromFrameTime + msPerFrame
                const thisFrameParticle = Math.round(noteOffsetFromFrameTime / oneParticleEveryNMilliseconds)
                const prevFrameParticle = Math.round(noteOffsetFromPreviousFrameTime / oneParticleEveryNMilliseconds)
                const result = noteOffsetFromFrameTime > 0
                    ? 0
                    : (thisFrameParticle === 0 || thisFrameParticle !== prevFrameParticle) ? 1 : 0
                return result
            }
            : () => particlesPerFrame

        const drawFrame = (frameIndex, ctx, notesEmittingParticles) => {
            const newParticles = chain(notesEmittingParticles)
                .map('sourceNote')
                .uniqBy(({ midiNoteNumber, color: { fillStyle } }) => `${midiNoteNumber}_${fillStyle}`)
                .flatMap(note => Array(numParticlesThisFrame(frameIndex, note)).fill().map(() => ({ note })))
                .map(({ note: { midiNoteNumber, color } }) => particleFactory.createParticle(midiNoteNumber, color))
                .compact()
                .value()
            particles.push(...newParticles)
            for (let particleIndex = 0; particleIndex < particles.length; particleIndex++) {
                const particle = particles[particleIndex]
                particle.draw(ctx)
                particle.advanceFrame()
                if (particle.progress > 1) {
                    particles.splice(particleIndex, 1)
                    particleIndex--
                }
            }
        }

        return {
            drawFrame
        }
    }
}