"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './about.css';

export default function AboutPage() {
  const [theme, setTheme] = useState('light');

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

      <div className="about-page">
        <div className="about-header">
          <h1>About <em>Locus Copilot</em></h1>
          <p>Next-generation geospatial intelligence platform empowering entrepreneurs, retail brands, and multi-location operators to discover, evaluate, and rank commercial locations across Chennai with mathematical confidence.</p>
        </div>

        <div className="about-section">
          <h2>The Challenge</h2>
          <p>Choosing where to establish or expand a business has historically relied on gut feeling, broker hearsay, or static surveys that lag market reality. Setting up in an oversaturated corridor or an inaccessible transit dead-zone costs businesses millions in sunk capital. Locus Copilot transforms commercial site selection into an algorithmic science—combining granular micro-locality analytics with live Google Places ground truth intelligence.</p>
        </div>

        <div className="about-section">
          <h2>System Architecture & Pillars</h2>
          <div className="pillars-grid">
            <div className="pillar-card">
              <span className="pillar-icon">📍</span>
              <h3>4,345 Micro-Localities</h3>
              <p>Comprehensive spatial resolution across Greater Chennai Corporation, Tambaram, Avadi, and emerging growth corridors (OMR, GST Road, Sriperumbudur, ECR).</p>
            </div>
            <div className="pillar-card">
              <span className="pillar-icon">🌐</span>
              <h3>Google Places Ground Truth</h3>
              <p>Direct integration with Google Places API (New) to verify real-time competitor density, customer sentiment, and footfall volume proxies without manual surveys.</p>
            </div>
            <div className="pillar-card">
              <span className="pillar-icon">⚖️</span>
              <h3>Multi-Criteria Decision Scoring</h3>
              <p>Mathematical normalization balancing commercial rent pressure, crowd density, public transit accessibility, and competitor saturation into an objective 0–100 index.</p>
            </div>
            <div className="pillar-card">
              <span className="pillar-icon">☁️</span>
              <h3>Cloud-Synchronized Persistence</h3>
              <p>Sub-5ms spatial querying, Google Cloud Firestore serverless synchronization, and high-performance Google Maps Platform visualization.</p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>How It Works (The 4-Step Pipeline)</h2>
          <div className="pipeline-list">
            <div className="pipeline-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Spatial Geofencing & Proximity Calculation</h3>
                <p>Applies the Haversine formula to compute geodesic distances across all 4,345 micro-localities, instantly isolating viable candidates within a user-defined 1km to 20km radius.</p>
              </div>
            </div>
            <div className="pipeline-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Multi-Factor Weighted Scoring</h3>
                <p>Applies customizable criteria weights (Rent, Footfall, Transit Proximity, Saturation) or machine learning-optimized presets tailored to your business sector.</p>
              </div>
            </div>
            <div className="pipeline-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Unsupervised K-Means Zoning</h3>
                <p>Automatically clusters localities into 5 distinct economic profiles: High Commercial Density, Emerging Suburban, Balanced Urban, Budget Residential, and Premium Enclaves.</p>
              </div>
            </div>
            <div className="pipeline-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Live Ground Truth Verification</h3>
                <p>For top candidates, real-time establishment pins, verified review ratings, and footfall proxies are fetched directly from Google Maps Platform to confirm site viability before capital is committed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section" id="use-cases">
          <h2>Where It Works Best (Use Cases)</h2>
          <p>These business scenarios map directly to our scoring engine and business-type optimization settings:</p>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <span className="use-case-tag">Medical</span>
              <h3>Neighborhood Clinic Launch</h3>
              <p>Prioritize areas where healthcare demand exists and supporting amenities are strong, while avoiding weak transit pockets.</p>
              <div className="use-case-best">Best for: Clinics, diagnostic centers, pharmacies.</div>
            </div>
            <div className="use-case-card">
              <span className="use-case-tag">Restaurant</span>
              <h3>Fast Casual Outlet</h3>
              <p>Find high-footfall corridors with manageable rent pressure and dense nearby demand signals from POI activity.</p>
              <div className="use-case-best">Best for: Cafes, cloud-kitchen hubs, dine-in concepts.</div>
            </div>
            <div className="use-case-card">
              <span className="use-case-tag">Laptop</span>
              <h3>Electronics Service Desk</h3>
              <p>Target productivity and education clusters where users repeatedly need repair, accessory, and upgrade support.</p>
              <div className="use-case-best">Best for: Repair stores, accessory retail, tech kiosks.</div>
            </div>
            <div className="use-case-card">
              <span className="use-case-tag">Mobile</span>
              <h3>Mobile Service Point</h3>
              <p>Focus on dense, well-connected routes where customer churn is high and same-day service speed matters.</p>
              <div className="use-case-best">Best for: Phone repair, SIM support, accessories.</div>
            </div>
            <div className="use-case-card">
              <span className="use-case-tag">Automobile</span>
              <h3>Workshop Expansion</h3>
              <p>Choose zones with road connectivity and practical access while balancing operational cost and demand coverage.</p>
              <div className="use-case-best">Best for: Mechanic shops, quick-service garages.</div>
            </div>
            <div className="use-case-card">
              <span className="use-case-tag">Stationery</span>
              <h3>Education Cluster Store</h3>
              <p>Identify localities near schools and coaching ecosystems where daily utility purchases drive repeat business.</p>
              <div className="use-case-best">Best for: Books, exam prep, print and supply shops.</div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Tech Stack</h2>
          <div className="tech-grid">
            <span className="tech-chip">Google Maps Platform</span>
            <span className="tech-chip">Google Places API (New)</span>
            <span className="tech-chip">Google Cloud Firestore</span>
            <span className="tech-chip">Python 3.12</span>
            <span className="tech-chip">FastAPI</span>
            <span className="tech-chip">scikit-learn (K-Means)</span>
            <span className="tech-chip">NumPy Spatial Math</span>
            <span className="tech-chip">SQLite / PostgreSQL</span>
            <span className="tech-chip">Next.js & React 19</span>
            <span className="tech-chip">TypeScript</span>
            <span className="tech-chip">JWT Security</span>
            <span className="tech-chip">Glassmorphic CSS</span>
          </div>
        </div>

        <div className="about-section">
          <h2>Built By</h2>
          <div className="owner-card">
            <div className="owner-avatar">VC</div>
            <div className="owner-name">Vikas Chintada</div>
            <div className="owner-role">Developer & Creator</div>
            <div className="owner-links">
              <a className="owner-link link-linkedin" href="https://www.linkedin.com/in/vikas-chintada-4a262029b/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>
                LinkedIn
              </a>
              <a className="owner-link link-github" href="https://github.com/Vikas17187/Locus_Copilot" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </a>
              <a className="owner-link link-email" href="mailto:vikasoo474@gmail.com">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                vikasoo474@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

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
        <Link href="/about" className="active">
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
    </div>
  );
}
