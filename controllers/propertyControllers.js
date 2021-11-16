/* eslint-disable no-unused-vars */
const asynchErrorHandler = require("../utils/asynchErrorHandler")
const Property = require("../models/propertySchema")
const Errorhandler = require("../utils/ErrorHandler")
const { isValidObjectId } = require("mongoose")
const ibm = require("ibm-cos-sdk")
const sgMail = require("@sendgrid/mail")
const mbxClient = require("@mapbox/mapbox-sdk")
const mbxStyles = require("@mapbox/mapbox-sdk/services/geocoding")
const Notification = require("../models/BuyItNotifications")
const mongoose = require("mongoose")
const baseClient = mbxClient({ accessToken: process.env.MAPBOX_ACCESS_ID })
const stylesService = mbxStyles(baseClient)
// const fs = require("fs");
// const COS = require('ibm-cos-sdk-config') //to check the bucket config ---ref ---to the official documents.
const User = require("../models/userSchema")


var config = {
  endpoint: process.env.IBM_ENDPOINTS,
  apiKeyId: process.env.IBM_API_KEY,
  serviceInstanceId: process.env.IBM_SERVICE_ID,
  signatureVersion: "iam",
}

const cos = new ibm.S3(config)

const addProperty = asynchErrorHandler(async (req, res) => {
  const { propertyAddress, caseNumber, city, state, ...data } = req.body

  const mapReq = await stylesService.forwardGeocode({
    query: propertyAddress + ", " + city + " " + state,
    types: ["address"],
    limit: 1,
  })

  const response = await mapReq.send()
  const match = response.body

  const property = await new Property({
    saleinfo: [{ caseNumber: caseNumber }],
    geo: {
      long: match.features[0].center[0],
      lat: match.features[0].center[1],
    },
    propertyAddress,
    location: {
      type: "Point",
      coordinates: [match.features[0].center[0], match.features[0].center[1]],
    },

    ...data,
  })
  const savedProperty = await property.save()
  res.json({
    message: "Property added successfully.",
    savedProperty: savedProperty._id,
  })
})

const getProperties = asynchErrorHandler(async (req, res, next) => {
  Object.keys(req.query).forEach(
    (key) => req.query[key] == "" && delete req.query[key]
  )

  const allQuery = { ...req.query }

  const depricateQuery = ["sort", "page", "limit"]
  depricateQuery.forEach((el) => delete allQuery[el])

  let query = {}

  for (const [key, value] of Object.entries(allQuery)) {
    if (key == "startDate" || key == "endDate") {
      query = {
        ...query,
        "saleinfo.saleDate": {
          $gte: new Date(
            req.query.startDate ? req.query.startDate : "2000-01-01"
          ).setHours(0, 0, 0, 0),
          $lte: new Date(
            req.query.endDate ? req.query.endDate : "2100-12-31"
          ).setHours(24, 59, 59, 59),
        },
      }
    }

    if (key == "startAcre" || key == "endAcre") {
      query = {
        ...query,
        lotSqf: {
          $gte: allQuery.startAcre ? +allQuery.startAcre : 0,
          $lte: allQuery.endAcre ? +allQuery.endAcre : 1000,
        },
      }
    }

    if (key == "startSqf" || key == "endSqf") {
      query = {
        ...query,
        totalSqf: {
          $gte: allQuery.startSqf ? +allQuery.startSqf : 0,
          $lte: allQuery.endSqf ? +allQuery.endSqf : 99999,
        },
      }
    }

    if (key == "caseNumber") {
      query = {
        ...query,
        "saleinfo.caseNumber": new RegExp(allQuery.caseNumber, "gi"),
      }
    }

    if (key == "ownerFullName") {
      query = {
        ...query,
        "ownerInfo.ownerFullName": new RegExp(allQuery.ownerFullName, "gi"),
      }
    }

    if (key == "borrowerName") {
      query = {
        ...query,
        "borrowerInfo.borrowerName": new RegExp(allQuery.borrowerName, "gi"),
      }
    }

    if (allQuery.bidderName || allQuery.winningBidder) {
      query = {
        ...query,
        $or: [
          { "saleinfo.nameOfPurchaser": new RegExp(allQuery.bidderName, "gi") },
          {
            "saleinfo.otherBidderInfo.nameOfUpsetBidder": new RegExp(
              allQuery.bidderName,
              "gi"
            ),
          },
        ],
        // eslint-disable-next-line no-dupe-keys
        $or: [
          {
            $and: [
              { "saleinfo.isWinningBidder": true },
              {
                "saleinfo.nameOfPurchaser": new RegExp(
                  allQuery.winningBidder,
                  "gi"
                ),
              },
            ],
          },
          {
            $and: [
              { "saleinfo.otherBidderInfo.isWinningBidder": true },
              {
                "saleinfo.otherBidderInfo.nameOfUpsetBidder": new RegExp(
                  allQuery.winningBidder,
                  "gi"
                ),
              },
            ],
          },
        ],
      }
    }

    query = { ...query, [key]: new RegExp(value, "gi") }
  }

  Object.keys(query).forEach((key) => {
    query[key] == "" && delete query[key]
    query.startDate && delete query.startDate
    query.endDate && delete query.endDate
    query.startAcre && delete query.startAcre
    query.endAcre && delete query.endAcre
    query.startSqf && delete query.startSqf
    query.endSqf && delete query.endSqf
    query.caseNumber && delete query.caseNumber
    query.ownerFullName && delete query.ownerFullName
    query.borrowerName && delete query.borrowerName
    query.bidderName && delete query.bidderName
    query.winningBidder && delete query.winningBidder
  })

  let property = Property.find(query)
    .populate({
      path: "buyItUser",
    })
    .select(
      "-email -password -role -profilePicture -likedPropertys -status -setAlarmed -buyIt -selectedRole -usedResetToken -createdAt -name -notificationToken"
    )

  //copy the proerty object and make a  constructor to get totaldocument counts.
  //**** */
  const queryData = property.toConstructor()
  const copyQuery = new queryData()
  //**** */

  //pagination functionality
  //**** */

  const page = +req.query.page || 1
  const limit = +req.query.limit || 10
  const skip = (page - 1) * limit

  property = property.skip(skip).limit(limit)

  //for sort use -sortbyname to desc result.
  // console.log("sort is" + req.query.sort);
  if (req.query.sort !== undefined) {
    const modifiedSort = req.query.sort.split(",").join(" ")
    property = property.sort(modifiedSort)
  } else if (req.query.sort === undefined) {
    property = property.sort("createdAt")
  }

  let propertyCount
  if (req.query.page) {
    propertyCount = await copyQuery.countDocuments()

    if (skip > propertyCount)
      return next(new Errorhandler("Pgae not found", 400))
  }
  //**** */

  //execute Property
  const allProperty = await property

  const totalPage =
    allProperty.length !== 0 ? Math.ceil(propertyCount / limit) : 0

  res.json({ totalPage, totalSearchedProperty: propertyCount, allProperty })
})

const addBidderInfo = asynchErrorHandler(async (req, res, next) => {
  // const id = req.params.id;
  // const { saleinfoId, ...data } = req.body

  // const isValidId = isValidObjectId(id)

  // if (!isValidId) return next(new Errorhandler("Property not found"))

  // const property = await Property.findById({ _id: id })

  // if (!property) return next(new Errorhandler("Property not found"))

  // const selectedSaleDate = property.saleinfo.find((obj) => {
  //     const stringObjId = obj._id.toString()
  //     return stringObjId === saleinfoId
  // })

  // const otherBidderArray = selectedSaleDate.otherBidderInfo

  // otherBidderArray.push(data)

  // await property.save()

  //need to push bid info to the array
  res.json("this endpoint currenty deactivated")
})

//need to creaete another controller for the proeprty update.

const addNewSaleDate = asynchErrorHandler(async (req, res, next) => {
  // const id = req.params.id;
  // const { ...data } = req.body

  // const isValidId = isValidObjectId(id)

  // if (!isValidId) return next(new Errorhandler("Property not found"))

  // const property = await Property.findById({ _id: id })

  // if (!property) return next(new Errorhandler("Property not found"))

  // const saleInfoArray = property.saleinfo

  // saleInfoArray.push(data)

  // await property.save()

  //need to push bid info to the array
  res.json("this endpoint currenty deactivated")
})

const deletePropery = asynchErrorHandler(async (req, res, next) => {
  const { id } = req.body

  const idMongoId = id && id.map((el) => isValidObjectId(el))

  idMongoId.map((el) => {
    if (el === false) {
      return next(new Errorhandler("Please select valid propertyId"))
    }
  })

  const properties = await Property.find({ _id: { $in: id } })

  if (properties.length === 0)
    return next(new Errorhandler("No properties found"))

  const allFiles = []
  properties.forEach((property) => {
    property.propertyImages.length !== 0 &&
      property.propertyImages.forEach((image) => {
        allFiles.push(image.key)
      })
    property.infoTabFile.length !== 0 &&
      property.infoTabFile.forEach((file) => {
        allFiles.push(file.key)
      })

    property.saleinfo.length !== 0 &&
      property.saleinfo.forEach((saleinfo) => {
        saleinfo.saleInfoFiles.length !== 0 &&
          saleinfo.saleInfoFiles.forEach((file) => {
            allFiles.push(file.key)
          })
      })
  })

  if (allFiles.length !== 0) {
    allFiles.forEach((key) => {
      cos.deleteObject(
        {
          Bucket: "estates.app",
          Key: key,
        },
        async (err, data) => {
          if (err) {
            return next(new Errorhandler(err, 400))
          } else {
            await properties.deleteMany({ _id: { $in: id } })
          }

          if (allFiles.indexOf(key) == allFiles.length - 1) {
            res.status(200).json("Operation succesful!")
          }
        }
      )
    })
  } else {
    await Property.deleteMany({ _id: { $in: id } })
    res.status(200).json("Operation succesful!")
  }
})

const updateProperty = asynchErrorHandler(async (req, res, next) => {
  const id = req.params.id
  const { ...data } = req.body

  const isValidId = isValidObjectId(id)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: id })

  if (!property) return next(new Errorhandler("Property not found"))

  await property.updateOne({ ...data })

  //need to push bid info to the array
  res.json("Information updated successfully")
})

const getRequestedProperty = asynchErrorHandler(async (req, res, next) => {
  const id = req.params.id

  const isValidId = isValidObjectId(id)

  if (!isValidId) return next(new Errorhandler("Property not found", 400))

  const property = await Property.findById({ _id: id })
    .populate({
      path: "buyItUser",
    })
    .select(
      "-email -password -role -profilePicture -likedPropertys -status -setAlarmed -buyIt -selectedRole -usedResetToken -createdAt -name -notificationToken"
    )

  if (!property) return next(new Errorhandler("Property not found", 400))

  //need to push bid info to the array
  res.json(property)
})

const uploadFiles = asynchErrorHandler(async (req, res, next) => {
  const slelectedData = req.body
  const propertyId = req.params.pId

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  const responseData = []
  slelectedData.map((file) => {
    const base64Data = new Buffer.from(file.data, "base64")

    const params = {
      Bucket: "estates.app",
      Key: file.name,
      Body: base64Data,
      ContentType: file.type,
      ACL: "public-read",
    }

    cos.upload(params, async (err, data) => {
      if (err) {
        return next(new Errorhandler(err, 400))
      } else {
        const fileInfo = property.infoTabFile
        responseData.push(data)
        fileInfo.push(data)

        if (responseData.length == slelectedData.length) {
          await property.save()
          res.status(200).json(responseData)
        }
      }
    })
  })
})

const uploadSaleInfoFiles = asynchErrorHandler(async (req, res, next) => {
  const { selectedFiles, fieldKey } = req.body
  const propertyId = req.params.pId

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  const responseData = []
  selectedFiles.map((file) => {
    const base64Data = new Buffer.from(file.data, "base64")

    const params = {
      Bucket: "estates.app",
      Key: file.name,
      Body: base64Data,
      ContentType: file.type,
      ACL: "public-read",
    }

    cos.upload(params, async (err, data) => {
      if (err) {
        return next(new Errorhandler(err, 400))
      } else {
        const fileInfo =
          property.saleinfo[fieldKey] &&
          property.saleinfo[fieldKey].saleInfoFiles
        responseData.push(data)
        fileInfo.push(data)

        if (responseData.length == selectedFiles.length) {
          await property.save()
          res.status(200).json(responseData)
        }
      }
    })
  })
})

const deleteFile = asynchErrorHandler(async (req, res, next) => {
  const { key } = req.body

  const propertyId = req.params.id

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  cos.deleteObject(
    {
      Bucket: "estates.app",
      Key: key,
    },
    async (err, data) => {
      if (err) {
        return next(new Errorhandler(err, 400))
      } else {
        const fileInfo = property.infoTabFile //need to add the sale files. or create another instance of delete file for sale files.
        const indexOfDelFile = fileInfo.findIndex((file) => file.key === key)
        fileInfo.splice(indexOfDelFile, 1)

        await property.save()

        res.status(200).json(data)
      }
    }
  )
})

const uploadPictures = asynchErrorHandler(async (req, res, next) => {
  const propertyId = req.params.id
  const selectedImage = req.body

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  const responseData = []

  selectedImage.map((file) => {
    const base64Data = new Buffer.from(file.data, "base64")

    const params = {
      Bucket: "estates.app",
      Key: file.name,
      Body: base64Data,
      ContentType: file.type,
      ACL: "public-read",
    }

    cos.upload(params, async (err, data) => {
      if (err) {
        return next(new Errorhandler(err, 400))
      } else {
        const propertyImages = property.propertyImages
        responseData.push(data)
        propertyImages.push(data)

        if (responseData.length == selectedImage.length) {
          await property.save()
          res.status(200).json(responseData)
        }
      }
    })
  })

  // res.json("hit the endpoint")
})

const deleteImage = asynchErrorHandler(async (req, res, next) => {
  const { key } = req.body

  const propertyId = req.params.id

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  cos.deleteObject(
    {
      Bucket: "estates.app",
      Key: key,
    },
    async (err, data) => {
      if (err) {
        return next(new Errorhandler(err, 400))
      } else {
        const propertyImages = property.propertyImages
        const indexOfDelFile = propertyImages.findIndex(
          (file) => file.key === key
        )
        propertyImages.splice(indexOfDelFile, 1)

        await property.save()

        res.status(200).json(data)
      }
    }
  )
})

const updateMap = asynchErrorHandler(async (req, res, next) => {
  const geo = req.body

  const propertyId = req.params.id

  const isValidId = isValidObjectId(propertyId)

  if (!isValidId) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })

  if (!property) return next(new Errorhandler("Property not found"))

  await property.updateOne({
    geo: geo,
    location: { type: "Point", coordinates: [geo.long, geo.lat] },
  })

  res.status(200).json("Updated Successfully")
})

const addToBuyIt = asynchErrorHandler(async (req, res, next) => {
  const propertyId = req.params.id
  const { userId } = req.body

  const isValidId = isValidObjectId(propertyId)
  const isValidUser = isValidObjectId(userId)

  if (!isValidId) return next(new Errorhandler("Property not found"))
  if (!isValidUser) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })
  const user = await User.findById({ _id: userId })

  if (!property) return next(new Errorhandler("Property not found"))
  if (!user) return next(new Errorhandler("User not found"))

  const buyItUser = property.buyItUser
  const lastSaleInfo = property.saleinfo[property.saleinfo.length - 1]

  const userNotiToken = user.notificationToken ? user.notificationToken : "NA"

  const buyItNotification = await new Notification({
    title: "Buy it",
    message:
      "Congrats!! You've successfully added " +
      property.propertyAddress +
      " to your buy it list.",
    propertyId: propertyId,
    userId: userId,
    saleDate: lastSaleInfo.saleDate,
    propertyAddress: property.propertyAddress,
    targetedUser: userNotiToken,
  })

  await user.updateOne({
    $push: { buyIt: propertyId, buyItNotifications: buyItNotification._id },
  })
  buyItUser.push(userId)

  sgMail.setApiKey(process.env.SENDGRID_SECRET_KEY)
  const msg = {
    to: user.email, // Change to your recipient
    from: "alif.pab120na.12@gmail.com", // Change to your verified sender
    subject: "Buy it confirmation",
    text: "Buy it",
    html: `<h1>Your buy it request has been completed.</h1>
            `,
  }
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent")
    })
    .catch((error) => {
      console.error(error)
    })

  await buyItNotification.save()
  await property.save()
  // await user.save()

  res.status(200).json("Buy it successfully.")
})

const checkBuyIt = asynchErrorHandler(async (req, res, next) => {
  const propertyId = req.params.id
  const { userId } = req.body

  const isValidId = isValidObjectId(propertyId)
  const isValidUser = isValidObjectId(userId)

  if (!isValidId) return next(new Errorhandler("Property not found"))
  if (!isValidUser) return next(new Errorhandler("Property not found"))

  const property = await Property.findById({ _id: propertyId })
  const user = await User.findById({ _id: userId })

  if (!property) return next(new Errorhandler("Property not found"))
  if (!user) return next(new Errorhandler("Property not found"))

  const userBuyItLisy = user.buyIt

  let response

  userBuyItLisy &&
    userBuyItLisy.length !== 0 &&
    userBuyItLisy.forEach((property) => {
      if (property == propertyId) {
        response = "Y"
      } else {
        response = "N"
      }
    })

  res.status(200).json(response)
})

const passOnIt = asynchErrorHandler(async (req, res, next) => {
  const propertyId = req.params.id
  const { userId } = req.body

  const isValidId = isValidObjectId(propertyId)
  const isValidUser = isValidObjectId(userId)

  if (!isValidId) return next(new Errorhandler("Property not found"))
  if (!isValidUser) return next(new Errorhandler("No User Found"))

  const property = await Property.findById({ _id: propertyId })
  const user = await User.findById({ _id: userId })

  if (!property) return next(new Errorhandler("Property not found"))
  if (!user) return next(new Errorhandler("No User Found"))

  const useList = property.buyItUser

  const buyItNotification = await new Notification({
    title: "Pass on it",
    message: "Successfull pass on the property" + property.propertyAddress,
    propertyId: propertyId,
    userId: userId,
  })

  useList &&
    useList.length != 0 &&
    useList.map((userid, index) => {
      if (userid == userId) useList.splice(index, 1)

      return useList
    })

  const mongooseTypeId = mongoose.Types.ObjectId(propertyId)

  await user.updateOne({
    $pull: { buyIt: mongooseTypeId },
    $push: { buyItNotifications: buyItNotification._id },
  })
  await buyItNotification.save()
  await property.save()

  res.status(200).json("Successfully pass on.")
})

const getPropertyByMap = asynchErrorHandler(async (req, res, next) => {
  const { west, east, south, north } = req.query

  const property = await Property.find({
    location: {
      $geoWithin: {
        $box: [
          [west, east],
          [south, north],
        ],
      },
    },
  })

  const allPropertyData = []

  for (const record of property) {
    allPropertyData.push({
      _id: record._id,
      propertyAddress: record.propertyAddress,
      city: record.city,
      state: record.state,
      zip: record.zip,
      propertyImages: record.propertyImages,
      geo: record.geo,
      totalSqf: record.totalSqf,
      countyValue: record.countyValue,
    })
  }

  res.status(200).json(allPropertyData)
})

const getSinglePropertyByMap = asynchErrorHandler(async (req, res, next) => {
  const id = req.params.id

  const isValidId = isValidObjectId(id)

  if (!isValidId) return next(new Errorhandler("Property not found", 400))

  const property = await Property.findById({ _id: id }).populate({
    path: "buyItUser"
  }).select(
      "-email -password -role -profilePicture -likedPropertys -status -setAlarmed -buyIt -selectedRole -usedResetToken -createdAt  -name -notificationToken")

  if (!property) return next(new Errorhandler("Property not found", 400))

  property.infoTabFile = undefined
  property.countyRODURL = undefined
  property.manualSearch = undefined
  property.noActiveMortgageLien = undefined
  property.firstmortgageInfo = undefined
  property.secondMortgageInfo = undefined
  property.thirdMortgageInfo = undefined
  property.otherMortgageInfo = undefined
  property.hoaLien = undefined
  property.taxLien = undefined
  property.sameOwner = undefined
  property.pacer = undefined
  property.ownerInfo = undefined
  property.sameAsOwner = undefined
  property.addressSameAsOwner = undefined
  property.borrowerInfo = undefined
  property.OwnerDocs = undefined
  property.saleinfo = undefined
  property.amEmail = undefined
  property.buyItUser = undefined
  //need to push bid info to the array
  res.json(property)
})

const propertyForHome = asynchErrorHandler(async (req, res, next) => {
  const property = await Property.find().limit(10)

  const allPropertyData = []

  for (const record of property) {
    allPropertyData.push({
      _id: record._id,
      propertyAddress: record.propertyAddress,
      city: record.city,
      state: record.state,
      zip: record.zip,
      propertyImages: record.propertyImages,
      geo: record.geo,
      totalSqf: record.totalSqf,
      countyValue: record.countyValue,
    })
  }

  res.status(200).json(allPropertyData)
})

const readNotification = asynchErrorHandler(async (req, res, next) => {
  const { notiId } = req.body

  const notification = await Notification.findById({ _id: notiId })


  await notification.updateOne({status: false})

  res.status(200).json("Operation succesful!")
})

const getNotifications = asynchErrorHandler(async (req, res, next) => {
  const id = req.params.id

  const isValidId = isValidObjectId(id)

  if (!isValidId) return next(new Errorhandler("User not found", 400))

  const notifications = await User.findById({ _id: id })
    .populate({
      path: "buyItNotifications", options : {sort : "-createdAt"}
    })
    .select(
      "-email -password -role -profilePicture -likedPropertys -status -setAlarmed -buyIt -selectedRole -usedResetToken -_id -buyIt -name -notificationToken"
  )
  
  if (!notifications) return next(new Errorhandler("Property not found", 400))
  //need to push bid info to the array
  res.json(notifications)
})

const storeNotiToken = asynchErrorHandler(async (req, res, next) => {
  const id = req.params.id
  const {token} = req.body

  const user = await User.findById({ _id: id })


    if (!user) return next(new Errorhandler("No User Found"))

  await user.updateOne({ notificationToken: token })
  
  res.status(200).json("Token Saved successfully.")
})

const getStats = asynchErrorHandler(async (req, res, next) => {
  const propertyStats = await Property.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date("2021-01-01"),
          $lte: new Date("2021-12-31"),
        },
      },
    },
    {
      $group: { _id: { $month: "$createdAt" }, totalCreated: { $sum: 1 } },
    },
    { $project: { totalCreated : 1, _id : 0, month : "$_id" } },
  ])
  

  res.status(200).json(propertyStats)

})

module.exports = {
  addProperty,
  storeNotiToken,
  readNotification,
  getProperties,
  addBidderInfo,
  deletePropery,
  addNewSaleDate,
  updateProperty,
  getRequestedProperty,
  uploadFiles,
  deleteFile,
  uploadPictures,
  propertyForHome,
  getStats,
  deleteImage,
  updateMap,
  uploadSaleInfoFiles,
  addToBuyIt,
  checkBuyIt,
  passOnIt,
  getPropertyByMap,
  getSinglePropertyByMap,
  getNotifications,
}
