const express = require('express');
const router = express.Router();

router.get('', (req, res, next) => {
    res.render('sim', {'title': 'Sim'});
});

module.exports = router;