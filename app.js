const fs = require('fs')
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' })
const morgan = require('morgan')
const sanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const errorhandlingMiddleware = require('./controllers/errorControllers')
const cors = require('cors')
const cookieParser = require('cookie-parser') //it parse the client side cookies.
const helmet = require('helmet')


const port = process.env.PORT || 3000;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}

process.on('uncaughtException', err => {
    console.log("uncaughtException Error... System will terminate soon")

    console.log(err.name, err.message, err.stack)

    process.exit(1)
})
app.use(cors({
    origin: ['http://localhost:3000', 'https://estate-client.herokuapp.com/'], //frontend
    credentials: true
}))
app.use(helmet())
app.use(express.json({ limit: "10MB" }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(sanitize())
app.use(xss())

fs.readdirSync('./routes').map(route => app.use('/api', require(`./routes/${route}`)))



app.all('*', (req, res) => {
    res.status(400).json("not found " + req.originalUrl)
})

//do not execute this errorhandlingMiddleware function

app.use(errorhandlingMiddleware)


let server;
mongoose.connect(process.env.DB_SECRET_KEY, options, () => {

    app.listen(port, () => console.log("Server listening on port " + port))
    console.log("DB Connected")
})



process.on('unhandledRejection', err => {
    console.log("unhandledRejection Error... System will terminate soon")
    console.log(err.name, err.message, err.stack)
    server.close(() => {
        process.exit(1)
    })

})
