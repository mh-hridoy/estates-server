/* eslint-disable no-unused-vars */
const ErrorHandler = require('../utils/ErrorHandler')

const duplicateError = (err, res) => {
    err.message = "User Already Exists, Please log in instead."

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        code: err.code,
        stack: err.stack

    })
    return new ErrorHandler(err.message, err.code)
}

module.exports = (err, req, res, next) => {

    let error = { ...err }

    if (err.code === 11000) return duplicateError(error, res)


    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        code: err.code,
        stack: err.stack
    })
}