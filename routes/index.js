const express = require('express');
const router = express.Router();
const { getJSON } = require('../helper');
const { exec } = require("child_process");
const { redirect } = require('express/lib/response');
const { log } = require('console');


router.get('/', (req, res, next) => {
  res.render('index', {title: 'RIC Stuff'});
});

router.get('/charts', (req, res, next) => {
  const result = getJSON("http://10.97.12.62:32080/onboard/api/v1/charts", '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/appmgr', (req, res, next) => {
  const result = getJSON('http://10.109.140.200:8080/ric/v1/xapps', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/e2mgr', (req, res, next) => {
  const result = getJSON('http://10.108.54.194:3800/v1/nodeb/states', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/pods', (req, res, next) => {
  exec("kubectl get pods -A", (error, stdout, stderr) => {
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s+/));
      res.render('pods', {title: 'Pods', data: arr});
  });
});

router.get('/deployments', (req, res, next) => {
  exec("kubectl get deployments -A", (error, stdout, stderr) => {
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s+/));
      res.render('deployments', {title: 'Deployments', data: arr});
  });
});

router.get('/services', function(req, res, next) {
  exec("kubectl get services -A", (error, stdout, stderr) => {
      res.render('services', {title: 'Services', data: stdout});
  });
});

router.get('/deploy', (req, res, next) => {
  res.render('deploy');
});

router.post('/deploy', (req, res, next) => {
  exec("rm -rf tmp", () => {
    exec(`./deploy.sh ${req.body['git-url']}`, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
      }
      console.log(stdout);
    });
  });
  res.redirect('/pods');
});

router.get('/undeploy', (req, res, next) => {
  const result = getJSON("http://10.97.12.62:32080/onboard/api/v1/charts", '', 'get');
  result.then( json => {
    let apps = []
    for (const [, value] of Object.entries(JSON.parse(json))) {
      apps.push(...value);
      console.log(value[0]);
    }
    res.render('undeploy', {apps: apps});
  });
});

router.post('/undeploy', (req, res, next) => {
  const [name, version] = req.body['xapp-name'].split(":");
  exec(`curl -L -X DELETE http://10.109.140.200:8080/ric/v1/xapps/${name} && curl -L -X DELETE "http://10.110.222.54:8080/api/charts/${name}/${version}"`, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
    }
    console.log(stdout);
  });
  res.redirect('/pods');
});

router.get('/restart/:ns/:dep', (req, res, next) => {
  exec(`kubectl rollout restart deployments/${req.params.dep} -n ${req.params.ns}`, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
    }
    console.log(stdout);
  });
  res.redirect('/deployments');
});

module.exports = router;
