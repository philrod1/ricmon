const express = require('express');
const router = express.Router();
const { getJSON } = require('../helper');
const { exec } = require("child_process");
const { redirect } = require('express/lib/response');


router.get('/', (req, res, next) => {
  res.render('index', {title: 'RIC Stuff'});
});

router.get('/charts', (req, res, next) => {
  const result = getJSON('http://127.0.0.1:8090/api/charts', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/appmgr', (req, res, next) => {
  const result = getJSON('http://10.97.161.231:8080/ric/v1/xapps', '', 'get');
  result.then( json => {
    res.send(json);
  });
  // exec(`curl -s http://10.110.216.184:8080/ric/v1/xapps | jq .`, (error, stdout, stderr) => {
  //   res.render('json', {title: 'App Manager Says ...', json: stdout});
  // });
});

router.get('/xapps', (req, res, next) => {
  exec(`helm list --output json --namespace=ricxapp`, (error, stdout, stderr) => {
    res.send(stdout);
  });
});

router.get('/ric', (req, res, next) => {
  const result = getJSON('http://10.97.161.231:8080/ric/v1/config', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/e2mgr', (req, res, next) => {
  const result = getJSON('http://10.100.34.90:3800/v1/nodeb/states', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/e2sim', (req, res, next) => {
  exec(`docker logs --tail=100 oransim`, (error, stdout, stderr) => {
    res.render('logs', {dep: "oransim", ns: '', data: stdout});
  });
});

router.get('/pods', (req, res, next) => {
  exec("kubectl get pods -A", (error, stdout, stderr) => {
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s+/));
      // console.log(arr);
      res.render('pods', {title: 'Pods', data: arr});
  });
});

router.get('/deployments', (req, res, next) => {
  exec("kubectl get deployments -A", (error, stdout, stderr) => {
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s+/));
      // console.log(arr);
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
  exec(`helm list --output json --namespace=ricxapp`, (error, stdout, stderr) => {
    res.render('undeploy', {apps: JSON.parse(stdout)});
  });
});

router.post('/undeploy', (req, res, next) => {
  exec(`dms_cli uninstall --xapp_chart_name=${req.body['xapp-name']} --namespace=ricxapp`, (error, stdout, stderr) => {
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
