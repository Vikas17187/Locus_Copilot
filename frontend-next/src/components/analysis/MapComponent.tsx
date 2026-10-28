"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAnalysis } from '@/app/analysis/AnalysisContext';

const APPLE_DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#13161f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#13161f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#112022" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2433" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#181d28" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1b212d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#09101a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] }
];

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { mapCenter, radius, results, selectedLocality, localities, liveGoogleIntel } = useAnalysis();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai

  // 1. Dynamically Load Google Maps JS Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!apiKey) {
      setLoadError('Google Maps API Key is required. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setLoadError('Failed to load Google Maps script.');
    document.head.appendChild(script);
  }, [apiKey]);

  // 2. Initialize Google Map with Apple vector styles
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const google = (window as any).google;
    const initialCenter = mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : defaultCenter;
    const isDark = typeof document !== 'undefined' && (document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme'));

    const map = new google.maps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      styles: isDark ? APPLE_DARK_MAP_STYLE : [],
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      clickableIcons: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    mapInstanceRef.current = map;
  }, [isLoaded]);

  // 2b. Sync Map Theme dynamically when toggling between Midnight Obsidian and Porcelain Studio
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    const updateStyle = () => {
      const isDark = document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');
      mapInstanceRef.current.setOptions({
        styles: isDark ? APPLE_DARK_MAP_STYLE : []
      });
    };

    updateStyle();

    const observer = new MutationObserver(updateStyle);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, [isLoaded]);

  // 3. Update Center, Radius Circle, Competitor Pins, and Result Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google) return;
    const google = (window as any).google;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Clear previous circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    const currentLoc = localities.find(l => l.name === selectedLocality);
    const centerCoords = mapCenter
      ? { lat: mapCenter[0], lng: mapCenter[1] }
      : currentLoc
      ? { lat: currentLoc.actual_lat || currentLoc.lat, lng: currentLoc.actual_lon || currentLoc.lon }
      : defaultCenter;

    map.panTo(centerCoords);

    // Draw Search Radius Circle
    if (selectedLocality && radius > 0) {
      const circle = new google.maps.Circle({
        strokeColor: '#0284c7',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#0ea5e9',
        fillOpacity: 0.08,
        map: map,
        center: centerCoords,
        radius: radius * 1000,
      });
      circleRef.current = circle;

      // Center Reference Marker
      const centerMarkerIcon = {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#0284c7" stroke="#ffffff" stroke-width="3"/>
            <circle cx="16" cy="16" r="5" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14),
      };

      const centerMarker = new google.maps.Marker({
        position: centerCoords,
        map: map,
        title: currentLoc?.name || selectedLocality,
        icon: centerMarkerIcon,
        zIndex: 100,
      });

      centerMarker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="padding: 6px 8px; font-family: sans-serif; font-size: 13px;">
            <div style="font-weight: bold; color: #0284c7; margin-bottom: 2px;">📍 Search Reference</div>
            <div style="font-size: 14px; font-weight: 600;">${currentLoc?.locality_name || currentLoc?.name || selectedLocality}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Search radius: ${radius} km</div>
          </div>
        `);
        infoWindowRef.current.open(map, centerMarker);
      });

      markersRef.current.push(centerMarker);
    }

    // Add Live Google Competitor Markers
    if (liveGoogleIntel && liveGoogleIntel.top_competitors) {
      liveGoogleIntel.top_competitors.forEach((comp) => {
        if (!comp.lat || !comp.lon) return;

        const compIcon = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
              <text x="14" y="18" font-size="11" text-anchor="middle" fill="#ffffff">🏬</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        };

        const compMarker = new google.maps.Marker({
          position: { lat: comp.lat, lng: comp.lon },
          map: map,
          title: comp.name,
          icon: compIcon,
          zIndex: 50,
        });

        compMarker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 6px 8px; font-family: sans-serif; min-width: 180px;">
              <span style="background: rgba(239, 68, 68, 0.12); color: #dc2626; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                Verified Competitor
              </span>
              <div style="font-weight: 700; font-size: 13px; margin: 4px 0 2px 0; color: #0f172a;">${comp.name}</div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-top: 4px;">
                <span style="color: #eab308; font-weight: bold;">★ ${comp.rating} (${comp.reviews} reviews)</span>
                <span>${comp.distance_meters}m away</span>
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, compMarker);
        });

        markersRef.current.push(compMarker);
      });
    }

    // Add Ranked Candidate Zones
    if (results && results.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(centerCoords);

      results.forEach((r, i) => {
        const color = i === 0 ? '#0284c7' : i === 1 ? '#8b5cf6' : i === 2 ? '#10b981' : '#64748b';
        const rankIcon = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
              <circle cx="17" cy="17" r="14" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
              <text x="17" y="21.5" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#ffffff">${i + 1}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14),
        };

        const rankMarker = new google.maps.Marker({
          position: { lat: r.lat, lng: r.lon },
          map: map,
          title: `Rank #${i + 1}: ${r.locality}`,
          icon: rankIcon,
          zIndex: 80 - i,
        });

        bounds.extend({ lat: r.lat, lng: r.lon });

        rankMarker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px 10px; font-family: sans-serif; min-width: 200px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                <span style="font-weight: 700; font-size: 13px; color: ${color};">Rank #${i + 1}</span>
                <span style="font-weight: 800; font-size: 14px; color: #0284c7;">${(r.score * 100).toFixed(1)}%</span>
              </div>
              <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${r.locality}</div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Distance: ${r.distance_km.toFixed(2)} km away</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; background: #f8fafc; padding: 6px; border-radius: 6px;">
                <div>Affordability: <strong>${(r.rent_score * 100).toFixed(0)}%</strong></div>
                <div>Footfall: <strong>${(r.crowd_score * 100).toFixed(0)}%</strong></div>
                <div>Competition: <strong>${(r.competition_score * 100).toFixed(0)}%</strong></div>
                <div>Transit Access: <strong>${(r.accessibility_score * 100).toFixed(0)}%</strong></div>
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, rankMarker);
        });

        markersRef.current.push(rankMarker);
      });

      // Adjust viewport to fit all relevant pins comfortably
      if (results.length > 1) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    }
  }, [mapCenter, radius, results, selectedLocality, localities, liveGoogleIntel]);

  if (loadError) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#ef4444' }}>
        {loadError}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)',
          zIndex: 10,
          fontFamily: 'sans-serif',
          fontWeight: 600,
          color: '#0284c7'
        }}>
          Loading Official Google Maps...
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
