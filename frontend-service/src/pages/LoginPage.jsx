//frontend-service/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import '../assets/LoginPage.css'; // add this import

const LoginPage = () => {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const navigate = useNavigate();
const login = useAuthStore((state) => state.login);

const handleSubmit = async (e) => {
e.preventDefault();
try {
const response = await axios.post('/api/v1/auth/login', { username, password });
login(response.data.access_token);
navigate('/dashboard');
} catch (error) {
console.error('Login failed:', error);
alert('Login failed. Please check your credentials.');
}
};

return (
<div className="login-split-bg">
<div className="login-container fade-in">
<div className="login-card">
<div className="text-center">
<h2 className="login-title">Log in to PAX</h2>
<p className="login-subtitle">Welcome back!</p>
</div>


      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label className="login-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
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
            placeholder="Enter your password"
            required
            className="login-input"
          />
        </div>

        <button type="submit" className="btn-login">
          Log In
        </button>
      </form>

      <p className="register-text">
        Don’t have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="btn-register"
        >
          Register
        </button>
      </p>
    </div>
  </div>
</div>

);
};

export default LoginPage;