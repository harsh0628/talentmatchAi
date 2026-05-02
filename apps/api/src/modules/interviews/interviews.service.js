const Interview = require('./interviews.model');
const createGenericService = require('../../common/serviceFactory');

// The generic service factory creates standard CRUD handlers (list, getById, create, etc.).
module.exports = createGenericService(Interview);
