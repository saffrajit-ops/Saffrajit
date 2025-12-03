const express = require('express');
const router = express.Router();
const taxonomyController = require('../controllers/taxonomy.controller');

router.get('/', taxonomyController.getAllTaxonomies);
router.get('/tree', taxonomyController.getTaxonomyTree);
router.get('/type/:type', taxonomyController.getTaxonomiesByType);
router.get('/id/:id', taxonomyController.getTaxonomyById);
router.get('/slug/:slug', taxonomyController.getTaxonomyBySlug);

module.exports = router;