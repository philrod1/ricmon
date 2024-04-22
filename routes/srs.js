const express = require('express');
const router = express.Router();
const child_process = require('child_process');

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

router.get('/speed', (req, res, next) => {
    const child = child_process.spawnSync("tail", [ '-1', '/home/evo/iperf/client1.stats'], { encoding : 'utf8' });
    const speed = parseFloat(child.stdout.trim().split(" ")[1])
    if (speed > 100) {
        speed /= 1000;
    }
    res.send({"speed": speed});
});
router.get('/chart', (req, res, next) => {
    const child = child_process.spawnSync("tail", [ '-100', '/home/evo/iperf/client1.stats'], { encoding : 'utf8' });
    const lines = child.stdout.trim().split("\n").splice(3,103);
    let splitLines = lines.map((v) => {
        const x = parseInt(v.split(".")[0]);
        let y = parseFloat(v.split(" ")[1]);
        y = isNaN(y) ? 0 : y;
        if (y > 100) {
            y /= 1000;
        }
        if (x) {
            return {
                'x': x, 
                'y': y
            };
        } else {
            return null;
        }
    });
    splitLines = splitLines.filter(e => e);
    splitLines = splitLines.slice(splitLines.length - 90);
    const rollingAverage = [];
    for (let i = 1 ; i <= splitLines.length ; i++) {
        let total = 0;
        const start = Math.max(0, i-10);
        const count = Math.min(10, i);

        for (let j = start ; j < start + count ; j++) {
            total += splitLines[j].y
        }
        rollingAverage.push({
            'y': total / count,
            'x': splitLines[i-1].x
        });
    }
    res.send([
        {
            'name': 'Mbit/s',
            'data':  splitLines
        },
        {
            'name': 'Average',
            'data': rollingAverage
        }
    ]);
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