const { assign } = require("lodash")
const BaseParticle = require("./baseParticle")
const rgba = require('color-rgba')
const round2 = require("../round2")

class LinearPathParticle extends BaseParticle {
    constructor (fps, particleLifetime, color, origin, angle, distanceToTravel) {
        super(fps, particleLifetime)
        assign(this, { color, origin, distanceToTravel })
        const myAngle = (Math.random() - 0.5) * Math.PI + angle
        this.x = origin.x
        this.y = origin.y
        this.xDelta = Math.cos(myAngle) * distanceToTravel * this.progressIncrementPerFrame
        this.yDelta = -Math.sin(myAngle) * distanceToTravel * this.progressIncrementPerFrame
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
