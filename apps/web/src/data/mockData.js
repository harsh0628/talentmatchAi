// Initial job list used by context before user creates new jobs.
export const jobRows = [
  { id: 'JOB-101', title: 'Frontend Developer', location: 'Bengaluru', status: 'Open' },
  { id: 'JOB-102', title: 'Node.js Developer', location: 'Pune', status: 'Open' },
  { id: 'JOB-103', title: 'DevOps Engineer', location: 'Remote', status: 'Closed' },
];

// Candidate records for candidates page table and filtering demo.
export const candidateRows = [
  { id: 'C-101', name: 'Anita Sharma', role: 'Frontend Developer', score: 87, stage: 'Interview Scheduled' },
  { id: 'C-102', name: 'Rohit Gupta', role: 'Node.js Developer', score: 79, stage: 'Shortlisted' },
  { id: 'C-103', name: 'Priya Nair', role: 'DevOps Engineer', score: 91, stage: 'Selected' },
  { id: 'C-104', name: 'Nisha Verma', role: 'Frontend Developer', score: 72, stage: 'Applied' },
];

// Interview records for schedule page cards and status updates.
export const interviews = [
  { id: 'INT-101', date: '14 Apr', candidate: 'Anita Sharma', panel: 'FE Team', mode: 'Online', status: 'Scheduled' },
  { id: 'INT-102', date: '15 Apr', candidate: 'Rohit Gupta', panel: 'Backend Team', mode: 'Online', status: 'Scheduled' },
  { id: 'INT-103', date: '17 Apr', candidate: 'Priya Nair', panel: 'DevOps Team', mode: 'Onsite', status: 'Completed' },
  { id: 'INT-104', date: '18 Apr', candidate: 'Nisha Verma', panel: 'FE Team', mode: 'Online', status: 'Scheduled' },
];

// Evaluation report records used by AI report page selector.
export const evaluationReports = [
  {
    candidateId: 'C-101',
    name: 'Anita Sharma',
    role: 'Frontend Developer',
    technical: 8.5,
    communication: 7.8,
    problemSolving: 8.2,
    summary:
      'Candidate shows strong React knowledge and good coding clarity. Needs improvement in advanced system design explanations.',
    strengths: ['Component architecture', 'Clean code style', 'Debugging basics'],
    improvements: ['System design depth', 'Edge case handling'],
  },
  {
    candidateId: 'C-102',
    name: 'Rohit Gupta',
    role: 'Node.js Developer',
    technical: 7.9,
    communication: 8.1,
    problemSolving: 7.5,
    summary:
      'Candidate is clear in API design and async flow. Needs stronger database optimization explanations.',
    strengths: ['Express routing', 'Async error handling', 'Communication clarity'],
    improvements: ['Mongo indexing', 'Scalability examples'],
  },
  {
    candidateId: 'C-103',
    name: 'Priya Nair',
    role: 'DevOps Engineer',
    technical: 9.1,
    communication: 8.4,
    problemSolving: 8.8,
    summary:
      'Candidate demonstrates strong containerization and deployment understanding. Very good incident-response mindset.',
    strengths: ['Docker and CI/CD', 'Observability approach', 'Automation mindset'],
    improvements: ['Cost optimization storytelling'],
  },
];
