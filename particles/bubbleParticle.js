const { assign } = require("lodash")
const BaseParticle = require("./baseParticle")
const rgba = require('color-rgba')
const round2 = require("../round2")
const twoPi = 2 * Math.PI

class BubbleParticle extends BaseParticle {
    constructor (fps, particleLifetime, color, origin, distanceToTravel, waveWidth) {
        super(fps, particleLifetime)
        distanceToTravel *= 1 + (Math.random() * 0.2 - 0.1)
        assign(this, { color, origin, distanceToTravel, waveWidth })
        this.xMultiplier = Math.random() > 0.5 ? 1 : -1
        this.sineOffset = Math.random() * Math.PI
        this.yOffset = Math.random() * this.distanceToTravel * this.progressIncrementPerFrame
        this.numPeriods = 2 + Math.random() * 2
        this.widener = Math.random() * 0.2
    }

    draw(ctx) {
        const [r, g, b] = rgba(this.color.fillStyle)
        const easeInProgress = Math.pow(this.progress, 3)
        const easeOutProgress = 1 - Math.pow(1 - this.progress, 3)
        ctx.strokeStyle = ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, round2(0.5 - 0.5 * easeInProgress))})`
        ctx.beginPath()
        ctx.arc(
            this.origin.x + this.xMultiplier * Math.sin(this.sineOffset + easeOutProgress * this.numPeriods * Math.PI) * this.waveWidth,
            this.origin.y - this.yOffset - this.distanceToTravel * easeInProgress,
            3,
            0,
            twoPi
        )
        ctx.stroke()
        this.xMultiplier += this.widener
    }
}

module.exports = BubbleParticle
