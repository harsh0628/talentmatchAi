import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkEmailApi } from '../services/authApi';

function isStrongPassword(password) {
  const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  return passwordRule.test(password);
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  // Form state holds user input values.
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Recruiter',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [emailCheckStatus, setEmailCheckStatus] = useState('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');

  useEffect(() => {
    if (!isRegisterMode) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }

    const emailValue = form.email.trim();
    if (!emailValue) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEmailCheckStatus('checking');
        const result = await checkEmailApi(emailValue);
        if (result.available) {
          setEmailCheckStatus('available');
          setEmailCheckMessage('Email is available.');
        } else {
          setEmailCheckStatus('taken');
          setEmailCheckMessage('Email is already registered.');
        }
      } catch (checkError) {
        setEmailCheckStatus('idle');
        setEmailCheckMessage('Unable to validate email right now.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.email, isRegisterMode]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Simple frontend validation for empty fields.
    if (!form.email || !form.password) {
      setError('Please fill email and password.');
      return;
    }

    if (isRegisterMode && !form.name) {
      setError('Please fill your full name.');
      return;
    }

    if (isRegisterMode && !isStrongPassword(form.password)) {
      setError(
        'Password must be at least 8 chars with uppercase, lowercase, number and special character.',
      );
      return;
    }

    if (isRegisterMode && emailCheckStatus === 'taken') {
      setError('Please use another email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (isRegisterMode) {
        await register({
          name: form.name,
          role: form.role,
          email: form.email,
          password: form.password,
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }

      navigate('/dashboard');
    } catch (apiError) {
      setError(apiError.message || 'Unable to authenticate right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMode() {
    setIsRegisterMode((current) => !current);
    setError('');
    setEmailCheckStatus('idle');
    setEmailCheckMessage('');
  }

  return (
    <div className="page auth-bg">
      <div className="auth-card">
        <h1>TalentMatch AI</h1>
        <p className="subtitle">
          {isRegisterMode ? 'Create account for recruiter workspace' : 'Login to recruiter workspace'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegisterMode ? (
            <>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
              />

              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                className="form-input"
                value={form.role}
                onChange={handleChange}
              >
                <option value="Recruiter">Recruiter</option>
                <option value="Interviewer">Interviewer</option>
                <option value="Admin">Admin</option>
              </select>
            </>
          ) : null}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            placeholder="recruiter@company.com"
            value={form.email}
            onChange={handleChange}
          />
          {isRegisterMode && emailCheckMessage ? (
            <p className={emailCheckStatus === 'taken' ? 'error' : 'form-message'}>{emailCheckMessage}</p>
          ) : null}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
          />
          {isRegisterMode ? (
            <p className="password-help">
              Use at least 8 characters with uppercase, lowercase, number, and symbol.
            </p>
          ) : null}

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Sign In'}
          </button>

          <button type="button" className="secondary-button" onClick={toggleMode} disabled={isSubmitting}>
            {isRegisterMode ? 'Already have an account? Sign In' : 'New user? Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
