const Job = require('./jobs.model');
const createGenericService = require('../../common/serviceFactory');

// The generic service factory creates standard CRUD handlers (list, getById, create, etc.).
module.exports = createGenericService(Job);
