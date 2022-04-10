const particlePrototype = {
    advanceFrame() {
        this.frameNumber++
        this.progress += this.progressIncrementPerFrame
    }
}

function Particle (note, progressIncrementPerFrame) {
    this.note = note
    this.origin = Math.random()
    this.direction = Math.random()
    this.frameNumber = 0
    this.progress = 0
    this.progressIncrementPerFrame = progressIncrementPerFrame
}

Particle.prototype = particlePrototype
Particle.prototype.constructor = Particle

module.exports = Particle
