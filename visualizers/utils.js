const calculateBezierCurvePoint = (points, t) => {
    if (points.length === 1) {
        return points[0]
    }
    const newPoints = []
    for (let i = 0; i < points.length - 1; i++) {
        newPoints.push({
            x: (1 - t) * points[i].x + t * points[i + 1].x,
            y: (1 - t) * points[i].y + t * points[i + 1].y,
        })
    }
    return calculateBezierCurvePoint(newPoints, t)
}

const oscillate = (fps, startingPoint) => {
    const { x, oscillation } = startingPoint
    if (oscillation) {
        const { cycleLengthInSeconds = 10, width = 0.8 } = oscillation
        const framesPerCycle = cycleLengthInSeconds * fps
        const framesPerHalfCycle = 0.5 * framesPerCycle
        return (frameIndex) => {
            // triangle wave function (a little too jerky at the edges?)
            // const t = (frameIndex + framesPerHalfCycle) / framesPerCycle
            // const offset = 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1

            const offset = Math.cos((-frameIndex / framesPerCycle + 0.5) * Math.PI)
            return x + 0.5 * width * Math.pow(offset, 3)
        }
    }
    else {
        return () => x
    }
}

module.exports = {
    calculateBezierCurvePoint,
    oscillate
}