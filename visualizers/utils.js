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

module.exports = {
    calculateBezierCurvePoint
}