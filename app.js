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
var cron = require("node-cron")



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
    origin: ['http://localhost:3000', 'https://estate-client-p.herokuapp.com'], //frontend
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

  await page.screenshot({ path: "checking.jpeg", fullPage: true })

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
    propertyAddress = beforeSaleNotes.split(",")[4]
    city = beforeSaleNotes.split(",")[5]
    const stateAndZip = beforeSaleNotes.split(",")[6]
    const stateStr = stateAndZip.match(/[a-zA-Z]+/g)
    state = stateStr.join(" ")
    const zipCode = stateAndZip.match(/\d+/g)
    zip = +zipCode[0]
    openingBid = beforeSaleNotes.split(",")[7]

      propertyArray.push({
        county: county.trim(),
        saleDate: saleDate,
        saleTime: saleTime.trim(),
        caseNumber: caseNumber.trim(),
        propertyAddress: propertyAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip,
        openingBid: openingBid,
        beforeSaleNotes: beforeSaleNotes.trim(),
      })
    })
  const createRecord = []
  const updateRecord = []

  for (const record of propertyArray) {
    const propertyAddress = record.propertyAddress.trim()
    const caseNumber = record.caseNumber.trim()
    const property = await Property.find({
      $and: [
        {
          propertyAddress: new RegExp(propertyAddress, "gi"), //instead of this I can use the state and property address since the case number seems to be not working properly.
        },
        {
          "saleinfo.caseNumber": new RegExp(caseNumber, "gi"),
        },
      ],
    })

    if (property.length == 0) {
      createRecord.push(record)
    } else {
      updateRecord.push(record)
    }
  }
    console.log("running")


  // create property if data no where to be found
  createRecord.length !== 0 &&
    createRecord.forEach(async (record) => {
      const {
        propertyAddress,
        caseNumber,
        saleDate,
        saleTime,
        openingBid,
        beforeSaleNotes,
        ...data
      } = record
      const currentYear = new Date().getFullYear()
      const modifiedSaleDate = saleDate.split(" ").pop()
      const yearOfDate = modifiedSaleDate.split("/")[2]
      const correctDate =
        yearOfDate == undefined
          ? modifiedSaleDate + "/" + currentYear
          : modifiedSaleDate

      // console.log(caseNumber)
      
      const property = await new Property({
        saleinfo: [
          {
            caseNumber: caseNumber.trim(),
            saleDate: correctDate,
            saleTime: saleTime.trim(),
            openingBid: openingBid.trim(),
            beforeSaleNotes: beforeSaleNotes.trim(),
          },
        ],
        propertyAddress,
        ...data,
      })
      
    await property.save()
    })
  console.log(createRecord.length)

  // Update the property info if the data exist.
  updateRecord.length !== 0 && updateRecord.forEach(async (record) => {

    const {
      saleDate,
      saleTime,
      openingBid,
      beforeSaleNotes,
    } = record

     const currentYear = new Date().getFullYear()
     const modifiedSaleDate = saleDate.split(" ").pop()
     const yearOfDate = modifiedSaleDate.split("/")[2]
     const correctDate =
       yearOfDate == undefined
         ? modifiedSaleDate + "/" + currentYear
        : modifiedSaleDate
    
    const property = await Property.find({
      $or: [
        {
          $and: [
            {
              propertyAddress: new RegExp(record.propertyAddress.trim(), "gi"),
            },
            {
              "saleinfo.caseNumber": new RegExp(record.caseNumber.trim(), "gi"),
            },
          ],
        },
      ],
    })
    //check if the sale date matched .. otherwise push the data to create another array of obj.
    const saleInfo = property[0].saleinfo

    const matchedSale = saleInfo.findIndex(
      (sale) => {
        return new Date(sale.saleDate).toDateString() == new Date(saleDate).toDateString()
      }
    )

    if (matchedSale == -1) {
      saleInfo.push({
        saleDate: correctDate,
        saleTime,
        openingBid,
        beforeSaleNotes: beforeSaleNotes.trim(),
      })
    } else {
      saleInfo[matchedSale] = {
        saleDate: correctDate,
        saleTime,
        openingBid,
        beforeSaleNotes: `${beforeSaleNotes.trim()}
        ${
          saleInfo[matchedSale].beforeSaleNotes &&
          saleInfo[matchedSale].beforeSaleNotes.trim()
        }`,
      }
    }

    await property[0].save()    

  })
    console.log(updateRecord.length)



  browser.close()
}

//check on caseNumber input when someone create a property.

let server;
mongoose.connect(process.env.DB_SECRET_KEY, options, () => {

  app.listen(port, () => {
    console.log("Server listening on port " + port)

    cron.schedule("10 10 00 * * *", () => {
          autoMate()
    })

})

    console.log("DB Connected")

})



process.on('unhandledRejection', err => {
    console.log("unhandledRejection Error... System will terminate soon")
    console.log(err.name, err.message, err.stack)
    server.close(() => {
        process.exit(1)
    })

})



