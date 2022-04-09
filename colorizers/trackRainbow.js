module.exports = ({
    colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"],
    startingTrack = 0
}) => {
    const palette = colors.map(c => ({ fillStyle: c }))
    return ({ track }) => palette[Math.abs(track - startingTrack) % colors.length]
}
