const express = require('express')
const { addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty, getRequestedProperty, uploadFiles, deleteFile } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.get('/requested-property/:id', protectedRoute, getRequestedProperty)
router.post('/upload-files', protectedRoute, uploadFiles)
router.post('/add-property', protectedRoute, addProperty)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsaledate/:id', protectedRoute, addNewSaleDate)
router.delete('/delete-property', protectedRoute, deletePropery)
router.delete('/delete-file/:id', protectedRoute, deleteFile)

router.put('/update-property/:id', protectedRoute, updateProperty)

module.exports = router;