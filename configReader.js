const { isString, get, reduce, set } = require("lodash")

module.exports = config => {
    const { tracks } = config

    const trackConfigs = reduce(
        tracks,
        (result, track, index) => set(result, index, track),
        {}
    )

    return {
        getObject: (path, trackIndex) => {
            let result = null
            const trackConfig = trackIndex && trackConfigs[trackIndex]
            if (trackConfig) {
                result = get(trackConfig, path)
            }
            if (isString(result)) {
                result = get(config, `${path}.${result}`)
            }
            // if (!result && result !== 0) {
            //     result = get(config, path)
            // }
            return result
        }
    }
}