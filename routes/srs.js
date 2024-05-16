const express = require('express');
const router = express.Router();
const child_process = require('child_process');
const { log } = require('console');

router.get('', (req, res, next) => {
    var child = child_process.spawnSync("ls", ["/home/evo/srs_logs/"], { encoding : 'utf8' });
    let logs = "[\"";
    let line = child.stdout.trim();
    line = line.replace(/\.log/g, "");
    line = line.split("\n");
    line = line.join("\", \"");
    logs += line + "\"]";
    res.render('srs', {'title': 'SRS Logs', 'logs': JSON.parse(logs)});
});

const numbers = Array.from({length:100},(v,k)=>k.toString());

router.get('/speedo', (req, res, next) => {
    res.render('speed', {'title': 'Speed'});
});

router.get('/screens', (req, res, next) => {
    const child = child_process.spawnSync("ls", ['/var/run/screen/S-root', '2>/dev/null'], { encoding : 'utf8' });
    const screens = child.stdout.trim().split("\n").slice(1).map(s => s.split("\.")[1]);
    res.send({"screens": screens});
});

router.get('/speed/:id', (req, res, next) => {
    const id = req.params['id'];
    const child = child_process.spawnSync("tail", [ '-1', `/home/evo/iperf/server${id}.speed`], { encoding : 'utf8' });
    const lines = child.stdout.trim();
    const speed = parseInt(lines);
    res.send({"speed": speed});
});

router.get('/chart', (req, res, next) => {
    const results = []
    for (let i = 0 ; i < 6 ; i++) {
        const child = child_process.spawnSync("tail", [ '-100', `/home/evo/iperf/server${i}.speed`], { encoding : 'utf8' });
        let lines = child.stdout.trim().split("\n");
        if (lines.length < 100) {
            let padding = [...Array(100-lines.length)].fill(0);
            lines = padding.concat(lines);
        }
        let speeds = [];
        for (let x = 0 ; x < lines.length ; x++) {
            let y = parseInt(lines[x]) || 0;
            speeds.push({ 'x': x, 'y': y });
        }

        results.push([
            {
                'name': 'Mbit/s',
                'data':  speeds
            }
        ])
    }
    res.send(results);
});

router.get('/logs/:log', (req, res, next) => {
    const log = req.params['log'];
    const child = child_process.spawnSync("cat", [`/home/evo/srs_logs/${log}.log`], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/iperf', (req, res, next) => {
    res.render('iperf', {'title': 'iperf charts', 'labels': numbers});
});

router.get('/enb1', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/enb1.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/enb2', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/enb2.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/epc', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/epc.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue1', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue1.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue2', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue2.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue3', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue3.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue4', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue4.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

router.get('/ue5', (req, res, next) => {
    var child = child_process.spawnSync("cat", ["/home/evo/srs_logs/ue5.log"], { encoding : 'utf8' });
    res.send(child.stdout);
});

module.exports = router;