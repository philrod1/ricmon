const express = require('express');
const router = express.Router();
const { exec } = require("child_process");

router.get('/:ns/:dep', (req, res, next) => {
  exec(`kubectl describe pod ${req.params.dep} -n ${req.params.ns}`, (error, stdout, stderr) => {
      res.render('description', {dep: req.params.dep, ns:req.params.ns, data: stdout});
  });
});

router.post('/', (req, res, next) => {
  console.log(req.body);
  
  exec(`kubectl describe pod ${req.body['dep']} -n ${req.body['ns']}`, (error, stdout, stderr) => {
      res.send(stdout);
  });
});

module.exports = router;