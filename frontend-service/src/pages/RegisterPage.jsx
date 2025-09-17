//frontend-service/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/RegisterPage.css'; // use sibling CSS directory

const RegisterPage = () => {
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [busy, setBusy] = useState(false);
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
if (password !== confirmPassword) {
alert('Passwords do not match.');
return;
}
try {
setBusy(true);
await axios.post('/api/v1/auth/register', { username, email, password });
alert('Registration successful! Please log in.');
navigate('/login');
} catch (error) {
if (error.response) {
if (error.response.status === 409) {
alert('Registration failed: Username or email already exists.');
} else if (error.response.status === 422) {
alert('Registration failed: Please check your input fields and try again.');
console.error('Validation Error:', error.response.data);
} else {
alert(`Registration failed with status: ${error.response.status}`);
console.error('API Error:', error.response.data);
}
} else {
alert('Network Error: Could not connect to the server.');
console.error('Network Error:', error.message);
}
} finally {
setBusy(false);
}
};

return (
<div className="login-split-bg">
<div className="login-container fade-in">
<div className="login-card">
<div className="text-center">
<h2 className="login-title">Create your account</h2>
<p className="login-subtitle">Join PAX in seconds</p>
</div>


      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label className="login-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
            className="login-input"
          />
        </div>

        <div className="login-field">
          <label className="login-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@gmail.com"
            required
            className="login-input"
          />
        </div>

        <div className="login-field">
          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            className="login-input"
          />
        </div>

        <div className="login-field">
          <label className="login-label">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type your password"
            required
            className="login-input"
          />
        </div>

        <button type="submit" disabled={busy} className="btn-register-primary">
          {busy ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="register-text">
        Already have an account?
        <button type="button" onClick={() => navigate('/login')} className="btn-register-link">
          Log In
        </button>
      </p>
    </div>
  </div>
</div>

);
};

export default RegisterPage;