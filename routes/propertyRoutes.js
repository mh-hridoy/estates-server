const express = require('express')
const { addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty, getRequestedProperty } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.get('/requested-property/:id', protectedRoute, getRequestedProperty)
router.post('/add-property', protectedRoute, addProperty)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsaledate/:id', protectedRoute, addNewSaleDate)
router.delete('/delete-property', protectedRoute, deletePropery)

router.put('/update-property/:id', protectedRoute, updateProperty)

module.exports = router;