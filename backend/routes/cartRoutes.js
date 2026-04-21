const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/cartController');

router.use(protect); 

router.get('/',                    ctrl.getCart);
router.post('/add',                ctrl.addItem);
router.put('/update',              ctrl.updateItem);
router.delete('/remove/:productId', ctrl.removeItem);
router.delete('/clear',            ctrl.clearCart);

module.exports = router;