const express = require('express');
const { body } = require('express-validator');
const cart = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');
const { sanitizeBody, validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, cart.getCart);

router.post(
  '/items',
  authenticate,
  sanitizeBody,
  [
    body('productId').trim().notEmpty().withMessage('ID de producto requerido'),
    body('quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  ],
  validate,
  cart.addToCart
);

router.put(
  '/items/:productId',
  authenticate,
  sanitizeBody,
  [body('quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')],
  validate,
  cart.updateCartItem
);

router.delete('/items/:productId', authenticate, cart.removeCartItem);

module.exports = router;
