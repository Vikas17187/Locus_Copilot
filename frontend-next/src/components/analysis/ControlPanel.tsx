"use client";

import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/app/analysis/AnalysisContext';

export default function ControlPanel() {
  const { 
    localities, selectedLocality, setSelectedLocality,
    radius, setRadius, businessType, setBusinessType,
    weights, setWeights, isAnalyzing, analyzeLocation
  } = useAnalysis();

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [smartWeightsActive, setSmartWeightsActive] = useState(false);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('#localitySearchable')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocalities = localities
    .filter(l => {
      const n = (l.locality_name || l.name || '').toLowerCase();
      return n.includes(searchQuery.toLowerCase());
    })
    .slice(0, 50);

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'balanced': setWeights({ rent: 25, crowd: 25, competition: 25, accessibility: 25 }); break;
      case 'budget': setWeights({ rent: 50, crowd: 15, competition: 15, accessibility: 20 }); break;
      case 'foot_traffic': setWeights({ rent: 10, crowd: 50, competition: 20, accessibility: 20 }); break;
      case 'low_competition': setWeights({ rent: 20, crowd: 20, competition: 50, accessibility: 10 }); break;
    }
  };

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <h1>Location Analysis</h1>
      </div>
      <div className="control-panel-body">
        
        <div className="section">
          <div className="section-label">Step 1: Select Location</div>
          <label>Locality / Area</label>
          <div className={`searchable-select ${dropdownOpen ? 'open' : ''}`} id="localitySearchable">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search locality..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
            />
            <span className="dd-arrow">▼</span>
            <div className="dd-list">
              {filteredLocalities.length === 0 ? (
                <div className="dd-empty">No matching localities</div>
              ) : (
                filteredLocalities.map((l, i) => (
                  <div 
                    key={i} 
                    className={`dd-item ${selectedLocality === l.name ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedLocality(l.name);
                      setSearchQuery(l.locality_name || l.name);
                      setDropdownOpen(false);
                    }}
                  >
                    {l.locality_name || l.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Step 1B: Business Type</div>
          <select 
            value={businessType} 
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="">-- Generic / Custom Weights --</option>
            <option value="medical">Pharmacy / Clinic</option>
            <option value="restaurant">Restaurant / Cafe</option>
            <option value="laptop">Electronics / Laptops</option>
            <option value="mobile">Mobile Store</option>
            <option value="automobile">Automobile Repairs</option>
            <option value="stationery">Stationery/Books</option>
          </select>
        </div>

        <div className="section">
          <div className="section-label">Step 2: Search Radius</div>
          <label>Radius (km)</label>
          <input 
            type="number" 
            value={radius} 
            min="1" max="15" step="1" 
            onChange={(e) => setRadius(parseFloat(e.target.value))} 
          />
        </div>

        <div className="section">
          <div className="section-label">Step 3: Profile</div>
          <div className="presets">
            <button className="preset-btn" onClick={() => applyPreset('balanced')}>Balanced</button>
            <button className="preset-btn" onClick={() => applyPreset('budget')}>Budget</button>
            <button className="preset-btn" onClick={() => applyPreset('foot_traffic')}>Traffic</button>
            <button className="preset-btn" onClick={() => applyPreset('low_competition')}>Low Comp</button>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Step 4: Weights</div>
          <div className="criteria-group">
            <div className="criterion">
              <div className="criterion-name">
                Affordability <span className="criterion-value">{weights.rent}%</span>
              </div>
              <input type="range" value={weights.rent} min="0" max="100" step="5" onChange={(e) => setWeights({ ...weights, rent: parseInt(e.target.value) })} />
            </div>
            <div className="criterion">
              <div className="criterion-name">
                Crowd Density <span className="criterion-value">{weights.crowd}%</span>
              </div>
              <input type="range" value={weights.crowd} min="0" max="100" step="5" onChange={(e) => setWeights({ ...weights, crowd: parseInt(e.target.value) })} />
            </div>
            <div className="criterion">
              <div className="criterion-name">
                Competition <span className="criterion-value">{weights.competition}%</span>
              </div>
              <input type="range" value={weights.competition} min="0" max="100" step="5" onChange={(e) => setWeights({ ...weights, competition: parseInt(e.target.value) })} />
            </div>
            <div className="criterion">
              <div className="criterion-name">
                Accessibility <span className="criterion-value">{weights.accessibility}%</span>
              </div>
              <input type="range" value={weights.accessibility} min="0" max="100" step="5" onChange={(e) => setWeights({ ...weights, accessibility: parseInt(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={analyzeLocation} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

      </div>
    </div>
  );
}
