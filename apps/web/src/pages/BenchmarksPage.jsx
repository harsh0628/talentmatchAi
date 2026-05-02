import { useState, useEffect } from 'react';
import {
	evaluateBenchmarks,
	getBenchmarks,
	getBenchmarkStats,
} from '../services/benchmarksApi';

function BenchmarksPage() {
	const [isEvaluating, setIsEvaluating] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	// Evaluation form
	const [evalForm, setEvalForm] = useState({
		category: '',
		difficulty: '',
		scoringMethod: 'gemini',
	});

	// Results
	const [benchmarkStats, setBenchmarkStats] = useState(null);
	const [evaluationResults, setEvaluationResults] = useState(null);
	const [testCases, setTestCases] = useState([]);

	// Load data on mount
	useEffect(() => {
		loadBenchmarkStats();
		loadTestCases();
	}, []);

	async function loadBenchmarkStats() {
		try {
			const stats = await getBenchmarkStats();
			setBenchmarkStats(stats);
		} catch (error) {
			console.error('Failed to load stats:', error);
		}
	}

	async function loadTestCases() {
		try {
			const benchmarks = await getBenchmarks();
			setTestCases(benchmarks);
		} catch (error) {
			console.error('Failed to load benchmarks:', error);
		}
	}

	function handleEvalFormChange(event) {
		const { name, value } = event.target;
		setEvalForm((current) => ({ ...current, [name]: value }));
	}

	async function handleRunEvaluation(event) {
		event.preventDefault();
		setErrorMessage('');
		setSuccessMessage('');
		setIsEvaluating(true);

		try {
			console.log('🔬 Running evaluation with:', evalForm);
			const results = await evaluateBenchmarks(evalForm);
			setEvaluationResults(results);
			setSuccessMessage(
				`✅ Evaluation complete! Pass rate: ${results.passRate}%`
			);
		} catch (error) {
			setErrorMessage(error.message || 'Evaluation failed. Please try again.');
		} finally {
			setIsEvaluating(false);
		}
	}

	return (
		<div>
			<h2 className="section-title">AI Benchmark Evaluation</h2>
			<p className="section-desc">
				Test your AI scoring engine against known test cases to measure accuracy and consistency.
			</p>

			{/* Evaluation Controls */}
			<div className="panel">
				<h3>Run Evaluation</h3>
				<form className="ai-match-grid" onSubmit={handleRunEvaluation}>
					<div>
						<label htmlFor="eval-method">Scoring Method</label>
						<select
							id="eval-method"
							className="form-input"
							name="scoringMethod"
							value={evalForm.scoringMethod}
							onChange={handleEvalFormChange}
						>
							<option value="gemini">Gemini (LLM only)</option>
							<option value="hybrid">Hybrid (LLM + Features)</option>
							<option value="heuristic">Heuristic (Fallback)</option>
						</select>
					</div>

					<div>
						<label htmlFor="eval-category">Category (optional)</label>
						<select
							id="eval-category"
							className="form-input"
							name="category"
							value={evalForm.category}
							onChange={handleEvalFormChange}
						>
							<option value="">All categories</option>
							<option value="perfect-match">Perfect Match</option>
							<option value="partial-match">Partial Match</option>
							<option value="poor-match">Poor Match</option>
							<option value="edge-case">Edge Case</option>
						</select>
					</div>

					<div>
						<label htmlFor="eval-difficulty">Difficulty (optional)</label>
						<select
							id="eval-difficulty"
							className="form-input"
							name="difficulty"
							value={evalForm.difficulty}
							onChange={handleEvalFormChange}
						>
							<option value="">All difficulties</option>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
						</select>
					</div>

					<div className="ai-span-full">
						<button
							type="submit"
							className="primary-button"
							disabled={isEvaluating}
						>
							{isEvaluating ? '⏳ Running Evaluation...' : '▶️ Run Evaluation'}
						</button>
					</div>
				</form>

				{errorMessage && (
					<p className="error">
						<strong>Error:</strong> {errorMessage}
					</p>
				)}
				{successMessage && (
					<p className="success-message">{successMessage}</p>
				)}
			</div>

			{/* Stats Overview */}
			{benchmarkStats && benchmarkStats.length > 0 ? (
				<div className="panel">
					<h3>Benchmark Overview</h3>
					<div className="ai-score-grid">
						{benchmarkStats.map((stat) => (
							<div key={stat._id} className="mini-card">
								<h4>{stat._id}</h4>
								<p>
									<strong>{stat.count}</strong> cases
								</p>
								<p className="table-footer-text">
									Avg Score: {Math.round(stat.avgScore)}
								</p>
							</div>
						))}
					</div>
				</div>
			) : null}

			{/* Evaluation Results */}
			{evaluationResults ? (
				<div className="panel">
					<h3>📊 Evaluation Results</h3>

					{/* Summary Metrics */}
					<div className="ai-score-grid">
						<div className="mini-card">
							<h4>Pass Rate</h4>
							<p>
								<strong>{evaluationResults.passRate}%</strong>
							</p>
							<p className="table-footer-text">
								{evaluationResults.passedTests} / {evaluationResults.totalTests}
							</p>
						</div>

						<div className="mini-card">
							<h4>Avg Score Diff</h4>
							<p>
								<strong>±{evaluationResults.averageScoreDiff}</strong> points
							</p>
							<p className="table-footer-text">
								Expected vs Predicted
							</p>
						</div>

						<div className="mini-card">
							<h4>Strength Match</h4>
							<p>
								<strong>{evaluationResults.averageStrengthMatch}</strong>
							</p>
							<p className="table-footer-text">
								Avg Matched Items
							</p>
						</div>

						<div className="mini-card">
							<h4>Gap Match</h4>
							<p>
								<strong>{evaluationResults.averageGapMatch}</strong>
							</p>
							<p className="table-footer-text">
								Avg Matched Items
							</p>
						</div>

						<div className="mini-card">
							<h4>Median Latency</h4>
							<p>
								<strong>{evaluationResults.medianLatency}</strong>ms
							</p>
							<p className="table-footer-text">
								Response Time
							</p>
						</div>
					</div>

					{/* Detailed Results */}
					{evaluationResults.testResults && evaluationResults.testResults.length > 0 ? (
						<div style={{ marginTop: '20px' }}>
							<h4>Individual Test Results</h4>
							<div
								style={{
									maxHeight: '400px',
									overflowY: 'auto',
									border: '1px solid #ddd',
									borderRadius: '4px',
								}}
							>
								<table className="data-table">
									<thead>
										<tr>
											<th>Job</th>
											<th>Candidate Role</th>
											<th>Expected</th>
											<th>Predicted</th>
											<th>Diff</th>
											<th>Status</th>
											<th>Latency</th>
										</tr>
									</thead>
									<tbody>
										{evaluationResults.testResults.map((result, idx) => (
											<tr key={idx}>
												<td>{result.jobTitle}</td>
												<td>{result.candidateRole}</td>
												<td style={{ textAlign: 'center' }}>
													{result.error ? '-' : result.scoreDifference !== undefined ? '?' : '-'}
												</td>
												<td style={{ textAlign: 'center' }}>
													{result.error ? '-' : result.predictedScore || '-'}
												</td>
												<td style={{ textAlign: 'center' }}>
													{result.error
														? '❌'
														: result.isCorrect
														  ? '✅'
														  : `${result.scoreDifference > 0 ? '+' : ''}${result.scoreDifference}`}
												</td>
												<td>
													{result.error ? (
														<span className="error">{result.error}</span>
													) : result.isCorrect ? (
														<span style={{ color: 'green' }}>Pass</span>
													) : (
														<span style={{ color: 'orange' }}>Off</span>
													)}
												</td>
												<td>{result.latencyMs || '-'}ms</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					) : null}

					<p
						className="table-footer-text"
						style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}
					>
						Tests run against {evalForm.category || 'all categories'} •{' '}
						{evalForm.difficulty || 'all difficulties'} • Scoring: {evalForm.scoringMethod}
					</p>
				</div>
			) : null}

			{/* Test Cases List */}
			{testCases && testCases.length > 0 ? (
				<div className="panel">
					<h3>Available Test Cases ({testCases.length})</h3>
					<div
						style={{
							maxHeight: '500px',
							overflowY: 'auto',
							border: '1px solid #ddd',
							borderRadius: '4px',
						}}
					>
						<table className="data-table">
							<thead>
								<tr>
									<th>Job Title</th>
									<th>Candidate Role</th>
									<th>Expected Score</th>
									<th>Category</th>
									<th>Difficulty</th>
									<th>Description</th>
								</tr>
							</thead>
							<tbody>
								{testCases.map((testCase) => (
									<tr key={testCase._id}>
										<td>{testCase.jobTitle}</td>
										<td>{testCase.candidateRole}</td>
										<td style={{ textAlign: 'center', fontWeight: 'bold' }}>
											{testCase.expectedOverallScore}
										</td>
										<td>
											<span
												style={{
													padding: '2px 6px',
													borderRadius: '3px',
													fontSize: '0.9em',
													backgroundColor:
														testCase.category === 'perfect-match'
															? '#d4edda'
															: testCase.category === 'partial-match'
															  ? '#fff3cd'
															  : testCase.category === 'poor-match'
															    ? '#f8d7da'
															    : '#e7d4f5',
													color:
														testCase.category === 'perfect-match'
															? '#155724'
															: testCase.category === 'partial-match'
															  ? '#856404'
															  : testCase.category === 'poor-match'
															    ? '#721c24'
															    : '#663399',
												}}
											>
												{testCase.category}
											</span>
										</td>
										<td>{testCase.difficulty}</td>
										<td>{testCase.description}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className="table-footer-text">
						{benchmarkStats
							? `${benchmarkStats.reduce((sum, s) => sum + s.count, 0)} total test cases`
							: ''}
					</p>
				</div>
			) : (
				<div className="panel">
					<p className="empty-state">
						No benchmark test cases found. Run:{' '}
						<code>npm run seed:benchmarks</code> in the API folder.
					</p>
				</div>
			)}
		</div>
	);
}

export default BenchmarksPage;
