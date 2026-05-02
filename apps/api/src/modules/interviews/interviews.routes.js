const express = require('express');
const interviewsController = require('./interviews.controller');

const router = express.Router();

router.get('/', interviewsController.getInterviews);
router.get('/:id', interviewsController.getInterview);
router.post('/', interviewsController.createInterview);
router.patch('/:id', interviewsController.updateInterview);
router.delete('/:id', interviewsController.deleteInterview);

module.exports = router;
