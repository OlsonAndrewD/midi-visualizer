const { find } = require("lodash")

const layoutParticlePrototype = {
    addToNext(frame) {
        this.frameNumber++
        this.progress += this.progressIncrementPerFrame
    
        let particleSet = find(
            frame.particleSets,
            ({ sourceNote: { midiNoteNumber, color } }) =>
                midiNoteNumber === this.note.midiNoteNumber && color === this.note.color
        )
        if (!particleSet) {
            particleSet = {
                sourceNote: this.note,
                particles: []
            }
            frame.particleSets.push(particleSet)
        }
        particleSet.particles.push({
            origin: this.origin,
            direction: this.direction,
            progress: this.progress,
        })
    }
}

function LayoutParticle (note, progressIncrementPerFrame) {
    this.note = note
    this.origin = Math.random()
    this.direction = Math.random()
    this.frameNumber = 0
    this.progress = 0
    this.progressIncrementPerFrame = progressIncrementPerFrame
}

LayoutParticle.prototype = layoutParticlePrototype
LayoutParticle.prototype.constructor = LayoutParticle

module.exports = LayoutParticle
