const express = require('express')
const { addProperty, getProperties, updateProperty, deletePropery } = require('../controllers/propertyControllers')
const protectedRoute = require('../utils/protectedRoute')

const router = express.Router();

router.get('/properties', protectedRoute, getProperties)
router.post('/add-property', protectedRoute, addProperty)
router.patch('/update-property/:id', protectedRoute, updateProperty)
router.delete('/delete-property', protectedRoute, deletePropery)



module.exports = router;