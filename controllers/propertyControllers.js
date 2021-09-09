/* eslint-disable no-unused-vars */
const asynchErrorHandler = require("../utils/asynchErrorHandler")
const Property = require("../models/propertySchema")
const Errorhandler = require("../utils/ErrorHandler")
const { isValidObjectId } = require("mongoose")

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


    if (!req.query.startDate) req.query.startDate = new Date("2000-01-01").setHours(24, 59, 59, 59)
    if (!req.query.endDate) req.query.endDate = new Date("2100-12-31").setHours(24, 59, 59, 59)


    //for better case search experience . NEED TO RECHECK CODE FOR THAT.
    //`/(var) | (var)/gi` // check this method
    // const modifiedNumber = caseNumber ? caseNumber.split(" ").join("") : undefined


    //didnot use await here because I had to sort these property before store them.. **checkout the all peroperty variable.

    let property = Property.find({
        "saleinfo.saleDate": { $gte: new Date(req.query.startDate).setHours(24, 59, 59, 59), $lte: new Date(req.query.endDate).setHours(24, 59, 59, 59) },
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
}
)


//will be working on update property functionality

module.exports = {
    addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty, getRequestedProperty
}


