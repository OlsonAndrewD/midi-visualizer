module.exports = ({ color = "red" }) => {
    const singleColor = {
        fillStyle: color
    }
    return () => singleColor
}