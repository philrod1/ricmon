const express = require('express');
const router = express.Router();
const axios = require('axios');
const { exec } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);
const { getJSON } = require('../helper');
const e = require('express');

router.get('/', (req, res, next) => {
  res.render('index', { title: 'RIC Stuff' });
});

router.get('/status', async (req, res, next) => {
  let isAlive = false;
  let isReady = false;
  let dmsReady = false;
  let e2Status = 0;

  try {
    const { stdout } = await execPromise("echo $APPMGR_HTTP $E2MGR_HTTP");
    console.log("stdout:", stdout);
    
    const  [appmgr, e2mgr] = stdout.trim().split(' ');
    console.log(appmgr, e2mgr);

    try {
      let response = await axios.get(`http://${appmgr}:8080/ric/v1/health/alive`);
      isAlive = response.status === 200;
    } catch (error) {
      console.error('Error fetching alive status:');
    }

    try {
      response = await axios.get(`http://${appmgr}:8080/ric/v1/health/ready`);
      isReady = response.status === 200;
    } catch (error) {
      console.error('Error fetching ready status:');
    }

    const { stdout: dmsStdout } = await execPromise("/home/evo/.local/bin/dms_cli health");

    dmsReady = dmsStdout.trim() === "True";

    // Fetch E2 status
    try {
      let response = await axios.get(`http://${e2mgr}:3800/v1/nodeb/states`);
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
  const result = getJSON('http://127.0.0.1:8090/api/charts', '', 'get');
  result.then( json => {
    res.send(json);
  });
});

router.get('/appmgr', (req, res, next) => {
  exec("echo $APPMGR_HTTP", (error, stdout, stderr) => {
    const appmgr = stdout.trim();
    const result = getJSON(`http://${appmgr}:8080/ric/v1/xapps`, '', 'get');
    result.then( json => {
      res.send(json);
    });
  });
});

router.get('/xapps', (req, res, next) => {
  exec(`helm list --output json --namespace=ricxapp`, (error, stdout, stderr) => {
    res.send(stdout);
  });
});

router.get('/ric', (req, res, next) => {
  exec("echo $APPMGR_HTTP", (error, stdout, stderr) => {
    const appmgr = stdout.trim();
    const result = getJSON(`http://${appmgr}:8080/ric/v1/config`, '', 'get');
    result.then( json => {
      res.send(json);
    });
  });
});

router.get('/e2mgr', (req, res, next) => {
  exec("echo $E2MGR_HTTP", (error, stdout, stderr) => {
    const e2mgr = stdout.trim();
    const result = getJSON(`http://${e2mgr}:3800/v1/nodeb/states`, '', 'get');
    result.then( json => {
      res.send(json);
    });
  });
});

router.get('/e2sim', (req, res, next) => {
  exec(`docker logs oransim`, (error, stdout, stderr) => {
    res.render('logs', {dep: "oransim", ns: '', data: stdout});
  });
});

router.get('/pods', (req, res, next) => {
  exec("kubectl get pods -A", (error, stdout, stderr) => {
      stdout = stdout.replace(/\([^\)]*\)/g, '');
      const arr = stdout.trim().split(/\r?\n/).map(x => x.split(/\s+/));
      // console.log(arr);
      res.render('pods', {title: 'Pods', data: arr});
  });
});

router.get('/deployments', (req, res, next) => {
  exec("kubectl get deployments -A", (error, stdout, stderr) => {
      stdout = stdout.replace(/\([^\)]*\)/g, '');
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
  const result = getJSON('http://127.0.0.1:8090/api/charts', '', 'get');
  result.then( json => {
    res.render('undeploy', {apps: JSON.parse(json)});
  });
});

router.post('/undeploy', (req, res, next) => {
  const [name, version] = req.body['xapp'].split(":");
  console.log("Uninstalling", name, version);
  
  exec(`dms_cli uninstall --xapp_chart_name=${name} --namespace=ricxapp`, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
    }
    console.log(stdout);
    exec(`curl -X DELETE http://127.0.0.1:8090/api/charts/${name}/${version}`, (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
      }
      console.log(stdout);
    });
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
