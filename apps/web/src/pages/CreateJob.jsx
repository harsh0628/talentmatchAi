import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJobs } from '../context/JobsContext';

const initialForm = {
    title: '',
    location: '',
    experience: '',
    type: 'Full-time',
    description: '',
};

function CreateJob() {
    // Form fields and user feedback message.
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { addJob, updateJob, getJobById } = useJobs();
    // If route contains job id, page works in edit mode.
    const isEditing = Boolean(jobId);

    useEffect(() => {
        // When creating a new job, start from empty form.
        if (!jobId) {
            setForm(initialForm);
            return;
        }

        // When editing, preload existing job values.
        const existingJob = getJobById(jobId);

        if (existingJob) {
            setForm({
                title: existingJob.title,
                location: existingJob.location,
                experience: existingJob.experience,
                type: existingJob.type,
                description: existingJob.description,
            });
            setMessage('');
        }
    }, [jobId, getJobById]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setMessage('');
        setMessageType('');
    }

    async function handleSubmit(event) {
        event.preventDefault();

        // Basic required-field validation before save.
        if (!form.title || !form.location || !form.experience || !form.description) {
            setMessage('Please fill all required fields.');
            setMessageType('error');
            return;
        }

        // Save behavior depends on create vs edit mode.
        try {
            setIsSaving(true);
            if (isEditing) {
                await updateJob(jobId, form);
                setMessage('Job updated successfully.');
                setMessageType('success');
            } else {
                await addJob(form);
                setMessage('Job created successfully.');
                setMessageType('success');
            }
            setForm(initialForm);
            navigate('/jobs');
        } catch (error) {
            setMessage(error.message || 'Unable to save job right now.');
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    }

    const colors = {
        'Full-time': 'badge-green',
        'Part-time': 'badge-blue',
        'Contract': 'badge-orange',
        'Internship': 'badge-indigo',
    };

    // Map job type to visual badge color class.
    const createBadgeClass = (text) => colors[text] || 'badge-gray';

    return (
        <div>
            <h2 className="section-title">{isEditing ? 'Edit Job' : 'Create Job'}</h2>
            <p className="section-desc">Simple form to practice React state and inputs.</p>

            <div className="create-job-layout">
                <div className="panel form-panel">
                    <form className="job-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div>
                                <label htmlFor="title">Job Title *</label>
                                <input
                                    id="title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Frontend Developer"
                                />
                            </div>

                            <div>
                                <label htmlFor="location">Location *</label>
                                <input
                                    id="location"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Remote"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div>
                                <label htmlFor="experience">Experience *</label>
                                <input
                                    id="experience"
                                    name="experience"
                                    value={form.experience}
                                    onChange={handleChange}
                                    placeholder="2+ years"
                                />
                            </div>

                            <div>
                                <label htmlFor="type">Job Type</label>
                                <select id="type" name="type" value={form.type} onChange={handleChange}>
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                rows="5"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Write a short job description here"
                            />
                        </div>

                        {message ? (
                            <p className={messageType === 'error' ? 'error' : 'success-message'}>{message}</p>
                        ) : null}

                        <button type="submit" className="primary-button" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Job'}
                        </button>
                    </form>
                </div>

                <div className="panel preview-panel">
                    <h3>Live Preview</h3>
                    <div className="job-preview">
                        <h4>{form.title || 'Not provided'}</h4>
                        <p><strong>Location:</strong> {form.location || 'Not provided'}</p>
                        <p><strong>Experience:</strong> {form.experience || 'Not provided'}</p>
                        <p>
                            <strong>Type:</strong>{' '}
                            <span className={`type-badge ${createBadgeClass(form.type)}`}>
                                {form.type || 'Not provided'}
                            </span>
                        </p>
                        <p>{form.description || 'Not provided'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateJob;