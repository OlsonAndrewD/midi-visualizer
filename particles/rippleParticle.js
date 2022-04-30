const { assign } = require("lodash")
const rgba = require('color-rgba')
const round2 = require("../round2")
const BaseParticle = require("./baseParticle")

class RippleParticle extends BaseParticle {
    constructor (progressIncrementPerFrame, color, origin, distanceToTravel) {
        super(progressIncrementPerFrame)
        assign(this, {
            color,
            origin,
            distanceToTravel
        })
    }

    draw(ctx) {
        const [r, g, b] = rgba(this.color.fillStyle)
        const a = 0.5 - 0.5 * round2(this.progress * this.progress)
        ctx.strokeStyle = ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        ctx.beginPath()
        ctx.arc(
            this.origin.x,
            this.origin.y,
            this.progress * this.distanceToTravel,
            Math.PI,
            0
        )
        ctx.stroke()
    }
}

module.exports = RippleParticle
