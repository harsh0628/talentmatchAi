const express = require('express');
const candidatesController = require('./candidates.controller');

const router = express.Router();

router.get('/', candidatesController.getCandidates);
router.get('/:id', candidatesController.getCandidate);
router.post('/', candidatesController.createCandidate);
router.patch('/:id', candidatesController.updateCandidate);
router.delete('/:id', candidatesController.deleteCandidate);

module.exports = router;
