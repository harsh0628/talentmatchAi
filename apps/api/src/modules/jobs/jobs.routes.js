const express = require('express');
const jobsController = require('./jobs.controller');

const router = express.Router();

router.get('/', jobsController.getJobs);
router.get('/:id', jobsController.getJob);
router.post('/', jobsController.createJob);
router.patch('/:id', jobsController.updateJob);
router.delete('/:id', jobsController.deleteJob);

module.exports = router;
