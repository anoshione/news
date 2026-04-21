/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre bounds are [minLng, minLat, maxLng, maxLat]
const BANGLADESH_BOUNDS: [[number, number], [number, number]] = [
  [87.8, 20.3], // [minLng, minLat]
  [92.8, 26.8]  // [maxLng, maxLat]
];

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initMap = async () => {
      try {
        const response = await fetch('/data/bangladesh(1).json');
        if (!response.ok) throw new Error(`Could not find /public/data/bangladesh(1).json`);
        
        let districtsData;
        try {
          districtsData = await response.json();
        } catch (e) {
          throw new Error("The GeoJSON file is not valid JSON. Please check if the upload was complete.");
        }

        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [90.356, 23.685],
          zoom: 7,
          dragRotate: false,
          touchZoomRotate: true,
          maxBounds: BANGLADESH_BOUNDS
        });

        map.current = mapInstance;

        mapInstance.on('load', () => {
          // Add Source
          mapInstance.addSource('districts', {
            type: 'geojson',
            data: districtsData,
            generateId: true
          });

          // Integrated Interactive Fill Layer
          mapInstance.addLayer({
            id: 'district-fills',
            type: 'fill',
            source: 'districts',
            paint: {
              'fill-color': '#b8f5c8',
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'clicked'], false],
                0.38,
                ['boolean', ['feature-state', 'hover'], false],
                0.35,
                0.12
              ]
            }
          });

          // Unified District Lines (Clean and uniform)
          mapInstance.addLayer({
            id: 'district-lines',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': '#1a1f2e',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2,
                ['boolean', ['feature-state', 'clicked'], false],
                1.8,
                0.8
              ],
              'line-offset': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                -1,
                ['boolean', ['feature-state', 'clicked'], false],
                -1.5,
                0
              ]
            }
          });

          // 3D "Shadow" layer for pop-out effect
          mapInstance.addLayer({
            id: 'district-shadows',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': '#000000',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2,
                ['boolean', ['feature-state', 'clicked'], false],
                2.5,
                0
              ],
              'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.15,
                ['boolean', ['feature-state', 'clicked'], false],
                0.25,
                0
              ],
              'line-offset': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.5,
                ['boolean', ['feature-state', 'clicked'], false],
                2,
                0
              ],
              'line-blur': 2
            }
          }, 'district-lines');

          let hoveredId: string | number | null = null;
          let clickedId: string | number | null = null;

          mapInstance.on('mousemove', 'district-fills', (e) => {
            if (e.lngLat) {
              setCoords({
                lng: Number(e.lngLat.lng.toFixed(4)),
                lat: Number(e.lngLat.lat.toFixed(4))
              });
            }
            if (e.features && e.features.length > 0) {
              if (hoveredId !== null) {
                mapInstance.setFeatureState(
                  { source: 'districts', id: hoveredId },
                  { hover: false }
                );
              }
              hoveredId = e.features[0].id ?? null;
              if (hoveredId !== null) {
                mapInstance.setFeatureState(
                  { source: 'districts', id: hoveredId },
                  { hover: true }
                );
                const props = e.features[0].properties;
                setHoveredName(props?.NAME_4 || props?.NAME_2 || props?.NAME_1 || 'Unknown District');
              }
            }
          });

          mapInstance.on('mouseleave', 'district-fills', () => {
            if (hoveredId !== null) {
              mapInstance.setFeatureState(
                { source: 'districts', id: hoveredId },
                { hover: false }
              );
            }
            hoveredId = null;
            if (window.innerWidth >= 768) {
              setHoveredName(null);
              setCoords(null);
            }
          });

          mapInstance.on('click', 'district-fills', (e) => {
            if (e.lngLat) {
              setCoords({
                lng: Number(e.lngLat.lng.toFixed(4)),
                lat: Number(e.lngLat.lat.toFixed(4))
              });

              // Add/Move Marker
              if (!marker.current) {
                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-50%);">
                    <div style="
                      width: 28px; 
                      height: 28px; 
                      background-color: #ef4444; 
                      border-radius: 50% 50% 50% 0; 
                      transform: rotate(-45deg); 
                      border: 2px solid white;
                      box-shadow: -2px 2px 10px rgba(0,0,0,0.3), inset 2px -2px 5px rgba(255,255,255,0.2);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      z-index: 2;
                    ">
                      <div style="
                        width: 8px; 
                        height: 8px; 
                        background-color: white; 
                        border-radius: 50%;
                        box-shadow: inset 0 0 2px rgba(0,0,0,0.3);
                      "></div>
                    </div>
                    <div style="
                      width: 14px; 
                      height: 4px; 
                      background-color: rgba(0,0,0,0.2); 
                      border-radius: 50%; 
                      filter: blur(2px);
                      margin-top: -4px;
                      z-index: 1;
                    "></div>
                  </div>
                `;
                marker.current = new maplibregl.Marker({ element: el })
                  .setLngLat(e.lngLat)
                  .addTo(mapInstance);
              } else {
                marker.current.setLngLat(e.lngLat);
              }
            }
            if (e.features && e.features.length > 0) {
              const props = e.features[0].properties;
              setHoveredName(props?.NAME_4 || props?.NAME_2 || props?.NAME_1 || 'Unknown District');
              
              if (clickedId !== null) {
                mapInstance.setFeatureState(
                  { source: 'districts', id: clickedId },
                  { clicked: false }
                );
              }
              clickedId = e.features[0].id ?? null;
              if (clickedId !== null) {
                mapInstance.setFeatureState(
                  { source: 'districts', id: clickedId },
                  { clicked: true }
                );
              }
            }
          });

          setLoading(false);
        });
      } catch (err: any) {
        console.error('Failed to load map data:', err);
        setError(err.message || 'An unknown error occurred while loading the map.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen font-sans bg-gray-100 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="text-sm font-medium text-gray-500 animate-pulse">Loading map data...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-md text-center">
            <div className="text-red-600 font-bold mb-2">Map Error</div>
            <div className="text-red-500 text-sm">{error}</div>
            <div className="mt-4 text-xs text-gray-400">Try re-uploading the complete bangladesh.json file to /public/data/</div>
          </div>
        </div>
      )}
      
      <div id="map" ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Mobile Indicator - Help text for phone users */}
      <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 pointer-events-none">
        <span className="text-[10px] text-white/80 font-medium tracking-wide uppercase">
          Tap district to see data • Pinch to zoom
        </span>
      </div>
      
      {/* District Title Label (Top Left) */}
      {hoveredName && (
        <div 
          id="hover-label"
          className="absolute top-6 left-6 z-10 bg-white/95 px-5 py-3 rounded-xl shadow-2xl shadow-black/10 border border-gray-100 pointer-events-none transition-all duration-200 backdrop-blur-md"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-bold text-gray-900 tracking-tight leading-none">
              {hoveredName}
            </span>
            {coords && (
              <div className="flex gap-3 text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
                <span className="flex items-center gap-1">
                  <span className="text-gray-300 font-bold">LNG</span>
                  {coords.lng}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-300 font-bold">LAT</span>
                  {coords.lat}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
