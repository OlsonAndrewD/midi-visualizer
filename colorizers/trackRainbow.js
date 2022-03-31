module.exports = ({colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"], startingTrack = 0}) => ({track}) => {
    return colors[Math.abs(track - startingTrack) % colors.length]
}