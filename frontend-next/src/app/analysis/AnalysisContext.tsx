"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our context
export interface Weights {
  rent: number;
  crowd: number;
  competition: number;
  accessibility: number;
}

export interface Locality {
  id: number | string;
  name: string;
  locality_name?: string;
  lat: number;
  lon: number;
  actual_lat?: number;
  actual_lon?: number;
  center_lat?: number;
  center_lon?: number;
}

export interface ResultItem {
  locality: string;
  distance_km: number;
  score: number;
  rank: number;
  rent_score: number;
  crowd_score: number;
  competition_score: number;
  accessibility_score: number;
  lat: number;
  lon: number;
  zone_cluster?: string;
  features?: any;
  constraint_details?: any;
}

export interface GoogleCompetitor {
  name: string;
  rating: number;
  reviews: number;
  lat: number;
  lon: number;
  distance_meters: number;
  types: string[];
}

export interface GoogleIntelligence {
  success: boolean;
  source: string;
  competitor_count: number;
  total_footfall_reviews: number;
  avg_competitor_rating: number;
  top_competitors: GoogleCompetitor[];
  queried_at?: string;
  message?: string;
}

interface AnalysisContextType {
  localities: Locality[];
  selectedLocality: string;
  setSelectedLocality: (val: string) => void;
  radius: number;
  setRadius: (val: number) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  weights: Weights;
  setWeights: (val: Weights) => void;
  results: ResultItem[];
  setResults: (val: ResultItem[]) => void;
  liveGoogleIntel: GoogleIntelligence | null;
  isAnalyzing: boolean;
  mapCenter: [number, number] | null;
  setMapCenter: (val: [number, number] | null) => void;
  mapZoom: number;
  setMapZoom: (val: number) => void;
  statusMessage: { text: string; type: 'info' | 'error' | 'success' } | null;
  setStatusMessage: (val: { text: string; type: 'info' | 'error' | 'success' } | null) => void;
  showStatus: (text: string, type: 'info' | 'error' | 'success') => void;
  analyzeLocation: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>('');
  const [radius, setRadius] = useState<number>(5);
  const [businessType, setBusinessType] = useState<string>('restaurant');
  const [weights, setWeights] = useState<Weights>({ rent: 25, crowd: 25, competition: 25, accessibility: 25 });
  const [results, setResults] = useState<ResultItem[]>([]);
  const [liveGoogleIntel, setLiveGoogleIntel] = useState<GoogleIntelligence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const API_BASE = "/api";

  const showStatus = (text: string, type: 'info' | 'error' | 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  useEffect(() => {
    const fetchLocalities = async () => {
      try {
        const response = await fetch(`${API_BASE}/localities`);
        if (response.ok) {
          const data = await response.json();
          setLocalities(data.localities || []);
        }
      } catch (e) {
        console.error("Error loading localities", e);
      }
    };
    fetchLocalities();
  }, []);

  useEffect(() => {
    if (selectedLocality && localities.length > 0) {
      const loc = localities.find(l => l.name === selectedLocality);
      if (loc) {
        const lat = loc.actual_lat || loc.lat || loc.center_lat || 13.0827;
        const lon = loc.actual_lon || loc.lon || loc.center_lon || 80.2707;
        setMapCenter([lat, lon]);
      }
    }
  }, [selectedLocality, localities]);

  const analyzeLocation = async () => {
    if (!selectedLocality) {
      showStatus("Please select a locality first.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setIsAnalyzing(true);
    setResults([]);
    setLiveGoogleIntel(null);

    try {
      const loc = localities.find(l => l.name === selectedLocality);
      const lat = loc?.actual_lat || loc?.lat || loc?.center_lat || 13.0827;
      const lon = loc?.actual_lon || loc?.lon || loc?.center_lon || 80.2707;

      const payload = {
        reference_lat: lat,
        reference_lon: lon,
        search_radius_km: radius,
        business_type: businessType || "restaurant",
        weights: {
          rent: weights.rent / 100,
          crowd: weights.crowd / 100,
          competition: weights.competition / 100,
          accessibility: weights.accessibility / 100
        }
      };

      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Backend error:", errText);
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawResults = data.results || data.ranked_locations || [];

      // Map raw API candidate items to cleanly display in ResultsPanel
      const mappedResults: ResultItem[] = rawResults.map((item: any, idx: number) => ({
        locality: item.locality_name || item.name || `Zone ${idx + 1}`,
        distance_km: item.distance_km || 0,
        score: item.score || (item.score_percent ? item.score_percent / 100 : 0),
        rank: idx + 1,
        rent_score: item.breakdown?.rent ?? (item.constraint_details?.affordability?.normalized_score ? item.constraint_details.affordability.normalized_score / 100 : 0.5),
        crowd_score: item.breakdown?.crowd ?? (item.constraint_details?.crowd_density?.normalized_score ? item.constraint_details.crowd_density.normalized_score / 100 : 0.5),
        competition_score: item.breakdown?.competition ?? (item.constraint_details?.competition?.normalized_score ? item.constraint_details.competition.normalized_score / 100 : 0.5),
        accessibility_score: item.breakdown?.accessibility ?? (item.constraint_details?.accessibility?.normalized_score ? item.constraint_details.accessibility.normalized_score / 100 : 0.5),
        lat: item.display_lat || item.lat,
        lon: item.display_lon || item.lon,
        features: item.features,
        constraint_details: item.constraint_details
      }));

      setResults(mappedResults);

      // Save live Google Places ground-truth intelligence
      if (data.live_google_intelligence) {
        setLiveGoogleIntel(data.live_google_intelligence);
      }

      const intelSource = data.live_google_intelligence?.source === "cache" ? " (Cached - 0 Quota)" : " (Live Google Verified)";
      showStatus(`Analysis complete! Found ${mappedResults.length} ranked locations${intelSource}.`, "success");
      setMapZoom(13);

    } catch (e: any) {
      console.error(e);
      showStatus(e.message || "An error occurred", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnalysisContext.Provider value={{
      localities, selectedLocality, setSelectedLocality,
      radius, setRadius, businessType, setBusinessType,
      weights, setWeights, results, setResults,
      liveGoogleIntel,
      isAnalyzing, mapCenter, setMapCenter, mapZoom, setMapZoom,
      statusMessage, setStatusMessage, showStatus, analyzeLocation
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
