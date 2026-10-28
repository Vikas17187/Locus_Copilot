"use client";

import React, { useState } from 'react';
import { useAnalysis } from '@/app/analysis/AnalysisContext';

export default function Modals() {
  const { results, isAnalyzing } = useAnalysis();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (!showOnboarding) return null;

  return (
    <div className="onboarding-modal" style={{ display: showOnboarding ? 'flex' : 'none' }}>
      <div className="onboarding-content">
        <h3>Welcome to Locus Copilot (React Refactored)</h3>
        <p>Quick setup to get high-quality recommendations in under a minute.</p>
        <div className="onboarding-list">
          <div className="onboarding-item">1. Pick a locality and search radius for your target zone.</div>
          <div className="onboarding-item">2. Select business type to apply type-aware ranking behavior.</div>
          <div className="onboarding-item">3. Click Analyze and review the results dynamically loaded through React!</div>
        </div>
        <div className="onboarding-actions">
          <button className="btn-secondary" onClick={() => setShowOnboarding(false)}>Skip for now</button>
          <button className="btn-primary" onClick={() => setShowOnboarding(false)}>Start setup</button>
        </div>
      </div>
    </div>
  );
}
