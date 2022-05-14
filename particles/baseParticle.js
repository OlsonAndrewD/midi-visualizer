class BaseParticle {
    constructor (fps, particleLifetime) {
        this.frameNumber = 0
        this.progress = 0
        const numFramesInParticleLifetime = Math.round(particleLifetime / 1000 * fps)
        this.progressIncrementPerFrame = 1 / numFramesInParticleLifetime
    }

    advanceFrame() {
        this.frameNumber++
        this.progress += this.progressIncrementPerFrame
    }
}

module.exports = BaseParticle
