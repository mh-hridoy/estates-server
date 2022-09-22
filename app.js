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
const playwright = require('playwright')
const Property = require('./models/propertySchema')
const cron = require("node-cron")
const mbxClient = require("@mapbox/mapbox-sdk")
const mbxStyles = require("@mapbox/mapbox-sdk/services/geocoding")
const socket = require("socket.io")
const Notification = require("./models/BuyItNotifications")
const OneSignal = require("onesignal-node")    

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_ACCESS_ID })
const stylesService = mbxStyles(baseClient)

const port = process.env.PORT || 3000;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}

const client = new OneSignal.Client(
  "4d7fc9d7-e996-4312-9eb4-01736001527e",
  "NGMxNjdhYjctODdhYi00MGRjLTgwODgtZWU4NzhiM2RhYzAz"
)

process.on('uncaughtException', err => {
    console.log("uncaughtException Error... System will terminate soon")

    console.log(err.name, err.message, err.stack)

    process.exit(1)
})
app.use(cors({
    origin: ['http://localhost:3000', 'https://estates-server.herokuapp.com/'], //frontend
    credentials: true
}))
// app.use(
//   cors({
//     origin: true,
//     methods: ["DELETE", "POST", "GET", "OPTIONS"],
//     allowedHeaders: [
//       "Access-Control-Allow-Headers",
//       "Content-Type",
//       "Access-Control-Allow-Origin",
//       "Authorization",
//       "X-Requested-With",
//     ],
//     // preflightContinue: true,
//     credentials: true,
//   })
// )
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


// Automate----Scrapping LOGS.COM

const autoMate = async () => {
  const propertyArray = []

  const browser = await playwright.chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 2000, height: 2500 },
  })
  const page = await context.newPage()

  await page.goto(
    "https://app.powerbi.com/view?r=eyJrIjoiMTBlMzVhNmMtM2NlYi00MzY0LTg0YWQtMGY2MzEyYzNmNDhlIiwidCI6ImRmZmRlOTRmLTcyZmItNDlhZS1hY2IyLTBiOTYxYWJkNWI0MSIsImMiOjN9",
    {
      waitUntil: "networkidle0",
    }
  )

  await page.click(".pivotTableCellWrap")

  await page.focus(".vcPopOutBtn")
  await page.click(".vcPopOutBtn")
  await page.keyboard.press("ContextMenu")

  await page.waitForSelector("div.label")

  await page.click("div.label")

  await page.waitForSelector("div.rowHeaders .pivotTableCellWrap", {
    timeout: 5000,
  })
  await page.waitForTimeout(5000)

  // await page.screenshot({ path: "checking.jpeg", fullPage: true })

  await page.waitForTimeout(5000)
  await page.waitForSelector("div.rowHeaders")

  const dataHandler = await page.$("div")

  const value = await dataHandler.$$eval(
    ".rowHeaders .pivotTableCellWrap",
    (nodes) => {
      return nodes.map((node) => node.innerHTML)
    }
  )
//check on duplicate problem// add corn scheduler.
  const allData = value
  await page.waitForTimeout(1000)

  allData.forEach((property) => {
    let county,
      saleDate,
      saleTime,
      caseNumber,
      propertyAddress,
      city,
      state,
      zip,
      openingBid,
      beforeSaleNotes

    beforeSaleNotes = property

    county = beforeSaleNotes.split(",")[0]
    saleDate = beforeSaleNotes.split(",")[1]
    saleTime = beforeSaleNotes.split(",")[2]
    caseNumber = beforeSaleNotes.split(",")[3]
    propertyAddress = `${beforeSaleNotes.split(",")[4]}${
      beforeSaleNotes
        .split(",")[5]
        .startsWith(" Unit" || " unit" || " apt" || " Apt" || " Ap" || "ap") ? ", " +
      beforeSaleNotes.split(",")[5] : ""
    }`
    city = `${
      beforeSaleNotes
        .split(",")[5]
        .startsWith(" Unit" || " unit" || " apt" || " Apt" || " Ap" || "ap")
        ? beforeSaleNotes.split(",")[6]
        : beforeSaleNotes.split(",")[5]
    }`
    const stateAndZip = `${
      beforeSaleNotes
        .split(",")[5]
        .startsWith(" Unit" || " unit" || " apt" || " Apt" || " Ap" || "ap")
        ? beforeSaleNotes.split(",")[7]
        : beforeSaleNotes.split(",")[6]
    }`
    const stateStr = stateAndZip.match(/[a-zA-Z]+/g)
    state = stateStr.join(" ")
    const zipCode = stateAndZip && stateAndZip.match(/\d+/g)
    zip = zipCode && + zipCode[0] //put the same logic for all the others
    openingBid = `${
      beforeSaleNotes
        .split(",")[5]
        .startsWith(" Unit" || " unit" || " apt" || " Apt" || " Ap" || "ap")
        ? +beforeSaleNotes.split(",")[8] + beforeSaleNotes.split(",")[9]
        : +beforeSaleNotes.split(",")[7] + beforeSaleNotes.split(",")[8]
    }`

      propertyArray.push({
        county: county.trim(),
        saleDate: saleDate,
        saleTime: saleTime.trim(),
        caseNumber: caseNumber.trim(),
        propertyAddress: propertyAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip,
        openingBid: openingBid == "NaN" ? 0 : +openingBid,
        beforeSaleNotes: beforeSaleNotes.trim(),
      })


  })


  const createRecord = []
  const updateRecord = []

  for (const record of propertyArray) {
    // const propertyAddress = record.propertyAddress.trim()
    // const caseNumber = record.caseNumber.trim()

    // console.log(
    //   "Property Address: " + propertyAddress,
    //   "Case Number: " + caseNumber
    // )
    const property = await Property.findOne({
      $and: [
        {
          propertyAddress: new RegExp(record.propertyAddress.trim(), "gi"), //instead of this I can use the state and property address since the case number seems to be not working properly.
        },
        {
          state: new RegExp(record.state.trim(), "gi"),
        },
      ],
    })

    if (!property) {
      createRecord.push(record)
    } else {

      updateRecord.push(record)
    }
  }
    console.log("running")


  // create property if data no where to be found

  const createRecordFunc = async (record) => {
    const {
      propertyAddress,
      caseNumber,
      saleDate,
      saleTime,
      openingBid,
      beforeSaleNotes,
      city,
      state,
      ...data
    } = record
    const currentYear = new Date().getFullYear()
    const modifiedSaleDate = saleDate.split(" ").pop()
    const yearOfDate = modifiedSaleDate.split("/")[2]
    const correctDate =
      yearOfDate == undefined
        ? modifiedSaleDate + "/" + currentYear
        : modifiedSaleDate

    const mapReq = await stylesService.forwardGeocode({
      query: propertyAddress + ", " + city + " " + state,
      types: ["address"],
      limit: 1,
    })

        // console.log("create record")
        // console.log(
          
        //   "Property Address: " + record.propertyAddress,
        //   "Case Number: " + record.caseNumber
        // )


    const response = await mapReq.send()
    const match = response.body

    const property = await new Property({
      saleinfo: [
        {
          caseNumber: caseNumber.trim(),
          saleDate: correctDate,
          saleTime: saleTime.trim(),
          openingBid: +openingBid,
          beforeSaleNotes: beforeSaleNotes.trim(),
        },
      ],
      geo: {
        long: match.features[0].center[0],
        lat: match.features[0].center[1],
      },
      location: {
        type: "Point",
        coordinates: [match.features[0].center[0], match.features[0].center[1]],
      },
      propertyAddress,
      city: city.trim(),
      state:
        state.trim() == "NC"
          ? "North Carolina"
          : state.trim() == "SC"
          ? "South Carolina"
          : state.trim(),
      ...data,
    })

    await property.save()
  }

  if (createRecord.length !== 0) {
      for (const record of createRecord) {
        // createRecord.forEach(async (record) => {
        createRecordFunc(record)
        // })
      }

    }
  
         console.log( "Record Created " + createRecord.length)


  // Update the property info if the data exist.

  const updateRecordFunc = async (record) => {
    const { saleDate, saleTime, openingBid, beforeSaleNotes } = record

    const currentYear = new Date().getFullYear()
    const modifiedSaleDate = saleDate.split(" ").pop()
    const yearOfDate = modifiedSaleDate.split("/")[2]
    const correctDate =
      yearOfDate == undefined
        ? modifiedSaleDate + "/" + currentYear
        : modifiedSaleDate
    
    //         console.log("Update record")


    // console.log("Property Address: " + record.propertyAddress, "Case Number: " + record.caseNumber)

    const property = await Property.find({
     
              propertyAddress: new RegExp(record.propertyAddress.trim(), "gi"),
            }     
   )
    // check if the sale date matched .. otherwise push the data to create another array of obj.
    const saleInfo = property[0].saleinfo

    const matchedSale = saleInfo.findIndex((sale) => {
      return (
        new Date(sale.saleDate).toDateString() ==
        new Date(saleDate).toDateString()
      )
    })

    if (matchedSale == -1) {
      saleInfo.push({
        saleDate: correctDate,
        saleTime,
        openingBid: +openingBid,
        beforeSaleNotes: beforeSaleNotes.trim(),
      })
    } else {
      saleInfo[matchedSale] = {
        saleDate: correctDate,
        saleTime,
        openingBid,
        beforeSaleNotes: `${beforeSaleNotes.trim()}\n${
          saleInfo[matchedSale].beforeSaleNotes &&
          saleInfo[matchedSale].beforeSaleNotes.trim()
        }`,
      }
    }

    await property[0].save()
  }

  if (updateRecord.length !== 0) {
    for (const record of updateRecord) {
      updateRecordFunc(record)
    }

  }

    

  console.log("Record Updated "+updateRecord.length)
  
  // console.log(`CreatedRecord : ${createRecord.lenght != 0 ? createRecord[0].propertyAddress + createRecord[0].caseNumber : ""}` )
  // console.log(
  //   `updateRecord : ${
  //     createRecord.lenght != 0
  //       ? createRecord[0].propertyAddress + createRecord[0].caseNumber
  //       : ""
  //   }`
  // )

  
  browser.close()
}
  
  
//check on caseNumber input when someone create a property.

let server;
mongoose.connect(process.env.DB_SECRET_KEY, options, () => {

 server = app.listen(port, () => {
    console.log("Server listening on port " + port)

    cron.schedule("0 0 0 * * *", () => {
      autoMate()
      
    })

 })
  console.log("DB Connected")
   const io = socket(server, {
     cors: {
       origin: "*",
       methods: ["GET", "POST"],
     },
   })
   io.on("connection", function (socket) {
     console.log("Made socket connection")
    //  console.log(socket.handshake.query.userId)
     const userId = socket.handshake.query.userId

const filter = [
  { $match: { operationType: "insert" } },
  // {
  //   $project: {
  //     "fullDocument.user_id": 1,
  //     "fullDocument.chats": 0,
  //     "fullDocument._id": 0,
  //     "fullDocument.first_name": 0,
  //     "fullDocument.last_name": 0,
  //   },
  // },
]

      const changedNotification = Notification.watch(filter)
    //  console.log(changedNotification)
     changedNotification.on("change", function (notification) {
       if (notification.fullDocument.userId == userId) {
         socket.emit("notifications", notification.fullDocument)
         if (
           notification.fullDocument.title == "Buy it" &&
           notification.fullDocument.targetedUser != "NA"
         ) {
           const date = new Date(notification.fullDocument.saleDate)
             .toISOString()
             .split("T")[0]
           const sendDate = new String(date) + " 10:00:00 UTC+0600"
           const notificationt = {
             contents: {
               en: "Sale Date Reminder!!!",
             },
             headings: {
               en:
                 "Sale Date is today. " +
                 notification.fullDocument.propertyAddress,
             },
             include_player_ids: [notification.fullDocument.targetedUser],
             send_after: sendDate,
           }

           client
             .createNotification(notificationt)
             .then(() => {
               //  console.log(response)
             })
             .catch((e) => {
               console.log(e)
             })
         }
         
       }
      })
      // console.log(socket.handshake.query.userId)
      // Notification.find().then((result) => socket.emit("notifications", result))

     socket.on("disconnect", () => {
       console.log("User disconnected.")
     })
   })

})

process.on('unhandledRejection', err => {
    console.log("unhandledRejection Error... System will terminate soon")
    console.log(err.name, err.message, err.stack)
    server.close(() => {
        process.exit(1)
    })

})



