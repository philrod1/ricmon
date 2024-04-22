const express = require('express');
const router = express.Router();

router.get('', (req, res, next) => {
    res.render('epc', {'title': 'EPC Logs'});
});

module.exports = router;