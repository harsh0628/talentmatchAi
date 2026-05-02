const EvaluationReport = require('./evaluationReports.model');
const createGenericService = require('../../common/serviceFactory');

// The generic service factory creates standard CRUD handlers (list, getById, create, etc.).
// We can pass custom sort options, as this module sorts by `updatedAt`.
module.exports = createGenericService(EvaluationReport, { updatedAt: -1 });
