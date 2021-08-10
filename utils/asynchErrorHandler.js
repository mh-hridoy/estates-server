/* this will catch all the mongoose async errors. this function will return a anonymous function with all the arguments passed and will use them in fn callback function.*/

const asynchErrorHandler = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    }
}

module.exports = asynchErrorHandler