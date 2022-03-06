/**
 * Basic Color List:
 * | Number | Color  |
 * | ------ | ------ |
 * | 0      | Black  |
 * | 196    | Red    |
 * | 208    | Orange |
 * | 226    | Yellow |
 * | 40     | Green  |
 * | 75     | Blue   |
 * | 20     | Indigo |
 * | 99     | Violet |
 * | 165    | Purple |
 * | 213    | Pink   |
 * | 15     | White  |
 * [Complete Color List](https://user-images.githubusercontent.com/995050/47952855-ecb12480-df75-11e8-89d4-ac26c50e80b9.png)
 */
module.exports = (color, bgColor, text, ...rest) => {
    console.log(`\x1b[38;5;${color}m\x1b[48;5;${bgColor ? bgColor : 0}m${text}\x1b[0m`, ...rest)
}