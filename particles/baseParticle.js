class BaseParticle {
    constructor (progressIncrementPerFrame) {
        this.frameNumber = 0
        this.progress = 0
        this.progressIncrementPerFrame = progressIncrementPerFrame
    }

    advanceFrame() {
        this.frameNumber++
        this.progress += this.progressIncrementPerFrame
    }
}

module.exports = BaseParticle
