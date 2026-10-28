"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './contact.css';

export default function ContactPage() {
  const [theme, setTheme] = useState('light');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
  }, []);

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const submitForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert('Please fill in name, email, and message.');
      return;
    }

    const payload = {
      ...formData,
      submitted_at: new Date().toISOString()
    };

    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
    messages.push(payload);
    localStorage.setItem('contact_messages', JSON.stringify(messages));
    
    setShowStatus(true);
    setFormData(prev => ({ ...prev, message: '' }));
  };

  return (
    <div className="has-bottom-menu" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="header">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand">Locus <span>Copilot</span></div>
        </Link>
        <div className="header-right">
          <label className="switch" title="Toggle theme">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
      </nav>

      <main className="contact-page">
        <section className="hero">
          <h1>Contact <span style={{ color: 'var(--accent-primary)' }}>Locus Copilot</span></h1>
          <p>Use this page as your demo contact endpoint. Submissions are stored only in your browser for now, keeping the flow simple but presentable.</p>
        </section>

        <div className="grid">
          <section className="card">
            <h2>Send a Message</h2>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" placeholder="Your name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input id="subject" type="text" placeholder="Partnership, support, feedback..." value={formData.subject} onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" placeholder="Write your message" value={formData.message} onChange={handleInputChange}></textarea>
            </div>
            <button className="btn" onClick={submitForm}>Submit</button>
            <p className={`status ${showStatus ? 'show' : ''}`} id="formStatus">Thanks, your message has been saved for this demo session.</p>
          </section>

          <aside className="card">
            <h2>Other Ways to Reach Out</h2>
            <div className="mini-list">
              <div className="mini-item">
                <h3>Email</h3>
                <p>vikasoo474@gmail.com</p>
              </div>
              <div className="mini-item">
                <h3>LinkedIn</h3>
                <p><a href="https://www.linkedin.com/in/vikas-chintada-4a262029b/" target="_blank" rel="noopener noreferrer">View profile</a></p>
              </div>
              <div className="mini-item">
                <h3>Product Feedback</h3>
                <p>Share what worked, where rankings felt weak, and what business type scenarios you want expanded.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="menu">
        <Link href="/">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"></path>
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"></path>
          </svg>
          <span>Home</span>
        </Link>
        <Link href="/analysis">
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
        <Link href="/contact" className="active">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z"></path>
            <path fillRule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clipRule="evenodd"></path>
          </svg>
          <span>Contact</span>
        </Link>
      </div>
    </div>
  );
}
