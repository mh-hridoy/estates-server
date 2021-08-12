const express = require('express')
const { addProperty, getProperties, addBidderInfo, deletePropery, addNewSaleDate } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.post('/add-property', protectedRoute, addProperty)
router.patch('/add-bidderinfo/:id', protectedRoute, addBidderInfo)
router.patch('/add-newsale/:id', protectedRoute, addNewSaleDate)
router.delete('/delete-property', protectedRoute, deletePropery)

//need to create bidder and sale update middleware. also bidder and sale delete middleware.

module.exports = router;