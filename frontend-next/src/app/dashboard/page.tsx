"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

interface UserProfile {
  email: string;
  full_name: string;
  created_at: string;
  last_login: string;
}

interface SearchRecord {
  locality_name: string;
  latitude: number | null;
  longitude: number | null;
  search_radius: number | null;
  business_type: string;
  result_count: number;
  created_at: string;
}

interface PreferenceRecord {
  preference_name: string;
  description: string;
  weights: {
    rent: number;
    crowd: number;
    competition: number;
    accessibility: number;
  };
}

interface FavoriteRecord {
  id: number;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState("light");
  
  const [activeTab, setActiveTab] = useState("searches");
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "", show: false });
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [preferences, setPreferences] = useState<PreferenceRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Auth and Theme init
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUserEmail(localStorage.getItem('email') || "");
    setIsAdmin(localStorage.getItem('is_admin') === "true");
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');

    // Fetch initial data
    fetchProfile(token);
    fetchSearches(token);
  }, [router]);

  // Tab change effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (activeTab === 'searches' && searches.length === 0) fetchSearches(token);
    if (activeTab === 'preferences' && preferences.length === 0) fetchPreferences(token);
    if (activeTab === 'favorites' && favorites.length === 0) fetchFavorites(token);
  }, [activeTab]);

  const showStatus = (text: string, type: string) => {
    setStatusMsg({ text, type, show: true });
    if (type !== 'error') {
      setTimeout(() => setStatusMsg(prev => ({ ...prev, show: false })), 3500);
    }
  };

  const getHeaders = (token: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  });

  const handleFetchError = (res: Response) => {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('is_admin');
      window.location.href = '/login';
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch("/api/user/profile", { headers: getHeaders(token) });
      handleFetchError(res);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      showStatus("Could not load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSearches = async (token: string) => {
    setLoadingSearches(true);
    try {
      const res = await fetch("/api/user/searches", { headers: getHeaders(token) });
      handleFetchError(res);
      if (res.ok) {
        const data = await res.json();
        setSearches(data.searches || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingSearches(false);
    }
  };

  const fetchPreferences = async (token: string) => {
    setLoadingPreferences(true);
    try {
      const res = await fetch("/api/user/preferences", { headers: getHeaders(token) });
      handleFetchError(res);
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingPreferences(false);
    }
  };

  const fetchFavorites = async (token: string) => {
    setLoadingFavorites(true);
    try {
      const res = await fetch("/api/user/favorites", { headers: getHeaders(token) });
      handleFetchError(res);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('is_admin');
    router.push('/');
  };

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const useSearch = (s: SearchRecord) => {
    localStorage.setItem("resumeSearch", JSON.stringify({ 
      locality: s.locality_name, 
      lat: s.latitude, 
      lon: s.longitude, 
      radius: s.search_radius 
    }));
    router.push('/analysis');
  };

  const applyPref = (p: PreferenceRecord) => {
    localStorage.setItem("resumePreference", JSON.stringify(p.weights));
    showStatus("Preference saved. Apply it on the Analysis page.", "success");
  };

  const removeFav = async (id: number) => {
    if (!window.confirm("Remove this favorite?")) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch(`/api/user/favorites/${id}`, { 
        method: "DELETE", 
        headers: getHeaders(token) 
      });
      handleFetchError(res);
      if (res.ok) {
        showStatus("Removed", "success");
        fetchFavorites(token);
      } else {
        showStatus("Failed to remove", "error");
      }
    } catch (e) {
      showStatus("Error", "error");
    }
  };

  const formatCoord = (val: number | null) => {
    return val === null ? "-" : val.toFixed(4);
  };

  return (
    <div className="has-bottom-menu">
      <nav className="header">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand">Locus <span>Copilot</span></div>
        </Link>
        <div className="header-right">
          {isAdmin && (
            <Link href="/admin" className="nav-btn">Admin</Link>
          )}
          <label className="switch" title="Toggle theme">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
          <button className="nav-btn logout" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>Your Dashboard</h1>
          <p>Profile, saved searches, and preferences</p>
        </div>

        <div className={`status-msg ${statusMsg.type} ${statusMsg.show ? 'show' : ''}`}>
          {statusMsg.text}
        </div>

        {/* Profile */}
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-label">Email</div>
            <div className="profile-value">{profile?.email || "-"}</div>
          </div>
          <div className="profile-card">
            <div className="profile-label">Full Name</div>
            <div className="profile-value">{profile?.full_name || "-"}</div>
          </div>
          <div className="profile-card">
            <div className="profile-label">Member Since</div>
            <div className="profile-value">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
            </div>
          </div>
          <div className="profile-card">
            <div className="profile-label">Last Login</div>
            <div className="profile-value">
              {profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : "Never"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-card">
          <div className="tabs-nav">
            <button className={`tab-btn ${activeTab === 'searches' ? 'active' : ''}`} onClick={() => setActiveTab('searches')}>Searches</button>
            <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>Preferences</button>
            <button className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Favorites</button>
          </div>
          
          <div className={`tab-panel ${activeTab === 'searches' ? 'active' : ''}`}>
            <div className="item-list">
              {loadingSearches ? (
                <div className="empty">Loading...</div>
              ) : searches.length === 0 ? (
                <div className="empty"><div className="empty-icon">&#128269;</div>No saved searches yet</div>
              ) : (
                searches.map((s, idx) => (
                  <div className="item-card" key={idx}>
                    <div className="item-content">
                      <div className="item-title">{s.locality_name}</div>
                      <div className="item-meta">
                        {s.search_radius ?? '-'}km &middot; {s.business_type || 'All types'} &middot; {s.result_count ?? 0} results &middot; {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button 
                        disabled={s.latitude === null || s.longitude === null || s.search_radius === null}
                        onClick={() => useSearch(s)}
                      >
                        Re-run
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className={`tab-panel ${activeTab === 'preferences' ? 'active' : ''}`}>
            <div className="item-list">
              {loadingPreferences ? (
                <div className="empty">Loading...</div>
              ) : preferences.length === 0 ? (
                <div className="empty"><div className="empty-icon">&#9889;</div>No saved preferences</div>
              ) : (
                preferences.map((p, idx) => (
                  <div className="item-card" key={idx}>
                    <div className="item-content">
                      <div className="item-title">{p.preference_name}</div>
                      <div className="item-meta">
                        Afford {(p.weights.rent*100).toFixed(0)}% &middot; Crowd {(p.weights.crowd*100).toFixed(0)}% &middot; Comp {(p.weights.competition*100).toFixed(0)}% &middot; Access {(p.weights.accessibility*100).toFixed(0)}%
                      </div>
                      {p.description && <div className="item-meta" style={{ marginTop: '0.2rem' }}>{p.description}</div>}
                    </div>
                    <div className="item-actions">
                      <button onClick={() => applyPref(p)}>Apply</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className={`tab-panel ${activeTab === 'favorites' ? 'active' : ''}`}>
            <div className="item-list">
              {loadingFavorites ? (
                <div className="empty">Loading...</div>
              ) : favorites.length === 0 ? (
                <div className="empty"><div className="empty-icon">&#10084;</div>No favorites yet</div>
              ) : (
                favorites.map((f) => (
                  <div className="item-card" key={f.id}>
                    <div className="item-content">
                      <div className="item-title">{f.location_name}</div>
                      <div className="item-meta">
                        {formatCoord(f.latitude)}, {formatCoord(f.longitude)}{f.notes ? ` · ${f.notes}` : ''}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button 
                        disabled={f.latitude === null || f.longitude === null}
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`, '_blank')}
                      >
                        Map
                      </button>
                      <button className="remove" onClick={() => removeFav(f.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
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
    </div>
  );
}
