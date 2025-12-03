const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// Public route
router.post('/', contactController.submitContact);

// Admin routes
router.get(
  '/',

  contactController.getAllContacts
);

router.get(
  '/:id',


  contactController.getContactById
);

router.patch(
  '/:id',


  contactController.updateContactStatus
);

router.delete(
  '/:id',


  contactController.deleteContact
);

module.exports = router;
