/* eslint-disable no-unused-vars */
const asynchErrorHandler = require("../utils/asynchErrorHandler")
const Property = require("../models/propertySchema")
const Errorhandler = require("../utils/ErrorHandler")
const { isValidObjectId } = require("mongoose")

const addProperty = asynchErrorHandler(async (req, res) => {
    const { propertyAddress, ...data } = req.body
    const property = await new Property({ propertyAddress, ...data })
    await property.save()
    res.json('hit the endpoints')
})

const getProperties = asynchErrorHandler(async (req, res) => {

    const allQuery = { ...req.query }

    const depricateQuery = ["sort", "page", "limit", "fields"]
    depricateQuery.forEach(el => delete allQuery[el])


    // eslint-disable-next-line no-unused-vars
    let { startSqf, endSqf, startAcre, endAcre, ownerFullName, startDate, endDate, caseNumber, propertyAddress, city, state, county, PropertyDescription, legalDesc, ...data } = allQuery

    //if I dont clarify what would happen if the user dosent provide startDate and endDate then it would thorw error. also these dates dosent work on the find property method with single new Date() method... kind of a bug of mongoose...

    //
    if (!startDate) startDate = "2000-01-01"
    if (!endDate) endDate = "2100-12-31"

    //  IMPORTANT NOTE : MONGOOSE DOSENT TAKE PARAMS AS UNDEFINED FOR NUMBER AND DATE OBJECT.
    //
    if (!startAcre) startAcre = 0
    if (!endAcre) endAcre = 999

    if (!startSqf) startSqf = 0
    if (!endSqf) endSqf = 99999

    //
    //for better case search experience . NEED TO RECHECK CODE FOR THAT.
    //`/(var) | (var)/gi` // check this method
    // const modifiedNumber = caseNumber ? caseNumber.split(" ").join("") : undefined


    //didnot use await here because I had to sort these property before store them.. **checkout the all peroperty variable.
    let property = Property.find({
        totalSqf: { $gte: startSqf, $lte: endSqf },
        lotSqf: { $gte: startAcre, $lte: endAcre },
        "ownerInfo.ownerFullName": new RegExp(ownerFullName, "i"),
        propertyAddress: new RegExp(propertyAddress, "gi"), city: new RegExp(city, "i"), state: new RegExp(state, "i"), county: new RegExp(county, "i"), PropertyDescription: new RegExp(PropertyDescription, "i"), legalDesc: new RegExp(legalDesc, "i"), "saleinfo.caseNumber": new RegExp(caseNumber, "i"), "saleinfo.saleDate": { $gte: new Date(new Date(startDate)), $lte: new Date(new Date(endDate)) }, ...data
    })

    //Seletcting the last index of array
    // const saleInfoArray = property.schema.obj.saleinfo
    // const lastSaleInfo = saleInfoArray[saleInfoArray.length - 1].saleDate

    //for sort use -sortbyname to desc result.
    if (req.query.sort) {
        const modifiedSort = req.query.sort.split(",").join(" ")
        property = property.sort(modifiedSort)

    } else {
        property = property.sort("-createdAt")

    }
    //try creating same sale date. but change the yearBuilt values .

    //execute Property
    const allProperty = await property;

    res.json({ totalCount: allProperty.length, allProperty })

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


    const idMongoId = id.map(el => isValidObjectId(el))


    idMongoId.map((el) => {
        if (el === false) {
            return next(new Errorhandler("Please select valid propertyId"))
        }
    })

    const properties = await Property.find({ _id: { $in: id } })

    if (properties.length === 0) return next(new Errorhandler("No properties found"))


    await Property.deleteMany({ _id: { $in: id } })

    res.json("hit the endpoints")

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


//will be working on update property functionality

module.exports = {
    addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty
}


