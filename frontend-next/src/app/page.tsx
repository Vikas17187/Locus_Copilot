"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(currentTheme);
    document.documentElement.classList.toggle('dark-theme', currentTheme === 'dark');
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');

    // Check local storage for auth token
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }

    // Scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Reveal Observer (to trigger animations)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Stats Observer
    const animateCounters = () => {
        document.querySelectorAll('.stat-num[data-target]').forEach(el => {
            const target = parseInt((el as HTMLElement).dataset.target || "0");
            const duration = 1200;
            const start = performance.now();
            function tick(now: number) {
                const t = Math.min((now - start) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(ease * target).toString();
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    };
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { animateCounters(); statsObserver.unobserve(entry.target); }
        });
    }, { threshold: 0.3 });
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) statsObserver.observe(statsBar);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('is_admin');
    setIsLoggedIn(false);
  };

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 450);
    document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="navbar-content">
          <Link href="/" className="brand">
            Locus <span>Copilot</span>
          </Link>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div className="nav-links" id="navLinks" style={{ display: isLoggedIn ? 'none' : 'flex' }}>
                <Link href="/login" className="nav-link nav-login">Sign in</Link>
                <Link href="/register" className="nav-link nav-signup">Get Started <span className="arrow">&rarr;</span></Link>
            </div>
            
            <div className={`nav-links user-menu ${isLoggedIn ? 'active' : ''}`} id="userMenu" style={{ display: isLoggedIn ? 'flex' : 'none' }}>
                <span className="nav-link" id="userEmail">{userEmail}</span>
                <button className="nav-link" onClick={handleSignOut} style={{color: 'var(--error-text)'}}>Sign out</button>
            </div>
            
            <label className="switch" title="Toggle theme">
                <input type="checkbox" id="themeToggle" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="slider"></span>
            </label>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">Location Intelligence Platform</div>
        <h2>Find the <em>perfect spot</em> for your business</h2>
        <p>Analyze rent, crowd density, competition, and accessibility across 4,345 Chennai localities with data-driven scoring and ML-powered insights.</p>
        <div className="cta-group">
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="cta-btn cta-primary">Start analyzing <span className="arrow">&rarr;</span></Link>
            <Link href="#features" className="cta-btn cta-secondary">Learn more</Link>
        </div>
      </section>

      <div className="stats-bar reveal">
        <div className="stat-item">
            <div className="stat-num" data-target="4345">0</div>
            <div className="stat-desc">Localities Mapped</div>
        </div>
        <div className="stat-item">
            <div className="stat-num" data-target="4">0</div>
            <div className="stat-desc">Scoring Criteria</div>
        </div>
        <div className="stat-item">
            <div className="stat-num" data-target="6">0</div>
            <div className="stat-desc">Business Types</div>
        </div>
      </div>

      <section className="features-section" id="features">
        <div className="features-label reveal">What you get</div>
        <div className="features-grid">
            <div className="feature-card reveal">
                <div className="feature-icon fi-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h3>Smart Scoring</h3>
                <p>Weighted multi-criteria analysis ranks locations by what matters most to you.</p>
            </div>
            <div className="feature-card reveal">
                <div className="feature-icon fi-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </div>
                <h3>Rent Intelligence</h3>
                <p>Real market rent data so you can find affordable areas without guessing.</p>
            </div>
            <div className="feature-card reveal">
                <div className="feature-icon fi-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <h3>Transit Access</h3>
                <p>Bus stops, metro stations, and transit coverage mapped for every area.</p>
            </div>
            <div className="feature-card reveal">
                <div className="feature-icon fi-pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </div>
                <h3>Competition Map</h3>
                <p>See market saturation levels and find underserved neighborhoods.</p>
            </div>
        </div>
      </section>

      <footer className="footer" style={{ borderTop: '1px solid var(--border-color)', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <p>© 2026 Locus Copilot. All rights reserved.</p>
      </footer>

      <div className="menu">
        <Link href="/" className="active">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"></path>
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"></path>
          </svg>
          <span>Home</span>
        </Link>
        <Link href="/dashboard">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z"></path>
          </svg>
          <span>Analysis</span>
        </Link>
        <Link href="/about">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd"></path>
          </svg>
          <span>About</span>
        </Link>
        <Link href="/contact">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z"></path>
            <path fillRule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clipRule="evenodd"></path>
          </svg>
          <span>Contact</span>
        </Link>
      </div>
    </>
  );
}
