const express = require('express');
const evaluationReportsController = require('./evaluationReports.controller');

const router = express.Router();

router.get('/', evaluationReportsController.getEvaluationReports);
router.get('/:id', evaluationReportsController.getEvaluationReport);
router.post('/', evaluationReportsController.createEvaluationReport);
router.patch('/:id', evaluationReportsController.updateEvaluationReport);
router.delete('/:id', evaluationReportsController.deleteEvaluationReport);

module.exports = router;
