/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { Sun, Moon, Search, Menu, ArrowLeft, Filter, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// MapLibre styles
const STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

// MapLibre bounds are [minLng, minLat, maxLng, maxLat]
const BANGLADESH_BOUNDS: [[number, number], [number, number]] = [
  [87.8, 20.3], // [minLng, minLat]
  [92.8, 26.8]  // [maxLng, maxLat]
];

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Politics' | 'Economy' | 'Culture' | 'Sports' | 'Environment' | 'Health' | 'Technology' | 'Education' | 'Entertainment' | 'Travel';
  date: string;
  imageUrl: string;
  subLocation?: string;
}

const NEWS_TEMPLATES: NewsItem[] = [
  { 
    id: 't1', 
    title: 'Eco-Green Corridor Project', 
    summary: 'A new initiative to create sustainable green spaces across urban areas.', 
    content: 'The government has announced a major shift towards urban sustainability with the Eco-Green Corridor Project. This plan involves planting thousands of native trees and creating pedestrian-friendly green zones. The initiative aims to reduce urban heat island effects and improve the overall air quality for millions of citizens. Experts suggest this could serve as a global model for sustainable city planning.',
    category: 'Environment', 
    date: '3 hours ago', 
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e' 
  },
  { 
    id: 't2', 
    title: 'Small Business Empowerment Grant', 
    summary: 'New financial aid packages unveiled for local startups and traditional artisans.', 
    content: 'In an effort to bolster the local economy, a new grant program has been launched specifically targeting small-scale entrepreneurs and traditional artisans. The program provides low-interest loans and technical training to help modernize production while preserving traditional techniques. Over 5,000 businesses are expected to benefit in the first phase of implementation.',
    category: 'Economy', 
    date: '6 hours ago', 
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0' 
  },
  { 
    id: 't3', 
    title: 'Digital Literacy Drive in Rural Areas', 
    summary: 'Mobile learning centers to reach the remotest parts of the country.', 
    content: 'A nationwide campaign to bridge the digital divide has kicked off today. Mobile learning hubs equipped with high-speed satellite internet and tablets are being deployed to rural schools. The curriculum focuses on essential digital skills, online safety, and coding. This initiative is part of the larger vision to ensure every citizen has the tools to succeed in a digital economy.',
    category: 'Education', 
    date: '1 day ago', 
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7' 
  },
  { 
    id: 't4', 
    title: 'New Health Infrastructure Landmark', 
    summary: 'Modern specialized hospital facility inaugurated to provide world-class care.', 
    content: 'A state-of-the-art multi-specialty hospital was inaugurated today, promising to provide advanced medical treatments at subsidized rates. The facility features cutting-edge diagnostic tools and a dedicated research wing. This development is expected to significantly reduce the need for citizens to travel abroad for complex medical procedures.',
    category: 'Health', 
    date: '2 days ago', 
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2' 
  },
  { 
    id: 't5', 
    title: 'Heritage Revitalization Festival', 
    summary: 'Thousands gather to celebrate centuries-old traditions and folk arts.', 
    content: 'The historic district came alive today with the sounds and colors of the Heritage Revitalization Festival. The event showcases centuries-old folk music, traditional dance forms, and indigenous crafts. Organizers hope to inspire the younger generation to take pride in their cultural roots and preserve these vanishing art forms for the future.',
    category: 'Culture', 
    date: '3 days ago', 
    imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c' 
  }
];

const MOCK_NEWS: Record<string, NewsItem[]> = {};

const DEFAULT_NEWS: NewsItem[] = [
  { 
    id: 'gen1', 
    title: 'National Education Policy Reform', 
    summary: 'Schools to adopt new curriculum focusing on digital skills and analytical thinking.', 
    content: 'The Ministry of Education has unveiled a sweeping reform plan for the national curriculum, aimed at better preparing students for the 21st-century job market. The new policy shifts the focus from rote learning to competency-based education, emphasizing critical thinking, problem-solving, and digital literacy. Starting next academic year, schools across the country will introduce standardized assessments that evaluate practical skills alongside academic knowledge. Teachers are currently undergoing extensive training to implement these changes effectively.',
    category: 'Politics', 
    date: '4 hours ago', 
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6' 
  },
  { 
    id: 'gen2', 
    title: 'Digital Bangladesh 2041 Vision', 
    summary: 'Govt unveils roadmap for a fully automated public service infrastructure.', 
    content: 'Under the "Digital Bangladesh 2041" vision, the government is set to automate all major public service delivery systems. This initiative aims to reduce corruption, increase transparency, and ensure that services reach citizens in the remotest parts of the country. A new centralized data hub will be created to integrate all government databases, allowing for seamless verification and service processing. The roadmap also includes plans for universal high-speed internet access and the establishment of "Smart Villages" equipped with modern digital infrastructure.',
    category: 'Economy', 
    date: '2 days ago', 
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475' 
  }
];

const CATEGORIES = ['Politics', 'Economy', 'Culture', 'Sports', 'Environment', 'Health', 'Technology', 'Education', 'Entertainment', 'Travel'] as const;

const FILL_COLORS = [
  { name: 'Emerald', active: '#10b981', base: '#064e3b' },
  { name: 'Ocean', active: '#0ea5e9', base: '#0c4a6e' },
  { name: 'Rose', active: '#f43f5e', base: '#881337' },
  { name: 'Violet', active: '#8b5cf6', base: '#4c1d95' },
  { name: 'Amber', active: '#f59e0b', base: '#78350f' },
  { name: 'Monochrome', active: '#64748b', base: '#1e293b' },
];

const FAMOUS_FOR: Record<string, { place: string; image: string }> = {
  'Dhaka': { 
    place: 'Lalbagh Fort', 
    image: 'https://images.unsplash.com/photo-1590133325985-7973c683b794'
  },
  'Chittagong': { 
    place: 'Patenga Beach', 
    image: 'https://images.unsplash.com/photo-1588661136423-f36bc9327896'
  },
  'Sylhet': { 
    place: 'Ratargul Swamp Forest', 
    image: 'https://images.unsplash.com/photo-1594243603415-46ffcf1b29ed'
  },
  'Rajshahi': { 
    place: 'Varendra Research Museum', 
    image: 'https://images.unsplash.com/photo-1595155982823-37666249d682'
  },
  'Khulna': { 
    place: 'The Sundarbans', 
    image: 'https://images.unsplash.com/photo-1589417833076-2e860824b7a1'
  },
};

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const districtsDataRef = useRef<any>(null);
  const clickedIdRef = useRef<string | number | null>(null);
  
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [osmAddress, setOsmAddress] = useState<any>(null);
  const [osmLoading, setOsmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedSubLocation, setSelectedSubLocation] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  const [is3D, setIs3D] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!map.current) return;
    if (is3D) {
      map.current.easeTo({ pitch: 45, bearing: -10, duration: 1000 });
      map.current.dragRotate.enable();
      map.current.touchPitch.enable();
    } else {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      map.current.dragRotate.disable();
      map.current.touchPitch.disable();
    }
  }, [is3D]);

  const [activeFillColor, _setActiveFillColor] = useState(FILL_COLORS[0]);
  const activeFillColorRef = useRef(activeFillColor);

  // --- History Navigation Support ---
  const lastHistoryRef = useRef({ news: false, district: false, settings: false });

  useEffect(() => {
    const handlePopState = () => {
      // Use local refs/state to decide what to close
      if (selectedNews) {
        setSelectedNews(null);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (selectedDistrict) {
        handleCloseDistrict();
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) window.history.replaceState({ root: true }, '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedNews, isSettingsOpen, selectedDistrict]);

  useEffect(() => {
    const currentState = {
      news: selectedNews !== null,
      district: selectedDistrict !== null,
      settings: isSettingsOpen
    };

    // Calculate if we've moved "deeper" into the UI
    const isOpening = 
      (currentState.news && !lastHistoryRef.current.news) ||
      (currentState.district && !lastHistoryRef.current.district) ||
      (currentState.settings && !lastHistoryRef.current.settings);

    if (isOpening) {
      window.history.pushState({ overlay: true }, '');
    }

    lastHistoryRef.current = currentState;
  }, [selectedNews !== null, selectedDistrict !== null, isSettingsOpen]);
  
  const setActiveFillColor = (color: typeof FILL_COLORS[0]) => {
    activeFillColorRef.current = color;
    _setActiveFillColor(color);
  };

  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Initial Map State for Reset
  const INITIAL_STATE = {
    center: [90.356, 23.685],
    zoom: 7,
    pitch: 45,
    bearing: -10
  };

  useEffect(() => {
    if (!map.current) return;
    const isOptimized = !!(selectedDistrict || isSettingsOpen || selectedNews || isAnimating);
    
    if (isOptimized) {
      map.current.scrollZoom.disable();
      map.current.boxZoom.disable();
      map.current.dragRotate.disable();
      map.current.dragPan.disable();
      map.current.keyboard.disable();
      map.current.doubleClickZoom.disable();
      map.current.touchZoomRotate.disable();
    } else {
      map.current.scrollZoom.enable();
      map.current.boxZoom.enable();
      map.current.dragRotate.enable();
      map.current.dragPan.enable();
      map.current.keyboard.enable();
      map.current.doubleClickZoom.enable();
      map.current.touchZoomRotate.enable();
    }

    // Performance Optimization: Hide heavy details during animation or when overlays are active
    const toggleHeavyLayers = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;
      try {
        const style = map.current.getStyle();
        if (!style || !style.layers) return;
        
        const heavyKeywords = ['label', 'poi', 'building', 'transit', 'place', 'water-label', 'road', 'symbol'];
        style.layers.forEach(layer => {
          if (!layer.id.includes('district')) {
            const isHeavy = heavyKeywords.some(k => layer.id.toLowerCase().includes(k));
            if (isHeavy) {
              map.current?.setLayoutProperty(layer.id, 'visibility', isOptimized ? 'none' : 'visible');
            }
          }
        });
      } catch (e) {
        console.warn('Map optimization failed', e);
      }
    };

    toggleHeavyLayers();
    // Also re-apply optimization if style reloads
    map.current.on('styledata', toggleHeavyLayers);
    return () => {
      map.current?.off('styledata', toggleHeavyLayers);
    };
  }, [selectedDistrict, isSettingsOpen, selectedNews, isAnimating]);

  const setupLayers = (mapInstance: maplibregl.Map) => {
    if (!districtsDataRef.current) return;
    
    const currColor = activeFillColorRef.current;
    const isLight = themeRef.current === 'light';

    // 1. Ensure Source
    if (!mapInstance.getSource('districts')) {
      mapInstance.addSource('districts', {
        type: 'geojson',
        data: districtsDataRef.current,
        generateId: true
      });
    }

    // 2. Base Borders
    if (!mapInstance.getLayer('district-base')) {
      mapInstance.addLayer({
        id: 'district-base',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': isLight ? '#cbd5e1' : '#334155',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 10, 2],
          'line-opacity': 0.3
        }
      });
    }

    // 3. Heatmap Layers (using multiple layers because fill-extrusion-opacity doesn't support data expressions)
    const densities = [
      { id: 'district-fills-0', counts: [0], opacity: 0.05 },
      { id: 'district-fills-1', counts: [1], opacity: 0.1 },
      { id: 'district-fills-2', counts: [2, 3, 4], opacity: 0.2 },
      { id: 'district-fills-3', counts: [5], opacity: 0.3 }
    ];

    densities.forEach(d => {
      const paintProps = {
        'fill-extrusion-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          currColor.active,
          currColor.base
        ],
        'fill-extrusion-height': ['case', ['boolean', ['feature-state', 'hover'], false], 40, 0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': d.opacity,
        'fill-extrusion-height-transition': { duration: 400, delay: 0 }
      };

      // Construction of filter: ['match', ['get', 'newsCount'], 2, true, 3, true, 4, true, false]
      const filterExpression: any[] = ['match', ['get', 'newsCount']];
      d.counts.forEach(count => {
        filterExpression.push(count, true);
      });
      filterExpression.push(false);

      if (mapInstance.getLayer(d.id)) {
        mapInstance.setPaintProperty(d.id, 'fill-extrusion-color', paintProps['fill-extrusion-color'] as any);
        mapInstance.setPaintProperty(d.id, 'fill-extrusion-height', paintProps['fill-extrusion-height'] as any);
        mapInstance.setPaintProperty(d.id, 'fill-extrusion-opacity', d.opacity);
        mapInstance.setFilter(d.id, filterExpression as any);
        return;
      }
      mapInstance.addLayer({
        id: d.id,
        type: 'fill-extrusion',
        source: 'districts',
        paint: paintProps as any,
        filter: filterExpression as any
      });
    });

    // 4. (Removed district-hover as it caused filter errors with feature-state)

    // 5. Active Lift Layer (Clicked State)
    if (!mapInstance.getLayer('district-active-lift')) {
      mapInstance.addLayer({
        id: 'district-active-lift',
        type: 'fill-extrusion',
        source: 'districts',
        paint: {
          'fill-extrusion-color': currColor.active,
          'fill-extrusion-height': 0,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.5,
          'fill-extrusion-height-transition': { duration: 1000, delay: 0 }
        },
        filter: ['==', ['id'], -1]
      });
    } else {
      mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-color', currColor.active);
    }

    // 6. Neon Glow
    if (!mapInstance.getLayer('district-neon-glow')) {
      mapInstance.addLayer({
        id: 'district-neon-glow',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': currColor.active,
          'line-width': ['case', ['boolean', ['feature-state', 'clicked'], false], 6, 0],
          'line-blur': 10,
          'line-opacity': 0.6
        }
      });
    } else {
      mapInstance.setPaintProperty('district-neon-glow', 'line-color', currColor.active);
    }
  };

  useEffect(() => {
    if (map.current) {
      if (map.current.getLayer('district-neon-glow')) {
        map.current.setPaintProperty('district-neon-glow', 'line-color', activeFillColor.active);
      }
      // Re-create marker to update its color
      if (marker.current && map.current) {
        const currentLngLat = marker.current.getLngLat();
        marker.current.remove();
        marker.current = new maplibregl.Marker({ color: activeFillColor.active })
          .setLngLat(currentLngLat)
          .addTo(map.current);
      }
      setupLayers(map.current);
    }
  }, [activeFillColor, theme]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initMap = async () => {
      try {
        const response = await fetch('/data/bangladesh(1).json');
        if (!response.ok) throw new Error(`Could not find /public/data/bangladesh(1).json`);
        
        try {
          const rawData = await response.json();
          districtsDataRef.current = {
            ...rawData,
            features: rawData.features.map((f: any, idx: number) => {
              const featureId = idx;
              const name = f.properties?.NAME_4 || f.properties?.NAME_2 || f.properties?.NAME_1 || 'Unknown';
              
              // Assign random news density (0-5)
              const newsCount = Math.floor(Math.random() * 6);
              const shuffledTemplates = [...NEWS_TEMPLATES].sort(() => 0.5 - Math.random());
              const districtNews = shuffledTemplates.slice(0, newsCount).map(n => ({
                ...n,
                id: `${n.id}-${featureId}`, // Make IDs unique per district
                subLocation: name // Initialize with cell name as the default sub-location
              }));
              
              // Store news in MOCK_NEWS by name for retrieval
              MOCK_NEWS[name] = districtNews;

              const featureWithProperties = { 
                ...f, 
                id: featureId, 
                properties: { 
                  ...f.properties, 
                  newsCount: newsCount 
                } 
              };

              try {
                const buffered = turf.buffer(featureWithProperties, -0.1, { units: 'kilometers' });
                return buffered ? { ...buffered, id: featureId } : featureWithProperties;
              } catch (e) {
                return featureWithProperties;
              }
            })
          };
        } catch (e) {
          throw new Error("Invalid GeoJSON file.");
        }

        const isPhone = window.innerWidth < 768;
        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: STYLES.light,
          center: [90.356, 23.685],
          zoom: 7,
          pitch: isPhone ? 0 : 45,
          bearing: isPhone ? 0 : -10,
          maxBounds: BANGLADESH_BOUNDS,
          maxZoom: 13,
          dragRotate: !isPhone,
          touchPitch: !isPhone
        });

        map.current = mapInstance;

        mapInstance.on('load', () => {
          setupLayers(mapInstance);
          let step = 0;
          const animatePulse = () => {
            if (map.current && map.current.getLayer('district-neon-glow')) {
              step += 0.05;
              const opacity = 0.5 + Math.abs(Math.sin(step)) * 0.4;
              map.current.setPaintProperty('district-neon-glow', 'line-opacity', opacity);
              requestAnimationFrame(animatePulse);
            }
          };
          animatePulse();
          setLoading(false);
        });

        mapInstance.on('styledata', () => setupLayers(mapInstance));

        let hoveredId: string | number | null = null;

        const HEATMAP_LAYERS = ['district-fills-0', 'district-fills-1', 'district-fills-2', 'district-fills-3'];

        mapInstance.on('mousemove', HEATMAP_LAYERS, (e) => {
          setMousePos({ x: e.point.x, y: e.point.y });
          if (e.lngLat) {
            setCoords({ lng: Number(e.lngLat.lng.toFixed(4)), lat: Number(e.lngLat.lat.toFixed(4)) });
          }
          if (e.features && e.features.length > 0) {
            if (hoveredId !== null) mapInstance.setFeatureState({ source: 'districts', id: hoveredId }, { hover: false });
            hoveredId = e.features[0].id ?? null;
            if (hoveredId !== null) {
              mapInstance.setFeatureState({ source: 'districts', id: hoveredId }, { hover: true });
              const props = e.features[0].properties;
              setHoveredName(props?.NAME_4 || props?.NAME_2 || props?.NAME_1 || 'Unknown');
            }
          }
        });

        mapInstance.on('mouseleave', HEATMAP_LAYERS, () => {
          if (hoveredId !== null) mapInstance.setFeatureState({ source: 'districts', id: hoveredId }, { hover: false });
          hoveredId = null;
          setHoveredName(null);
          setCoords(null);
        });

        mapInstance.on('click', async (e) => {
          if (isAnimatingRef.current || selectedDistrict || selectedNews || isSettingsOpen) return;
          
          const features = mapInstance.queryRenderedFeatures(e.point, { layers: HEATMAP_LAYERS });
          if (features && features.length > 0) {
            isAnimatingRef.current = true;
            setIsAnimating(true);
            setOsmLoading(true);

            const feature = features[0];
            const clickCoords = e.lngLat;
            const featureId = feature.id ?? null;

            // STEP 1: SMOOTH PAN AND FLY
            // Start a subtle pan to lead the eye
            mapInstance.easeTo({
              center: clickCoords,
              duration: 1000,
              easing: (t) => t * (2 - t)
            });

            // Execute the cinematic zoom and tilt animation
            setTimeout(() => {
              if (map.current) {
                map.current.flyTo({ 
                  center: clickCoords, 
                  zoom: 10, 
                  pitch: 65, 
                  bearing: -5,
                  duration: 2500, 
                  essential: true,
                  curve: 1.2, 
                  speed: 0.4
                });
              }
            }, 300);

            // Fetch OSM Reverse Geocoding in parallel
            let osmName = '';
            let osmAddr: any = null;
            let subLocation = '';
            try {
              const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickCoords.lat}&lon=${clickCoords.lng}&zoom=14`);
              if (osmRes.ok) {
                const data = await osmRes.json();
                osmAddr = data;
                const address = data.address || {};
                subLocation = address.suburb || address.neighbourhood || address.village || address.quarter || address.town || address.hamlet || address.city_district || address.road || '';
                const districtOrState = address.district || address.state_district || address.state || '';
                osmName = subLocation && districtOrState ? `${subLocation}, ${districtOrState}` : (subLocation || districtOrState || data.display_name.split(',')[0] || 'Unknown Place');
              }
            } catch (err) {
              console.error("OSM Click Reverse Geocode error", err);
            }

            if (!osmName) {
              const props = feature.properties;
              osmName = props?.NAME_4 || props?.NAME_2 || props?.NAME_1 || 'Unknown';
            }

            setOsmAddress(osmAddr);

            // Find matching cell
            let matchingCell = districtsDataRef.current?.features.find((f: any) => f.id === featureId);
            if (!matchingCell && districtsDataRef.current) {
              const pointPoint = turf.point([clickCoords.lng, clickCoords.lat]);
              matchingCell = districtsDataRef.current.features.find((f: any) => {
                try {
                  return turf.booleanPointInPolygon(pointPoint, f);
                } catch(err) {
                  return false;
                }
              });
            }

            const cellName = matchingCell ? (matchingCell.properties?.NAME_4 || matchingCell.properties?.NAME_2 || matchingCell.properties?.NAME_1 || 'Unknown') : 'Unknown';
            const subLocName = subLocation || osmName.split(',')[0] || 'Local Detail';

            if (matchingCell && cellName !== 'Unknown') {
              if (!MOCK_NEWS[cellName]) {
                MOCK_NEWS[cellName] = [];
              }

              // Check if we already have news for this specific sub-location. If not, generate some
              const alreadyHasSubLocNews = MOCK_NEWS[cellName].some(n => n.subLocation === subLocName);
              if (!alreadyHasSubLocNews) {
                const addCount = Math.floor(Math.random() * 3) + 1;
                const shuffledTemplates = [...NEWS_TEMPLATES].sort(() => 0.5 - Math.random());
                const subLocationNews = shuffledTemplates.slice(0, addCount).map((n, idx) => ({
                  ...n,
                  id: `osm-${subLocName.replace(/\s+/g, '-')}-${n.id}-${idx}-${Date.now()}`,
                  title: `${n.title} in ${subLocName}`,
                  summary: `${n.summary} Bringing localized reporting from the ${subLocName} area of ${cellName}.`,
                  subLocation: subLocName,
                  date: 'Just now'
                }));
                MOCK_NEWS[cellName] = [...subLocationNews, ...MOCK_NEWS[cellName]].slice(0, 15);
              }

              // Update matching grid cell heatmap color count based on the aggregated news list length
              matchingCell.properties = {
                ...matchingCell.properties,
                newsCount: MOCK_NEWS[cellName].length
              };

              if (map.current) {
                const src = map.current.getSource('districts') as maplibregl.GeoJSONSource;
                if (src) {
                  src.setData(districtsDataRef.current);
                }
              }
            }

            // STEP 2: START LIFTING EARLY IN THE FLY
            setTimeout(() => {
              if (clickedIdRef.current !== null) {
                mapInstance.setFeatureState({ source: 'districts', id: clickedIdRef.current }, { clicked: false });
              }
              clickedIdRef.current = featureId;
              if (featureId !== null) {
                mapInstance.setFeatureState({ source: 'districts', id: featureId }, { clicked: true });
                
                mapInstance.setFilter('district-active-lift', ['==', ['id'], featureId]);
                mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-height', 0);
                setTimeout(() => {
                  mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-height', 1500);
                }, 50);
              }

              // STEP 3: DROP MARKER (800ms after lift start)
              setTimeout(() => {
                setMarkerCoords({ lng: Number(clickCoords.lng.toFixed(4)), lat: Number(clickCoords.lat.toFixed(4)) });
                
                if (marker.current) marker.current.remove();
                
                const el = document.createElement('div');
                el.innerHTML = `
                  <div class="marker-planting" style="color: ${activeFillColorRef.current.active}; filter: drop-shadow(0 0 10px ${activeFillColorRef.current.active});">
                     <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                       <circle cx="12" cy="10" r="3" fill="white"></circle>
                     </svg>
                  </div>
                `;

                marker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                  .setLngLat(clickCoords)
                  .addTo(mapInstance);

                // STEP 4: OPEN UI (After animations complete)
                setTimeout(() => {
                  setSelectedDistrict(cellName !== 'Unknown' ? cellName : osmName);
                  setSelectedSubLocation(subLocName);
                  setOsmLoading(false);
                  setIsSettingsOpen(false);
                  setTimeout(() => {
                    isAnimatingRef.current = false;
                    setIsAnimating(false);
                  }, 500);
                }, 1300);
              }, 800); 
            }, 400); 
          }
        });

      } catch (err: any) {
        setError(err.message || 'Error loading map.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const handleCloseNews = () => {
    setSelectedNews(null);
  };

  const handleCloseDistrict = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    // 1. Start UI exit
    setSelectedDistrict(null);
    setSelectedSubLocation(null);
    setSearchQuery('');
    setGeocodedResults([]);
    
    // 2. Clear marker with a slight delay so it doesn't just disappear instantly
    // but also doesn't stay too long when we fly away
    setTimeout(() => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      setMarkerCoords(null);
    }, 400);

    // 3. Map Instance logic
    if (map.current) {
      const mapInstance = map.current;
      
      // Start lowering the lifted cell early
      if (clickedIdRef.current !== null) {
        mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-height', 0);
      }

      // Smooth cinematic flight back to base vision
      mapInstance.flyTo({
        center: [90.356, 23.685],
        zoom: 7,
        pitch: is3D ? 45 : 0,
        bearing: is3D ? -10 : 0,
        duration: 2200,
        curve: 1.1,
        speed: 0.45,
        essential: true
      });

      // 4. Final state cleanup once animations are settled
      setTimeout(() => {
        if (map.current) {
          if (clickedIdRef.current !== null) {
            map.current.setFeatureState(
              { source: 'districts', id: clickedIdRef.current },
              { clicked: false }
            );
            map.current.setFilter('district-active-lift', ['==', ['id'], -1]);
            clickedIdRef.current = null;
          }
          isAnimatingRef.current = false;
          setIsAnimating(false);
        }
      }, 2300);
    } else {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (map.current) map.current.setStyle(STYLES[newTheme]);
  };

  const [geocodedResults, setGeocodedResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchGeocode = async () => {
      if (!searchQuery || searchQuery.length < 3 || selectedDistrict) {
        setGeocodedResults([]);
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}+Bangladesh&limit=3`);
        if (!res.ok) return;
        const data = await res.json();
        setGeocodedResults(data);
      } catch (e) {
        console.error("Geocoding failed", e);
      }
    };
    const timer = setTimeout(fetchGeocode, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDistrict]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0 || selectedDistrict) return [];
    
    const local = !districtsDataRef.current ? [] : districtsDataRef.current.features
      .map((f: any) => ({
        name: f.properties?.NAME_4 || f.properties?.NAME_2 || f.properties?.NAME_1 || 'Unknown',
        feature: f,
        type: 'local'
      }))
      .filter((s: any, idx: number, self: any[]) => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        self.findIndex(t => t.name === s.name) === idx
      )
      .slice(0, 3);
    
    const external = geocodedResults.map(res => ({
      name: res.display_name.split(',')[0],
      lat: parseFloat(res.lat),
      lng: parseFloat(res.lon),
      type: 'external'
    }));

    return [...local, ...external].slice(0, 5);
  }, [searchQuery, selectedDistrict, geocodedResults]);

  const handleSuggestionClick = async (suggestion: any) => {
    if (!map.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setOsmLoading(true);

    let center: { lng: number; lat: number };
    let matchingFeature: any = null;

    if (suggestion.type === 'local') {
      const turfCenter = turf.center(suggestion.feature).geometry.coordinates;
      center = { lng: turfCenter[0], lat: turfCenter[1] };
      matchingFeature = suggestion.feature;
    } else {
      center = { lng: suggestion.lng, lat: suggestion.lat };
      if (districtsDataRef.current) {
        const point = turf.point([center.lng, center.lat]);
        matchingFeature = districtsDataRef.current.features.find((f: any) => {
          try {
            return turf.booleanPointInPolygon(point, f);
          } catch(err) {
            return false;
          }
        });
      }
    }

    const mapInstance = map.current;
    
    // STEP 1: Smoothly pan to the center first
    mapInstance.easeTo({
      center: center,
      duration: 1000,
      easing: (t) => t * (2 - t)
    });

    // STEP 2: Execute cinematic fly
    setTimeout(() => {
      if (map.current) {
        map.current.flyTo({ 
          center: center, 
          zoom: 10, 
          pitch: 65, 
          bearing: -5,
          duration: 2500, 
          essential: true,
          curve: 1.2, 
          speed: 0.4
        });
      }
    }, 300);

    // Fetch OSM Reverse Geocoding in parallel
    let osmName = '';
    let osmAddr: any = null;
    let subLocation = '';
    try {
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=14`);
      if (osmRes.ok) {
        const data = await osmRes.json();
        osmAddr = data;
        const address = data.address || {};
        subLocation = address.suburb || address.neighbourhood || address.village || address.quarter || address.town || address.hamlet || address.city_district || address.road || '';
        const districtOrState = address.district || address.state_district || address.state || '';
        osmName = subLocation && districtOrState ? `${subLocation}, ${districtOrState}` : (subLocation || districtOrState || data.display_name.split(',')[0] || 'Unknown Place');
      }
    } catch (err) {
      console.error("OSM Suggestion Reverse Geocode error", err);
    }

    if (!osmName) {
      osmName = suggestion.name || 'Unknown Place';
    }

    setOsmAddress(osmAddr);

    const cellName = matchingFeature ? (matchingFeature.properties?.NAME_4 || matchingFeature.properties?.NAME_2 || matchingFeature.properties?.NAME_1 || 'Unknown') : 'Unknown';
    const subLocName = subLocation || osmName.split(',')[0] || 'Local Detail';

    if (matchingFeature && cellName !== 'Unknown') {
      if (!MOCK_NEWS[cellName]) {
        MOCK_NEWS[cellName] = [];
      }

      // Check if we already have news for this specific sub-location. If not, generate some
      const alreadyHasSubLocNews = MOCK_NEWS[cellName].some(n => n.subLocation === subLocName);
      if (!alreadyHasSubLocNews) {
        const addCount = Math.floor(Math.random() * 3) + 1;
        const shuffledTemplates = [...NEWS_TEMPLATES].sort(() => 0.5 - Math.random());
        const subLocationNews = shuffledTemplates.slice(0, addCount).map((n, idx) => ({
          ...n,
          id: `osm-${subLocName.replace(/\s+/g, '-')}-${n.id}-${idx}-${Date.now()}`,
          title: `${n.title} in ${subLocName}`,
          summary: `${n.summary} Bringing localized reporting from the ${subLocName} area of ${cellName}.`,
          subLocation: subLocName,
          date: 'Just now'
        }));
        MOCK_NEWS[cellName] = [...subLocationNews, ...MOCK_NEWS[cellName]].slice(0, 15);
      }

      // Update matching grid cell heatmap color count based on the aggregated news list length
      matchingFeature.properties = {
        ...matchingFeature.properties,
        newsCount: MOCK_NEWS[cellName].length
      };

      if (map.current) {
        const src = map.current.getSource('districts') as maplibregl.GeoJSONSource;
        if (src) {
          src.setData(districtsDataRef.current);
        }
      }
    }

    // STEP 3: Lift Cell
    setTimeout(() => {
      const featureId = matchingFeature?.id ?? null;
      if (clickedIdRef.current !== null) {
        mapInstance.setFeatureState({ source: 'districts', id: clickedIdRef.current }, { clicked: false });
      }
      clickedIdRef.current = featureId;
      if (featureId !== null) {
        mapInstance.setFeatureState({ source: 'districts', id: featureId }, { clicked: true });
        mapInstance.setFilter('district-active-lift', ['==', ['id'], featureId]);
        mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-height', 0);
        setTimeout(() => {
          mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-height', 1500);
        }, 50);
      }

      // Step 3: Marker (800ms after lift start)
      setTimeout(() => {
        setMarkerCoords({ lng: Number(center.lng.toFixed(4)), lat: Number(center.lat.toFixed(4)) });
        
        if (marker.current) marker.current.remove();
        
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="marker-planting" style="color: ${activeFillColorRef.current.active}; filter: drop-shadow(0 0 10px ${activeFillColorRef.current.active});">
             <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
               <circle cx="12" cy="10" r="3" fill="white"></circle>
             </svg>
          </div>
        `;

        marker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(center)
          .addTo(mapInstance);

        // Step 4: Open UI
        setTimeout(() => {
          setSelectedDistrict(cellName !== 'Unknown' ? cellName : osmName);
          setSelectedSubLocation(subLocName);
          setOsmLoading(false);
          setIsSettingsOpen(false);
          setTimeout(() => {
            isAnimatingRef.current = false;
            setIsAnimating(false);
          }, 500);
        }, 1300);
      }, 800);
    }, 400);

    setSearchQuery('');
    setGeocodedResults([]);
  };

  const filteredNews = useMemo(() => {
    let news = selectedDistrict ? (MOCK_NEWS[selectedDistrict] || []) : DEFAULT_NEWS;
    
    if (selectedCategory) {
      news = news.filter(n => n.category === selectedCategory);
    }
    
    if (searchQuery && selectedDistrict) {
      news = news.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.subLocation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return news;
  }, [selectedDistrict, searchQuery, selectedCategory]);

  const famousInfo = useMemo(() => {
    if (!selectedDistrict) return null;
    return FAMOUS_FOR[selectedDistrict] || { 
      place: '', 
      image: 'https://images.unsplash.com/photo-1544735038-179ad682ee71' 
    };
  }, [selectedDistrict]);

  return (
    <div className={`relative w-full h-screen font-sans overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#060606]' : 'bg-[#f8fafc]'}`}>
      <div id="map" ref={mapContainer} className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${selectedDistrict || isSettingsOpen || selectedNews ? 'opacity-80' : 'opacity-100'} ${selectedDistrict || isSettingsOpen || selectedNews || isAnimating ? 'pointer-events-none' : ''}`} />
      
      {/* Search Bar - Fixed Top */}
      <div className="absolute top-0 left-0 w-full z-40 p-4 md:p-10 pointer-events-none">
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 pointer-events-auto items-stretch">
          <div className="relative flex-1">
                <div className={`flex items-center gap-3 px-5 md:px-6 py-4 md:py-5 rounded-3xl h-full bg-white/10 backdrop-blur-md border border-white/20 transition-all focus-within:bg-white/20 focus-within:border-white/40 shadow-2xl`}>
                  <Search size={22} className={theme === 'dark' ? 'text-white/60' : 'text-gray-900/60'} />
                  <input 
                    type="text" 
                    placeholder={selectedDistrict ? `Search news in ${selectedDistrict}...` : "Explore Bangladesh..."}
                    className={`grow bg-transparent outline-none text-base md:text-lg font-medium ${theme === 'dark' ? 'text-white placeholder:text-white/40' : 'text-gray-900 placeholder:text-gray-900/70'}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
            
            {/* Search Suggestions */}
            <AnimatePresence>
              {searchSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full left-0 right-0 mt-3 p-3 rounded-[32px] overflow-hidden border shadow-2xl z-50 ${theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/90 border-gray-200'} backdrop-blur-xl`}
                >
                  {searchSuggestions.map((s: any, idx: number) => (
                    <button 
                      key={`suggestion-${s.type}-${s.name}-${idx}`}
                      onClick={() => handleSuggestionClick(s)}
                      className={`w-full text-left px-5 py-3 rounded-2xl transition-colors flex items-center gap-3 ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                    >
                      <MapPin size={16} className="text-emerald-400" />
                      <span className="font-bold">{s.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-5 md:px-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 transition-all shadow-2xl flex items-center justify-center ${isSettingsOpen ? 'text-black' : (theme === 'dark' ? 'text-white hover:bg-white/20' : 'text-gray-900 hover:bg-white/20')}`}
            style={isSettingsOpen ? { backgroundColor: activeFillColor.active, borderColor: activeFillColor.active } : {}}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className={`absolute inset-0 z-50 overflow-y-auto custom-scrollbar flex flex-col ${theme === 'dark' ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-3xl`}
          >
            {/* Fixed Close Button for News Detail */}
            <div className="fixed top-8 right-8 z-[60] pointer-events-none">
              <button 
                onClick={handleCloseNews}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full border shadow-2xl transition-all pointer-events-auto backdrop-blur-3xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-black/5 border-black/5 text-black hover:bg-black/10'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* News Header / Top Image */}
            <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
              <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
            </div>

            <div className="max-w-4xl mx-auto w-full px-8 py-12 flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg" style={{ backgroundColor: activeFillColor.active }}>
                    {selectedNews.category}
                  </span>
                  <span className={`text-xs font-mono font-bold opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {selectedNews.date}
                  </span>
                </div>
                <h1 className={`text-5xl md:text-6xl font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedNews.title}
                </h1>
              </div>

              <div className={`text-lg md:text-xl font-medium leading-relaxed opacity-80 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {selectedNews.content}
              </div>

              {/* Extra hardcoded content for realism */}
              <div className={`text-lg md:text-xl font-medium leading-relaxed opacity-80 mt-4 border-t border-white/10 pt-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <p className="mb-4">
                  Sources close to the development state that further announcements regarding phase two are expected early next month. Local authorities have emphasized that public safety and minimal disruption are of the utmost priority.
                </p>
                <p>
                  As the situation evolves, we will continue to provide updates. Citizens are encouraged to share their feedback through the official portals once the public consultation window opens. This marks a turning point for the local infrastructure and the broader community's growth.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(selectedDistrict || isSettingsOpen) && !selectedNews && (
          <div className="absolute inset-0 z-30 flex flex-col pointer-events-none">
            <div className="flex-1 min-h-[120px]" />
            
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className={`w-full max-w-4xl mx-auto h-[85%] rounded-t-[48px] pointer-events-auto flex flex-col overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-3xl border-t border-white/10`}
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSettingsOpen ? (
                  <div className="p-10 space-y-10">
                    <div className="flex justify-between items-center">
                      <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Control Center</h2>
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X size={24} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                      </button>
                    </div>

                    {/* Dimension Toggle - Mobile Only */}
                    <div className="md:hidden space-y-6">
                      <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Map Dimension</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setIs3D(false)}
                          className={`flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all ${!is3D ? 'border-transparent text-black' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}`}
                          style={!is3D ? { backgroundColor: activeFillColor.active } : {}}
                        >
                          <span className="font-bold uppercase tracking-widest">2D View</span>
                        </button>
                        <button 
                          onClick={() => setIs3D(true)}
                          className={`flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all ${is3D ? 'border-transparent text-black' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}`}
                          style={is3D ? { backgroundColor: activeFillColor.active } : {}}
                        >
                          <span className="font-bold uppercase tracking-widest">3D View</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Interface theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => { 
                            setTheme('light'); 
                            themeRef.current = 'light';
                            if (map.current) map.current.setStyle(STYLES.light); 
                          }}
                          className={`flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all ${theme === 'light' ? 'border-transparent text-black' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}`}
                          style={theme === 'light' ? { backgroundColor: activeFillColor.active } : {}}
                        >
                          <Sun size={20} />
                          <span className="font-bold">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => { 
                            setTheme('dark'); 
                            themeRef.current = 'dark';
                            if (map.current) map.current.setStyle(STYLES.dark); 
                          }}
                          className={`flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all ${theme === 'dark' ? 'border-transparent text-black' : (theme === 'light' ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white')}`}
                          style={theme === 'dark' ? { backgroundColor: activeFillColor.active } : {}}
                        >
                          <Moon size={20} />
                          <span className="font-bold">Dark Mode</span>
                        </button>
                      </div>
                    </div>

                    {!selectedDistrict ? (
                      <div className="space-y-6">
                        <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Themes</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {FILL_COLORS.map(color => (
                            <button 
                              key={color.name}
                              onClick={() => setActiveFillColor(color)}
                              className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${activeFillColor.name === color.name ? 'scale-105' : 'border-transparent bg-white/5 opacity-60 hover:opacity-100'}`}
                              style={activeFillColor.name === color.name ? { borderColor: color.active, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                            >
                              <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: color.active }} />
                              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{color.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filter by Category</label>
                          <div className="flex flex-wrap gap-3">
                            {CATEGORIES.map(cat => (
                              <button 
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className={`px-5 py-3 rounded-full text-xs font-bold transition-all border-2 ${selectedCategory === cat ? 'border-transparent text-black' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}`}
                                style={selectedCategory === cat ? { backgroundColor: activeFillColor.active } : {}}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Filter by Date</label>
                          <div className="relative">
                             <input 
                              type="date" 
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className={`w-full p-5 rounded-[24px] bg-white/5 border-2 border-white/10 text-sm font-bold focus:border-emerald-400 outline-none transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                             />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-0 flex flex-col h-full relative">
                    {/* Fixed Close Button for District View */}
                    <div className="fixed top-8 right-8 z-[60] pointer-events-none">
                      <button 
                        onClick={handleCloseDistrict}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full border shadow-2xl transition-all pointer-events-auto backdrop-blur-3xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-black/5 border-black/5 text-black hover:bg-black/10'}`}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="px-6 md:px-10 py-10 md:py-12">
                      {/* Compact Region Header */}
                      <div className={`mb-10 p-6 md:p-10 rounded-[40px] border overflow-hidden relative shadow-2xl ${theme === 'dark' ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-white/95 border-black/5'}`}>
                        {/* Background Container */}
                        <div className="absolute inset-0 z-0 pointer-events-none select-none">
                          {/* Mobile Background */}
                          <div className="md:hidden absolute inset-0">
                            {/* Dotted Pattern for mobile */}
                            <div className={`absolute inset-0 opacity-[0.1] z-10 ${theme === 'dark' ? 'text-white' : 'text-black'}`} style={{ backgroundImage: 'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
                            <img 
                              src={famousInfo?.image} 
                              alt="" 
                              className="w-full h-full object-cover grayscale opacity-40 blur-[1px]" 
                            />
                            <div className={`absolute inset-0 backdrop-blur-[1px] ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'}`} />
                          </div>

                          {/* Desktop Background Layered Approach */}
                          <div className="hidden md:block absolute inset-0 overflow-hidden">
                            {/* The Image Part (Right Side) */}
                            <div className="absolute top-0 right-0 w-3/5 h-full overflow-hidden">
                              <img 
                                src={famousInfo?.image} 
                                alt="" 
                                className={`w-full h-full object-cover grayscale transition-all duration-700 ${theme === 'dark' ? 'brightness-125 contrast-125 opacity-30 px-10' : 'brightness-110 contrast-110 opacity-20 px-10'}`} 
                              />
                              {/* Dotted Overlay */}
                              <div className={`absolute inset-0 opacity-[0.2] z-10 ${theme === 'dark' ? 'text-white' : 'text-black'}`} style={{ backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)', backgroundSize: '18px 18px' }} />
                              
                              {/* Fade out the image as it goes left */}
                              <div className={`absolute inset-0 z-20 ${theme === 'dark' ? 'bg-gradient-to-r from-black via-black/40 to-transparent' : 'bg-gradient-to-r from-white via-white/40 to-transparent'}`} />
                            </div>
                            
                            {/* Subtle Texture Overlay for entire banner */}
                            <div className={`absolute inset-0 z-[5] opacity-[0.03] ${theme === 'dark' ? 'invert' : ''}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h1 className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {selectedDistrict}
                              </h1>
                              {selectedSubLocation && selectedSubLocation !== selectedDistrict && (
                                <span className={`px-4 py-1.5 rounded-2xl font-mono text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  📍 {selectedSubLocation}
                                </span>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 text-[10px] font-black font-mono uppercase tracking-[0.2em] opacity-80 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              <MapPin size={10} />
                              <div className="line-clamp-1">{famousInfo?.place} • {markerCoords?.lat}N, {markerCoords?.lng}E</div>
                            </div>
                          </div>

                          <p className={`text-lg md:text-xl font-bold italic tracking-tight max-w-sm leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Famous for its cultural heritage and local landmarks.
                          </p>
                        </div>
                      </div>

                      {osmLoading ? (
                        <div className={`mb-8 p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'} flex gap-4 items-center shadow-sm animate-pulse`}>
                          <div className="w-5 h-5 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin shrink-0" />
                          <div className="space-y-1">
                            <h4 className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Street Finder / Querying OpenStreetMap...</h4>
                            <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Locating points, neighborhoods, and nearby streets...</p>
                          </div>
                        </div>
                      ) : (
                        osmAddress && (
                          <div className={`mb-8 p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'} flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm animate-fade-in`}>
                            <div className="space-y-1">
                              <h4 className={`text-xs font-black uppercase tracking-[0.2em] opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Street Finder / OpenStreetMap</h4>
                              <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>{osmAddress.display_name}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap shrink-0">
                              {osmAddress.address?.postcode && (
                                <div className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-150 text-gray-700'}`}>
                                  Postal: {osmAddress.address.postcode}
                                </div>
                              )}
                              <div className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-150 text-gray-700'}`}>
                                Node: {osmAddress.osm_id}
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-white/10 text-white/90' : 'bg-gray-150 text-gray-700'}`}>
                                Type: {osmAddress.type || osmAddress.osm_type || 'point'}
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      <div className="space-y-8 pb-20">
                       <div className="flex items-center justify-between">
                         <h3 className={`text-sm font-black uppercase tracking-[0.3em] opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                           Localized Feed
                         </h3>
                         {selectedCategory && (
                           <button 
                             onClick={() => setSelectedCategory(null)} 
                             className="text-[10px] font-black uppercase hover:underline"
                             style={{ color: activeFillColor.active }}
                           >
                             Clear Filter
                           </button>
                         )}
                       </div>
                       
                       <div className="space-y-6">
                        {filteredNews.length > 0 ? filteredNews.map((news, idx) => (
                          <motion.div 
                            key={news.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedNews(news)}
                            onMouseEnter={() => setHoveredName(news.title)}
                            onMouseLeave={() => setHoveredName(null)}
                            className={`group flex flex-col md:flex-row gap-8 p-6 rounded-[40px] transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer border border-transparent hover:border-white/5`}
                          >
                            <div className="w-full md:w-56 h-40 rounded-[32px] overflow-hidden shrink-0 shadow-lg">
                              <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                            </div>
                            <div className="flex flex-col justify-center gap-3">
                               <div className="flex items-center gap-4">
                                <span 
                                  className="px-4 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl"
                                  style={{ backgroundColor: activeFillColor.active }}
                                >
                                  {news.category}
                                </span>
                                {news.subLocation && news.subLocation !== selectedDistrict && (
                                  <span className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-md rounded-full shadow-lg ${theme === 'dark' ? 'bg-white/10 text-emerald-400 border border-emerald-500/20' : 'bg-black/5 text-emerald-700 border border-emerald-500/10'}`}>
                                    📍 {news.subLocation}
                                  </span>
                                )}
                                <span className={`text-[10px] font-black opacity-30 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{news.date}</span>
                               </div>
                               <h2 
                                 className={`text-2xl font-black leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                 style={{ color: hoveredName === news.title ? activeFillColor.active : '' }}
                               >
                                 {news.title}
                               </h2>
                               <p className={`text-sm font-medium leading-relaxed opacity-50 line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{news.summary}</p>
                            </div>
                          </motion.div>
                        )) : (
                          <div className={`p-20 text-center space-y-4 opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <Filter size={48} className="mx-auto opacity-20" />
                            <p className="font-black text-sm uppercase tracking-widest">No matching frequencies found</p>
                          </div>
                        )}
                       </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {hoveredName && !selectedDistrict && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: mousePos.x + 15, y: mousePos.y - 15 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'absolute', top: 0, left: 0 }}
            className="z-50 pointer-events-none"
          >
            <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${theme === 'dark' ? 'bg-black/60 border-white/10' : 'bg-white/80 border-gray-200'} flex flex-col gap-1 min-w-[140px]`}>
              <span className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{hoveredName}</span>
              {coords && (
                <div className={`flex gap-2 text-[9px] font-mono opacity-50 uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <span className="flex items-center gap-1">
                    <span className="font-bold underline underline-offset-2">Lon</span> {coords.lng}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold underline underline-offset-2">Lat</span> {coords.lat}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-emerald-500">Establishing Data Link</div>
          </div>
        </div>
      )}



      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/20 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-black/80 border border-red-500/30 rounded-[32px] p-8 text-center shadow-2xl">
            <div className="text-red-400 font-bold text-xl mb-2">Connection Severed</div>
            <div className="text-red-300/60 text-sm mb-6">{error}</div>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-full border border-red-500/40 transition-all uppercase tracking-widest">Retry Link</button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
