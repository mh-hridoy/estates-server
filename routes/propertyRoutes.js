const express = require('express')
const { addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty, getRequestedProperty, uploadFiles, deleteFile, uploadPictures, deleteImage, updateMap } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.get('/requested-property/:id', protectedRoute, getRequestedProperty)
router.post('/upload-files/:pId', protectedRoute, uploadFiles)
router.post('/upload-pictures/:id', protectedRoute, uploadPictures)
router.post('/add-property', protectedRoute, addProperty)
router.post('/delete-file/:id', protectedRoute, deleteFile)
router.post('/delete-image/:id', protectedRoute, deleteImage)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsaledate/:id', protectedRoute, addNewSaleDate)
router.delete('/delete-property', protectedRoute, deletePropery)
router.put('/update-property/:id', protectedRoute, updateProperty)
router.put('/update-map/:id', protectedRoute, updateMap)


module.exports = router;