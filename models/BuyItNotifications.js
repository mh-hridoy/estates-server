const mongoose = require("mongoose")
const Schema = mongoose.Schema

const buyItNotifications = new Schema(
  {
    title: String,
    message: String,
    status: { type: Boolean, default: true },
    propertyId: String,
    saleDate: Date,
    userId: String,
    propertyAddress: String,
    targetedUser: String
  },
  { timestamps: true }
)


module.exports = mongoose.model("Notification", buyItNotifications)
