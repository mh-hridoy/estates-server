// if (req.query.startDate || req.query.endDate) {
//     req.query.startDate = req.query.startDate ? req.query.startDate : new Date("2000-01-01").setHours(0, 0, 0, 0) //set it to 0 otherwise it wont track the current date/
//     req.query.endDate = req.query.endDate ? req.query.endDate : new Date("2100-12-31").setHours(24, 59, 59, 59) //set it to the last min .. that way the result will be more perfect/

//     property = Property.find({
//         "saleinfo.saleDate": { $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0), $lte: new Date(req.query.endDate).setHours(24, 59, 59, 59) },
//         propertyAddress: new RegExp(propertyAddress, "gi"), lotSqf: { $gte: startAcre, $lte: endAcre }
//     }
//     )
// }
// else if (req.query.startDate || req.query.endDate && startAcre || endAcre) {

//     req.query.startDate = req.query.startDate ? req.query.startDate : new Date("2000-01-01").setHours(0, 0, 0, 0) //set it to 0 otherwise it wont track the current date/
//     req.query.endDate = req.query.endDate ? req.query.endDate : new Date("2100-12-31").setHours(24, 59, 59, 59) //set it to the last min .. that way the result will be more perfect/

//      if (!startAcre) startAcre = 0
//     if (!endAcre) endAcre = 999

//     property = Property.find({
//         "saleinfo.saleDate": { $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0), $lte: new Date(req.query.endDate).setHours(24, 59, 59, 59) },
//         propertyAddress: new RegExp(propertyAddress, "gi"), lotSqf: { $gte: startAcre, $lte: endAcre }
//     }
//     )

// } 
// else {
//     property = Property.find(
//         {
//             propertyAddress: new RegExp(propertyAddress, "gi"), lotSqf: { $gte: startAcre, $lte: endAcre, $exists: false }

//         }

//     )
// }

    //new plan... make seperate conditional instace of query.

    // $or: [

    //     { "saleinfo.nameOfPurchaser": new RegExp(bidderName, "gi") },
    //     { "saleinfo.otherBidderInfo.nameOfUpsetBidder": new RegExp(bidderName, "gi") }
    // ],
