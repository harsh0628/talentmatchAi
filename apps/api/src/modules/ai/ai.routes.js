const express = require('express');
const aiController = require('./ai.controller');

const router = express.Router();

router.post('/match-score', aiController.generateMatchScore);
router.post('/match-score-hybrid', aiController.generateHybridScore);
router.post('/match-score-workflow', aiController.generateWorkflowScore);
router.post('/skill-gap-analysis', aiController.generateSkillGapAnalysis);

module.exports = router;
