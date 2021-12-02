const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')



const resetCodeSchema = new Schema({
    resetCode: {
        type: String,
    },
    email: {
        type : String,
        unique: true
    },
    isVerified : {type : Boolean, default : false},
    createdAt: { type: Date, default: Date.now, index: { expires: 5000 } } //remember : Expires function or ttl service dosent work propertly with the referance shcema.. must create a new schema for resetCode and use this "createdAt" line code at the end. or anywher excepet under any declared sub doc.

})

resetCodeSchema.pre("save", async function (next) {
    this.resetCode = await bcrypt.hash(this.resetCode, 12)
    next()
})

resetCodeSchema.methods.comparetoken = async function (plainCode, bcryptCode) {
    return await bcrypt.compare(plainCode, bcryptCode)

}


module.exports = mongoose.model('Code', resetCodeSchema)

