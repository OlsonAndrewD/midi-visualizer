const { assign } = require("lodash")
const BaseParticle = require("./baseParticle")
const rgba = require('color-rgba')
const round2 = require("../round2")

class LinearPathParticle extends BaseParticle {
    constructor (progressIncrementPerFrame, color, origin, distanceToTravel) {
        super(progressIncrementPerFrame)
        assign(this, { color, origin, distanceToTravel })
        const angle = Math.random() * Math.PI
        this.x = origin.x
        this.y = origin.y
        this.xDelta = Math.cos(angle) * distanceToTravel * progressIncrementPerFrame
        this.yDelta = -Math.sin(angle) * distanceToTravel * progressIncrementPerFrame
    }

    draw(ctx) {
        this.x += this.xDelta
        this.y += this.yDelta
        const [r, g, b] = rgba(this.color.fillStyle)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, round2(1 - this.progress * this.progress))})`
        ctx.fillRect(this.x, this.y, 1, 1)
    }
}

module.exports = LinearPathParticle
