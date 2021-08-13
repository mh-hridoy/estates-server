const express = require('express')
const { addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate, updateProperty } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.post('/add-property', protectedRoute, addProperty)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsaledate/:id', protectedRoute, addNewSaleDate)
router.put('/update-property/:id', protectedRoute, updateProperty)
router.delete('/delete-property', protectedRoute, deletePropery)

module.exports = router;