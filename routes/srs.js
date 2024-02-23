const express = require('express');
const router = express.Router();
const child_process = require('child_process');

router.get('', (req, res, next) => {
    console.log("IN SRS");
    res.render('srs', {'title': 'SRS Logs'});
});

router.get('/enb', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/enb.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/epc', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/epc.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

module.exports = router;