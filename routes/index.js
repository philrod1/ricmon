const express = require('express');
const router = express.Router();
const { getJSON } = require('../helper');
const { exec } = require("child_process");
const { redirect } = require('express/lib/response');
const { log } = require('console');

const appMgrIP = process.env["APPMGR_HTTP"] || "127.0.0.1";
const e2MgrIp = process.env["E2MGR_HTTP"] || "127.0.0.1";
const user = process.env["USER"] || "evo";

router.get('/', (req, res, next) => {
  res.render('index', {title: 'RIC Stuff'});
});

router.get('/status', async (req, res, next) => {
  let isAlive = false;
  let isReady = false;
  let dmsReady = false;
  let e2Status = 0;

  try {

    try {
      let response = await axios.get(`http://${appMgrIP}:3003/ric/v1/health/alive`);
      isAlive = response.status === 200;
    } catch (error) {
      console.error('Error fetching alive status:');
    }

    try {
      response = await axios.get(`http://${appMgrIP}:3003/ric/v1/health/ready`);
      isReady = response.status === 200;
    } catch (error) {
      console.error('Error fetching ready status:');
    }

    const { stdout: dmsStdout } = await execPromise(`/home/${user}/.local/bin/dms_cli health`);

    dmsReady = dmsStdout.trim() === "True";

    // Fetch E2 status
    try {
      let response = await axios.get(`http://${e2MgrIp}:3800/v1/nodeb/states`);
      if (response.status === 200) {
        e2Status = response.data[0].connectionStatus === 'CONNECTED' ? 2 : 1;
      }
    } catch (error) {
      console.error('Error fetching E2 status:');
    }

    console.log(isAlive, isReady, dmsReady, e2Status);
    res.status(200).send({ isAlive, isReady, dmsReady, e2Status });
  } catch (error) {
    console.error('Error executing command:');
    res.status(500).send('Internal Server Error');
  }
});

router.get('/xapp/:name/:version', async (req, res, next) => {
  const status = {
    onboarded: false,
    installed: false,
    status: 'unknown',
    ready: false,
    deployment: null
  };
  const { name, version } = req.params;
  try {
    const chartJSON = await getJSON('http://127.0.0.1:8090/api/charts', '', 'get');
    let chartApps;
    try {
      chartApps = JSON.parse(chartJSON);
    } catch (parseError) {
      console.error('Error parsing chart JSON:', parseError);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (typeof chartApps !== 'object' || chartApps === null) {
      console.error('chartApps is not an object:', chartApps);
      res.status(500).send('Internal Server Error');
      return;
    }

    const chartAppVersions = chartApps[name];
    if (!Array.isArray(chartAppVersions)) {
      console.error(`No versions found for chart ${name}:`, chartApps);
      res.status(404).send(status);
      return;
    }

    const helmApp = chartAppVersions.find(v => v.version === version);
    
    if (!helmApp) {
      res.status(404).send(status);
      return;
    }
    status.onboarded = true;

    const { stdout } = await execPromise(`kubectl get pods -n ricxapp -o json`);
    const data = JSON.parse(stdout);
    
    const item = data.items.find(item => item.metadata.labels.release === name);
    
    if (!item) {
      res.status(200).send(status);
      return;
    }

    const { stdout: helmStdout } = await execPromise(`helm list -n ricxapp -o json | jq '.[] | select(.chart == "${name}-${version}")'`);
    
    const helmStatus = JSON.parse(helmStdout);
    
    if (!helmStatus) {
      res.status(200).send(status);
      return;
    }
    status.installed = true;
    status.status = helmStatus.status;
    status.deployment = item.metadata.name;
    const containerStatuses = item.status.containerStatuses || [];
    const containerStatus = containerStatuses.find(status => status.name === name && status.started);
    
    if (!containerStatus) {
      res.status(200).send(status);
      return;
    }
    status.started = containerStatus.started;
    status.ready = containerStatus.ready;
    res.status(200).send(status);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/charts', (req, res, next) => {
  // const result = getJSON("http://10.97.12.62:32080/onboard/api/v1/charts", '', 'get');
  const result = getJSON('http://127.0.0.1:8090/api/charts', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/appmgr', (req, res, next) => {
  const result = getJSON(`http://${appMgrIP}:8080/ric/v1/xapps`, '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/xapps', (req, res, next) => {
  exec(`helm list --output json --namespace=ricxapp`, (error, stdout, stderr) => {
    res.send(stdout);
  });
});

router.get('/e2mgr', (req, res, next) => {
  const result = getJSON(`http://${e2MgrIp}:3800/v1/nodeb/states`, '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/pods', (req, res, next) => {
  exec("kubectl get pods -A", (error, stdout, stderr) => {
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s\s+/));
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
