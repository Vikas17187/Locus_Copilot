"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../login/login.css'; // Re-use the login CSS perfectly

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Registration failed. Email might be in use.");
      }

      // If registration succeeds, log them in automatically
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (!loginRes.ok) {
        router.push('/login');
        return;
      }
      
      const data = await loginRes.json();
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
          <h1>Create an account</h1>
          <p className="sub">Start analyzing locations in seconds</p>

          {errorMsg && <div className="error-msg show">{errorMsg}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                required 
                placeholder="John Doe" 
                autoComplete="name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
                placeholder="6 to 16 characters" 
                minLength={6}
                maxLength={16}
                autoComplete="new-password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                required 
                placeholder="Re-enter password" 
                minLength={6}
                maxLength={16}
                autoComplete="new-password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading && <span className="loading-spinner"></span>}
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="footer-text">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
