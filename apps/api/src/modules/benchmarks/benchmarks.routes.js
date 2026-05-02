const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const benchmarkController = require('./benchmarks.controller');

const router = express.Router();

/**
 * Benchmark CRUD operations
 */

// Create benchmark
router.post('/', requireAuth, benchmarkController.createBenchmark);

// Get all benchmarks
router.get('/', requireAuth, benchmarkController.getBenchmarks);

// Get statistics
router.get('/stats', requireAuth, benchmarkController.getBenchmarkStats);

// Run evaluation
router.post('/evaluate', requireAuth, benchmarkController.evaluateBenchmarks);

// Batch create (admin only)
router.post('/batch', requireAuth, benchmarkController.batchCreateBenchmarks);

module.exports = router;
