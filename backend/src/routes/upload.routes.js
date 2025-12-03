const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadSingle } = require('../middlewares/upload');

// Upload single image
router.post('/image', uploadSingle, uploadController.uploadSingleImage);

// Delete image
router.delete('/image', uploadController.deleteImage);

module.exports = router;
