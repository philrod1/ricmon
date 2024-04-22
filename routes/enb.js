const express = require('express');
const router = express.Router();

router.get('', (req, res, next) => {
    res.render('enb', {'title': 'ENB Logs'});
});

module.exports = router;