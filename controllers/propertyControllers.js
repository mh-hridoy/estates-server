/* eslint-disable no-unused-vars */
const asynchErrorHandler = require("../utils/asynchErrorHandler")
const Property = require("../models/propertySchema")
const Errorhandler = require("../utils/ErrorHandler")
const { isValidObjectId } = require("mongoose")
const ibm = require('ibm-cos-sdk');
const fs = require('fs')
// const COS = require('ibm-cos-sdk-config') //to check the bucket config ---ref ---to the official documents.

var config = {
    endpoint: process.env.IBM_ENDPOINTS,
    apiKeyId: process.env.IBM_API_KEY,
    serviceInstanceId: process.env.IBM_SERVICE_ID,
    signatureVersion: 'iam',
};

const cos = new ibm.S3(config)

const addProperty = asynchErrorHandler(async (req, res) => {
    const { propertyAddress, ...data } = req.body
    const property = await new Property({ propertyAddress, ...data })
    await property.save()
    res.json('Property added successfully.')
})

const getProperties = asynchErrorHandler(async (req, res, next) => {

    const allQuery = { ...req.query }

    const depricateQuery = ["sort", "page", "limit", "fields", "startDate", "endDate"]
    depricateQuery.forEach(el => delete allQuery[el])


    // eslint-disable-next-line no-unused-vars
    //all the query field should have one default value in SCHEMA. otherwise mongodb sucks at query data even when using fucking $exists field...😡

    let { winningBidder, bidderName, startSqf, endSqf, startAcre, endAcre, ownerFullName, caseNumber, propertyAddress, city, state, county, PropertyDescription, legalDesc, borrowerName, ...data } = allQuery


    //if I dont clarify what would happen if the user dosent provide startDate and endDate then it would thorw error. also these dates dosent work on the find property method with single new Date() method... kinda bug of mongoose...

    //

    //  IMPORTANT NOTE : MONGOOSE DOSENT TAKE PARAMS AS UNDEFINED FOR NUMBER AND DATE OBJECT.
    //
    if (!startAcre) startAcre = 0
    if (!endAcre) endAcre = 999

    if (!startSqf) startSqf = 0
    if (!endSqf) endSqf = 99999

    //


    if (!req.query.startDate) req.query.startDate = new Date("2000-01-01").setHours(0, 0, 0, 0) //set it to 0 otherwise it wont track the current date/
    if (!req.query.endDate) req.query.endDate = new Date("2100-12-31").setHours(24, 59, 59, 59) //set it to the last min .. that way the result will be more perfect/


    //for better case search experience . NEED TO RECHECK CODE FOR THAT.
    //`/(var) | (var)/gi` // check this method
    // const modifiedNumber = caseNumber ? caseNumber.split(" ").join("") : undefined


    //didnot use await here because I had to sort these property before store them.. **checkout the all peroperty variable.

    let property = Property.find({
        "saleinfo.saleDate": { $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0), $lte: new Date(req.query.endDate).setHours(24, 59, 59, 59) },
        totalSqf: { $gte: startSqf, $lte: endSqf },
        lotSqf: { $gte: startAcre, $lte: endAcre },
        "ownerInfo.ownerFullName": new RegExp(ownerFullName, "gi"),
        "borrowerInfo.borrowerName": new RegExp(borrowerName, "gi"),
        propertyAddress: new RegExp(propertyAddress, "gi"), city: new RegExp(city, "gi"), state: new RegExp(state, "gi"), county: new RegExp(county, "gi"), PropertyDescription: new RegExp(PropertyDescription, "gi"), legalDesc: new RegExp(legalDesc, "gi"), "saleinfo.caseNumber": new RegExp(caseNumber, "gi"), ...data
    })

    //select the last index of array
    // const saleInfoArray = property.schema.obj.saleinfo
    // const lastSaleInfo = saleInfoArray[saleInfoArray.length - 1].saleDate

    //need try with if state blocks.
    if (bidderName || winningBidder) {
        property = Property.find({
            "saleinfo.saleDate": { $gte: req.query.startDate, $lte: req.query.endDate },
            totalSqf: { $gte: startSqf, $lte: endSqf },
            lotSqf: { $gte: startAcre, $lte: endAcre },
            "ownerInfo.ownerFullName": new RegExp(ownerFullName, "gi"),
            "borrowerInfo.borrowerName": new RegExp(borrowerName, "gi"),
            propertyAddress: new RegExp(propertyAddress, "gi"), city: new RegExp(city, "gi"), state: new RegExp(state, "gi"), county: new RegExp(county, "gi"), PropertyDescription: new RegExp(PropertyDescription, "gi"), legalDesc: new RegExp(legalDesc, "gi"), "saleinfo.caseNumber": new RegExp(caseNumber, "gi"),
            $or: [

                { "saleinfo.firstBidderInfo.nameOfPurchaser": new RegExp(bidderName, "gi") },
                { "saleinfo.otherBidderInfo.nameOfUpsetBidder": new RegExp(bidderName, "gi") }
            ],
            // eslint-disable-next-line no-dupe-keys
            $or: [
                {
                    $and: [{ "saleinfo.firstBidderInfo.isWinningBidder": true },
                    { "saleinfo.firstBidderInfo.nameOfPurchaser": new RegExp(winningBidder, "gi") }]
                },
                {
                    $and: [{ "saleinfo.otherBidderInfo.isWinningBidder": true },
                    { "saleinfo.otherBidderInfo.nameOfUpsetBidder": new RegExp(winningBidder, "gi") }]
                }

            ],
            ...data

        })
    }


    //for sort use -sortbyname to desc result.
    if (req.query.sort) {
        const modifiedSort = req.query.sort.split(",").join(" ")
        property = property.sort(modifiedSort)

    } else {
        property = property.sort("-createdAt")

    }

    //copy the proerty object and make a  constructor to get totaldocument counts.
    const queryData = property.toConstructor();
    const copyQuery = new queryData()

    //pagination functionality

    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 20
    const skip = (page - 1) * limit;

    property = property.skip(skip).limit(limit)

    let propertyCount;
    if (req.query.page) {
        propertyCount = await copyQuery.countDocuments()

        if (skip > propertyCount) return next(new Errorhandler("Pgae not found", 400))
    }

    //execute Property
    const allProperty = await property;

    const totalPage = allProperty.length !== 0 ? Math.ceil(propertyCount / limit) : 0


    res.json({ totalPage, totalSearchedProperty: propertyCount, allProperty })

})

const addBidderInfo = asynchErrorHandler(async (req, res, next) => {

    const id = req.params.id;
    const { saleinfoId, ...data } = req.body

    const isValidId = isValidObjectId(id)

    if (!isValidId) return next(new Errorhandler("Property not found"))

    const property = await Property.findById({ _id: id })

    if (!property) return next(new Errorhandler("Property not found"))

    const selectedSaleDate = property.saleinfo.find((obj) => {
        const stringObjId = obj._id.toString()
        return stringObjId === saleinfoId
    })

    const otherBidderArray = selectedSaleDate.otherBidderInfo

    otherBidderArray.push(data)

    await property.save()
    //need to push bid info to the array
    res.json("Information updated successfully")
})

//need to creaete another controller for the proeprty update.

const addNewSaleDate = asynchErrorHandler(async (req, res, next) => {
    const id = req.params.id;
    const { ...data } = req.body

    const isValidId = isValidObjectId(id)

    if (!isValidId) return next(new Errorhandler("Property not found"))

    const property = await Property.findById({ _id: id })

    if (!property) return next(new Errorhandler("Property not found"))

    const saleInfoArray = property.saleinfo

    saleInfoArray.push(data)

    await property.save()

    //need to push bid info to the array
    res.json("Information added successfully")

})

const deletePropery = asynchErrorHandler(async (req, res, next) => {
    const { id } = req.body


    const idMongoId = id && id.map(el => isValidObjectId(el))


    idMongoId.map((el) => {
        if (el === false) {
            return next(new Errorhandler("Please select valid propertyId"))
        }
    })

    const properties = await Property.find({ _id: { $in: id } })

    if (properties.length === 0) return next(new Errorhandler("No properties found"))


    await Property.deleteMany({ _id: { $in: id } })

    res.json("Operation succesful!")

})

const updateProperty = asynchErrorHandler(async (req, res, next) => {
    const id = req.params.id;
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

    const id = req.params.id;

    const isValidId = isValidObjectId(id)

    if (!isValidId) return next(new Errorhandler("Property not found", 400))

    const property = await Property.findById({ _id: id })

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
            ACL: "public-read"
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

const deleteFile = asynchErrorHandler(async (req, res, next) => {
    const { key } = req.body

    const propertyId = req.params.id

    const isValidId = isValidObjectId(propertyId)

    if (!isValidId) return next(new Errorhandler("Property not found"))

    const property = await Property.findById({ _id: propertyId })

    if (!property) return next(new Errorhandler("Property not found"))

    cos.deleteObject({
        Bucket: "estates.app",
        Key: key

    }, async (err, data) => {
        if (err) { return next(new Errorhandler(err, 400)) } else {
            const fileInfo = property.infoTabFile
            const indexOfDelFile = fileInfo.findIndex((file) => file.key === key)
            fileInfo.splice(indexOfDelFile, 1)

            await property.save()

            res.status(200).json(data)
        }

    })
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
            ACL: "public-read"
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

    cos.deleteObject({
        Bucket: "estates.app",
        Key: key

    }, async (err, data) => {
        if (err) { return next(new Errorhandler(err, 400)) } else {
            const propertyImages = property.propertyImages
            const indexOfDelFile = propertyImages.findIndex((file) => file.key === key)
            propertyImages.splice(indexOfDelFile, 1)

            await property.save()

            res.status(200).json(data)
        }

    })
})

const updateMap = asynchErrorHandler(async (req, res, next) => {
    const geo = req.body

    const propertyId = req.params.id

    const isValidId = isValidObjectId(propertyId)

    if (!isValidId) return next(new Errorhandler("Property not found"))

    const property = await Property.findById({ _id: propertyId })

    if (!property) return next(new Errorhandler("Property not found"))

    await property.updateOne({ geo: geo })



    res.status(200).json("Updated Successfully")

})


module.exports = {
    addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty, getRequestedProperty, uploadFiles, deleteFile, uploadPictures, deleteImage, updateMap
}

