const mongoose = require('mongoose');

const evaluationReportSchema = new mongoose.Schema(
	{
		candidateId: {
			type: String,
			required: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		role: {
			type: String,
			required: true,
			trim: true,
		},
		technical: {
			type: Number,
			required: true,
			min: 0,
			max: 10,
		},
		communication: {
			type: Number,
			required: true,
			min: 0,
			max: 10,
		},
		problemSolving: {
			type: Number,
			required: true,
			min: 0,
			max: 10,
		},
		summary: {
			type: String,
			default: '',
			trim: true,
		},
		strengths: {
			type: [String],
			default: [],
		},
		improvements: {
			type: [String],
			default: [],
		},
		recommendation: {
			type: String,
			enum: ['Strong Hire', 'Hire', 'Hold', 'Reject'],
			default: 'Hold',
		},
	},
	{
		timestamps: true,
	},
);

evaluationReportSchema.index({ candidateId: 1 }, { unique: true });

const EvaluationReport = mongoose.model('EvaluationReport', evaluationReportSchema);

module.exports = EvaluationReport;
