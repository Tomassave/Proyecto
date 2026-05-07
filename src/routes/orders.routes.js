const express = require('express');
const orders = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, orders.createOrder);

module.exports = router;
