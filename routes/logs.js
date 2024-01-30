const express = require('express');
const router = express.Router();
const { exec } = require("child_process");


router.get('/:ns/:dep/:end', (req, res, next) => {
  exec(`kubectl logs ${req.params.dep} -n ${req.params.ns} | ${req.params.end} -n 100`, (error, stdout, stderr) => {
      res.render('logs', {dep: req.params.dep, ns:req.params.ns, data: stdout});
  });
});

module.exports = router;