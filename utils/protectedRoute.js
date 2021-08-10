const jwt = require('jsonwebtoken')


const protectedRoute = (req, res, next) => {

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1]

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodeToken
    } else {
      return res.status(400).json({message: 'You are not authenticated'})
    }

    next()
}


module.exports = protectedRoute;