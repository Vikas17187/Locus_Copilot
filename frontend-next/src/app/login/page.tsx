"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@locuscopilot.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Theme management
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');

    // Auto-redirect if already logged in
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Invalid email or password");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.user?.email || email);
      if (data.user?.is_admin) {
        localStorage.setItem("is_admin", "true");
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Link href="/" className="back-link">&larr; Home</Link>
      
      <label className="switch" title="Toggle theme" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        <span className="slider"></span>
      </label>

      <div className="login-container">
        <div className="login-brand">Locus <span>Copilot</span></div>
        <div className="login-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue to your dashboard</p>

          {errorMsg && <div className="error-msg">{errorMsg}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                required 
                placeholder="you@example.com" 
                autoComplete="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                required 
                placeholder="Enter your password" 
                autoComplete="current-password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading && <span className="loading-spinner"></span>}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="footer-text">
            Don&apos;t have an account? <Link href="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
