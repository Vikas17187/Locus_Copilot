"use client";

import React, { useState } from 'react';
import { useAnalysis } from '@/app/analysis/AnalysisContext';

export default function ResultsPanel() {
  const { results, isAnalyzing, liveGoogleIntel } = useAnalysis();
  const [activeTab, setActiveTab] = useState<'rankings' | 'ai_picks'>('rankings');
  const [showCompetitorList, setShowCompetitorList] = useState(false);

  return (
    <>
      <div className="results-tabs">
        <div 
          className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <span className="tab-icon">📋</span>
          LOCATION RANKINGS
        </div>
        <div 
          className={`tab ${activeTab === 'ai_picks' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_picks')}
        >
          <span className="tab-icon">✨</span>
          AI PERSONALIZED PICKS
          <span className="badge">AI</span>
        </div>
      </div>

      {/* Google Places Ground-Truth Intelligence Card */}
      {liveGoogleIntel && liveGoogleIntel.success && (
        <div style={{
          margin: "12px 16px",
          padding: "14px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)",
          border: "1px solid rgba(14, 165, 233, 0.25)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "16px" }}>📍</span>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.5px", color: "var(--accent-primary, #0284c7)", textTransform: "uppercase" }}>
                Google Places Ground Truth
              </span>
            </div>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "12px",
              background: liveGoogleIntel.source === "cache" ? "rgba(16, 185, 129, 0.15)" : "rgba(14, 165, 233, 0.15)",
              color: liveGoogleIntel.source === "cache" ? "#059669" : "#0284c7"
            }}>
              {liveGoogleIntel.source === "cache" ? "⚡ Cached (0 Quota)" : "🟢 Live Verified"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.7)", padding: "6px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>Competitors</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                {liveGoogleIntel.competitor_count}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.7)", padding: "6px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>Avg Rating</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#eab308" }}>
                ★ {liveGoogleIntel.avg_competitor_rating}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.7)", padding: "6px", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)" }}>Footfall Volume</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#10b981" }}>
                {liveGoogleIntel.total_footfall_reviews > 1000 
                  ? `${(liveGoogleIntel.total_footfall_reviews / 1000).toFixed(1)}k` 
                  : liveGoogleIntel.total_footfall_reviews}
              </div>
            </div>
          </div>

          {liveGoogleIntel.top_competitors && liveGoogleIntel.top_competitors.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => setShowCompetitorList(!showCompetitorList)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--accent-primary, #0284c7)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 2px"
                }}
              >
                <span>{showCompetitorList ? "Hide Real Competitors" : `View Top ${liveGoogleIntel.top_competitors.length} Nearby Competitors`}</span>
                <span>{showCompetitorList ? "▲" : "▼"}</span>
              </button>

              {showCompetitorList && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {liveGoogleIntel.top_competitors.map((comp, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.85)",
                      fontSize: "0.75rem",
                      border: "1px solid rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
                        <strong style={{ color: "var(--text-primary, #0f172a)" }}>{comp.name}</strong>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #64748b)" }}>
                          {comp.distance_meters}m away
                        </div>
                      </div>
                      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#eab308", fontWeight: 700 }}>★ {comp.rating}</span>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-secondary, #64748b)" }}>
                          ({comp.reviews} reviews)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="results-toolbar">
        <div className="results-count" id="resultCount">
          {results.length} Ranked Locations
        </div>
        <div className="results-sort">
          <select id="sortBy" defaultValue="score">
            <option value="score">Sort by Score</option>
            <option value="rent">Sort by Rent</option>
            <option value="footfall">Sort by Footfall</option>
            <option value="distance">Sort by Distance</option>
          </select>
        </div>
      </div>

      <div className="results-list" id="resultsList">
        {isAnalyzing ? (
          <div className="results-list empty" style={{marginTop: "20px"}}>
            <div className="loading-spinner"></div> Analyzing live location intelligence...
          </div>
        ) : results.length === 0 ? (
          <div className="results-list empty">No results found for this area.</div>
        ) : (
          results.map((r, i) => (
            <div key={i} className="result-item" data-index={i}>
              <div className="result-header">
                <div>
                  <div className="result-title">
                    <span className="rank-badge" style={{background: i === 0 ? 'var(--accent-primary)' : i === 1 ? '#8b5cf6' : i === 2 ? '#10b981' : '#64748b'}}>#{i + 1}</span> 
                    Near {r.locality}
                  </div>
                  <div className="result-subtitle">{r.distance_km.toFixed(2)} km away</div>
                </div>
                <div className="result-score">{(r.score * 100).toFixed(1)}%</div>
              </div>
              
              <div className="score-bars">
                <div className="score-bar-row">
                  <span className="score-label">Afford</span>
                  <div className="score-track"><div className="score-fill" style={{width: `${Math.min(100, Math.max(0, r.rent_score * 100))}%`}}></div></div>
                  <span className="score-value">{(r.rent_score * 100).toFixed(0)}%</span>
                </div>
                <div className="score-bar-row">
                  <span className="score-label">Crowd</span>
                  <div className="score-track"><div className="score-fill" style={{width: `${Math.min(100, Math.max(0, r.crowd_score * 100))}%`}}></div></div>
                  <span className="score-value">{(r.crowd_score * 100).toFixed(0)}%</span>
                </div>
                <div className="score-bar-row">
                  <span className="score-label">Comp</span>
                  <div className="score-track"><div className="score-fill" style={{width: `${Math.min(100, Math.max(0, r.competition_score * 100))}%`}}></div></div>
                  <span className="score-value">{(r.competition_score * 100).toFixed(0)}%</span>
                </div>
                <div className="score-bar-row">
                  <span className="score-label">Access</span>
                  <div className="score-track"><div className="score-fill" style={{width: `${Math.min(100, Math.max(0, r.accessibility_score * 100))}%`}}></div></div>
                  <span className="score-value">{(r.accessibility_score * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="result-actions">
                <button className="btn-secondary btn-sm" style={{flex: 1}}>Favorite</button>
                <button className="btn-tertiary btn-sm" style={{flex: 1}}>View Map</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
