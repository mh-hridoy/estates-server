const express = require('express')
const {
  addProperty,
  getProperties,
  addBidderInfo,
  deletePropery,
  addNewSaleDate,
  updateProperty,
  getRequestedProperty,
  uploadFiles,
  deleteFile,
  uploadPictures,
  deleteImage,
  updateMap,
  addToBuyIt,
  uploadSaleInfoFiles,
  checkBuyIt,
  readNotification,
  passOnIt,
  getNotifications,
  getStats,
  storeNotiToken,
  getPropertyByMap,propertyForHome,
  getSinglePropertyByMap,
} = require("../controllers/propertyControllers")
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();
router.get("/property-map", getPropertyByMap)
router.get("/home-property", propertyForHome)
router.get("/single-property-map/:id", getSinglePropertyByMap)
router.get('/properties', protectedRoute, getProperties)
router.get('/stats', protectedRoute, getStats)
router.get('/requested-property/:id', protectedRoute, getRequestedProperty)
router.get('/get-notifications/:id', protectedRoute, getNotifications)
router.delete('/delete-property', protectedRoute, deletePropery)
router.post('/read-notification', protectedRoute, readNotification)
router.post('/upload-files/:pId', protectedRoute, uploadFiles)
router.post('/store-notiken/:id', protectedRoute, storeNotiToken)
router.post("/upload-sale-info-files/:pId", protectedRoute, uploadSaleInfoFiles)
router.post('/upload-pictures/:id', protectedRoute, uploadPictures)
router.post("/buy-it/:id", protectedRoute, addToBuyIt)
router.post("/check-buy-it/:id", protectedRoute, checkBuyIt)
router.post("/pass-on-it/:id", protectedRoute, passOnIt)
router.post('/add-property', protectedRoute, addProperty)
router.post('/delete-file/:id', protectedRoute, deleteFile)
router.post('/delete-image/:id', protectedRoute, deleteImage)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsaledate/:id', protectedRoute, addNewSaleDate)
router.put('/update-property/:id', protectedRoute, updateProperty)
router.put('/update-map/:id', protectedRoute, updateMap)


module.exports = router;