module.exports = ({colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"]}) => ({track}) => {
    return colors[track % colors.length]
}