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
}

const MOCK_NEWS: Record<string, NewsItem[]> = {
  'Dhaka': [
    { 
      id: 'd1', 
      title: 'New Metro Rail Route Planned', 
      summary: 'The government has approved a new route connecting North and South Dhaka to ease traffic.', 
      content: 'In a significant move to tackle the perennial traffic congestion in the capital, the government has officially approved the construction of Metro Rail Line-5. This new route is designed to connect the northern and southern hubs of Dhaka, spanning approximately 20 kilometers. The project, which is part of the Strategic Transport Plan, is expected to serve over 500,000 commuters daily once completed. Construction is slated to begin by late 2024, with a target completion date of 2030. Experts believe this will revolutionize urban mobility in Bangladesh.',
      category: 'Economy', 
      date: '2 hours ago', 
      imageUrl: 'https://images.unsplash.com/photo-1590133325985-7973c683b794' 
    },
    { 
      id: 'd2', 
      title: 'Puran Dhaka Food Festival Starts', 
      summary: 'Witness the traditional flavors of old Dhaka this weekend at Rabindra Sarobar.', 
      content: 'The aroma of Biryani, Bakarkhani, and Kebabs filled the air today as the annual Puran Dhaka Food Festival kicked off in the heart of the capital. This three-day extravaganza aims to celebrate the rich culinary heritage of old Dhaka, bringing together legendary master chefs and food enthusiasts from across the country. Visitors can enjoy over 100 stalls offering authentic delicacies that have been passed down through generations. Cultural performances including local folk music and traditional dances are also scheduled throughout the event.',
      category: 'Culture', 
      date: '5 hours ago', 
      imageUrl: 'https://images.unsplash.com/photo-1512132411229-c30391241dd8' 
    }
  ],
  'Chittagong': [
    { 
      id: 'c1', 
      title: 'Port Expansion Hits New Milestone', 
      summary: 'Chittagong port reports record-breaking cargo handling capacity this quarter.', 
      content: 'The Chittagong Port Authority (CPA) has announced that the port handled a record 3.2 million TEUs of containers in the last fiscal year, marking a 5% growth. This milestone is attributed to the recent automation of the terminal management system and the addition of four new gantry cranes. The authority is now pushing forward with the Bay Terminal project, which will further increase capacity and allow larger vessels to dock. This expansion is critical for maintaining Bangladesh\'s status as a regional trade hub.',
      category: 'Economy', 
      date: '1 day ago', 
      imageUrl: 'https://images.unsplash.com/photo-1588661136423-f36bc9327896' 
    },
    { 
      id: 'c2', 
      title: 'Hill Tracts Conservation Project', 
      summary: 'New initiative launched to protect the biodiversity of Chittagong Hill Tracts.', 
      content: 'A new community-led conservation project has been launched in the Chittagong Hill Tracts to protect endangered species and their habitats. The initiative, funded by international environmental agencies, focuses on reforesting degraded areas and establishing wildlife corridors. Local indigenous communities are being trained as forest rangers and eco-guides, providing them with alternative livelihoods while ensuring the long-term sustainability of the region\'s unique biodiversity. Early reports indicate a promising return of several rare bird species to the area.',
      category: 'Environment', 
      date: '3 days ago', 
      imageUrl: 'https://images.unsplash.com/photo-1544735038-179ad682ee71' 
    }
  ],
  'Sylhet': [
    { 
      id: 's1', 
      title: 'Tea Harvest Reaches Peak', 
      summary: 'Farmers in Sylhet anticipate a bumper crop of high-quality tea leaves this season.', 
      content: 'The tea estates of Sylhet are buzzing with activity as the peak harvest season arrives. Favorable weather conditions, including timely rainfall and moderate sunlight, have led to an exceptional growth of high-quality tea leaves. Estate managers are optimistic that this year\'s yield will surpass previous records, both in quantity and quality. The Surma Valley is leading the production, with several gardens already reporting a 15% increase in harvest compared to last year. Efforts are also being made to improve the living standards of tea workers through various welfare schemes.',
      category: 'Economy', 
      date: '12 hours ago', 
      imageUrl: 'https://images.unsplash.com/photo-1594243603415-46ffcf1b29ed' 
    }
  ]
};

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  const [markerCoords, setMarkerCoords] = useState<{ lng: number; lat: number } | null>(null);
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
    if (selectedDistrict || isSettingsOpen || selectedNews) {
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
  }, [selectedDistrict, isSettingsOpen, selectedNews]);

  const setupLayers = (mapInstance: maplibregl.Map) => {
    if (!districtsDataRef.current) return;
    
    if (mapInstance.getSource('districts') && mapInstance.getLayer('district-fills')) {
      if (mapInstance.getLayer('district-active-fill')) {
        mapInstance.removeLayer('district-active-fill');
      }
      const color = activeFillColorRef.current;
      mapInstance.setPaintProperty('district-fills', 'fill-extrusion-color', [
        'case',
        ['any', ['boolean', ['feature-state', 'clicked'], false], ['boolean', ['feature-state', 'hover'], false]],
        color.active,
        color.base
      ]);
      
      // Update the active lift layer color to follow the theme
      if (mapInstance.getLayer('district-active-lift')) {
        mapInstance.setPaintProperty('district-active-lift', 'fill-extrusion-color', color.active);
      }

      // Update the neon glow color to follow the theme
      if (mapInstance.getLayer('district-neon-glow')) {
        mapInstance.setPaintProperty('district-neon-glow', 'line-color', color.active);
      }
      return;
    }

    mapInstance.addSource('districts', {
      type: 'geojson',
      data: districtsDataRef.current,
      generateId: true
    });

    const isLight = themeRef.current === 'light';
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

    const currColor = activeFillColorRef.current;
    mapInstance.addLayer({
      id: 'district-fills',
      type: 'fill-extrusion',
      source: 'districts',
      paint: {
        'fill-extrusion-color': [
          'case',
          ['any', ['boolean', ['feature-state', 'clicked'], false], ['boolean', ['feature-state', 'hover'], false]],
          currColor.active,
          currColor.base
        ],
        'fill-extrusion-height': ['case', ['boolean', ['feature-state', 'hover'], false], 40, 0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.2,
        'fill-extrusion-height-transition': { duration: 400, delay: 0 }
      }
    });

    // Dedicated layer for the "Slow Lift" animation
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
    }, 'district-fills');

    // Add glowing active highlight layer
    if (mapInstance.getLayer('district-fills')) {
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
      }, 'district-fills');
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
  }, [activeFillColor]);

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
              const featureWithId = { ...f, id: idx };
              try {
                const buffered = turf.buffer(featureWithId, -0.1, { units: 'kilometers' });
                return buffered ? { ...buffered, id: idx } : featureWithId;
              } catch (e) {
                return featureWithId;
              }
            })
          };
        } catch (e) {
          throw new Error("Invalid GeoJSON file.");
        }

        const mapInstance = new maplibregl.Map({
          container: mapContainer.current!,
          style: STYLES.light,
          center: [90.356, 23.685],
          zoom: 7,
          pitch: 45,
          bearing: -10,
          maxBounds: BANGLADESH_BOUNDS,
          maxZoom: 13
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

        mapInstance.on('mousemove', 'district-fills', (e) => {
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

        mapInstance.on('mouseleave', 'district-fills', () => {
          if (hoveredId !== null) mapInstance.setFeatureState({ source: 'districts', id: hoveredId }, { hover: false });
          hoveredId = null;
          setHoveredName(null);
          setCoords(null);
        });

        mapInstance.on('click', 'district-fills', async (e) => {
          if (isAnimatingRef.current) return;
          
          if (e.features && e.features.length > 0) {
            isAnimatingRef.current = true;
            setIsAnimating(true);
            const feature = e.features[0];
            const props = feature.properties;
            const name = props?.NAME_4 || props?.NAME_2 || props?.NAME_1 || 'Unknown';
            const clickCoords = e.lngLat;
            const featureId = feature.id ?? null;

            // STEP 1: FLY TO LOCATION
            mapInstance.stop(); 
            
            // Force a visible "zoom out and in" arc by jumping to a wider view first
            // This ensures the animation always plays even if already near the target
            const currentZoom = mapInstance.getZoom();
            const currentPitch = mapInstance.getPitch();
            
            // If already zoomed in, we jump out first to trigger the 'majestic' flyTo
            if (currentZoom > 8.5) {
              mapInstance.jumpTo({
                zoom: currentZoom - 1.5,
                pitch: Math.max(0, currentPitch - 20)
              });
            }

            mapInstance.flyTo({ 
              center: clickCoords, 
              zoom: 10, 
              pitch: 65, 
              bearing: -5,
              duration: 2200, 
              essential: true,
              curve: 2.2, 
              speed: 0.7
            });

            // STEP 2: START LIFTING EARLY IN THE FLY (400ms)
            setTimeout(() => {
              if (clickedIdRef.current !== null) {
                mapInstance.setFeatureState({ source: 'districts', id: clickedIdRef.current }, { clicked: false });
              }
              clickedIdRef.current = featureId;
              if (featureId !== null) {
                mapInstance.setFeatureState({ source: 'districts', id: featureId }, { clicked: true });
                
                // Trigger the smooth lift animation (duration 1000ms)
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
                  setSelectedDistrict(name);
                  setIsSettingsOpen(false);
                  setTimeout(() => {
                    isAnimatingRef.current = false;
                    setIsAnimating(false);
                  }, 500);
                }, 1300); // Wait for the flight and marker to finish
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

    setSelectedDistrict(null);
    setSearchQuery('');
    setMarkerCoords(null);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    
    // Reverse tilt/zoom animation back to initial state
    if (map.current) {
      map.current.flyTo({
        ...INITIAL_STATE,
        duration: 1500,
        essential: true
      });
      
      // Clear clicked state from features
      if (clickedIdRef.current !== null) {
        map.current.setFeatureState(
          { source: 'districts', id: clickedIdRef.current },
          { clicked: false }
        );
        
        // Lower the lifted cell smoothly
        map.current.setPaintProperty('district-active-lift', 'fill-extrusion-height', 0);
        
        setTimeout(() => {
          if (map.current) {
            map.current.setFilter('district-active-lift', ['==', ['id'], -1]);
            // Re-enable interaction after map settles
            isAnimatingRef.current = false;
            setIsAnimating(false);
          }
        }, 1500);

        clickedIdRef.current = null;
      } else {
        // Fallback if no district was active
        setTimeout(() => {
          isAnimatingRef.current = false;
          setIsAnimating(false);
        }, 1500);
      }
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

  const handleSuggestionClick = (suggestion: any) => {
    if (!map.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    setIsAnimating(true);

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
        matchingFeature = districtsDataRef.current.features.find((f: any) => 
          turf.booleanPointInPolygon(point, f)
        );
      }
    }

    const mapInstance = map.current;
    mapInstance.stop();

    // Arc logic
    const currentZoom = mapInstance.getZoom();
    const currentPitch = mapInstance.getPitch();
    if (currentZoom > 8.5) {
      mapInstance.jumpTo({
        zoom: currentZoom - 1.5,
        pitch: Math.max(0, currentPitch - 20)
      });
    }

    // Step 1: Fly
    mapInstance.flyTo({ 
      center: center, 
      zoom: 10, 
      pitch: 65, 
      bearing: -5,
      duration: 2200, 
      essential: true,
      curve: 2.2, 
      speed: 0.7
    });

    // Step 2: Lift Cell (400ms)
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
          if (matchingFeature) {
            const name = matchingFeature.properties?.NAME_4 || matchingFeature.properties?.NAME_2 || matchingFeature.properties?.NAME_1 || 'Unknown';
            setSelectedDistrict(name);
          }
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
    let news = selectedDistrict ? (MOCK_NEWS[selectedDistrict] || DEFAULT_NEWS) : DEFAULT_NEWS;
    
    if (selectedCategory) {
      news = news.filter(n => n.category === selectedCategory);
    }
    
    if (searchQuery && selectedDistrict) {
      news = news.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.summary.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div id="map" ref={mapContainer} className={`absolute inset-0 w-full h-full transition-all duration-500 ${selectedDistrict || isSettingsOpen || selectedNews || isAnimating ? 'pointer-events-none opacity-80' : ''}`} />
      
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

                    <div className="space-y-6">
                      <label className={`text-sm font-black uppercase tracking-widest opacity-40 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Interface theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => { setTheme('light'); if (map.current) map.current.setStyle(STYLES.light); }}
                          className={`flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 transition-all ${theme === 'light' ? 'border-transparent text-black' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900')}`}
                          style={theme === 'light' ? { backgroundColor: activeFillColor.active } : {}}
                        >
                          <Sun size={20} />
                          <span className="font-bold">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => { setTheme('dark'); if (map.current) map.current.setStyle(STYLES.dark); }}
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
                      <div className={`mb-10 p-6 md:p-10 rounded-[40px] border overflow-hidden relative shadow-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                        {/* Background Image - Mobile: Cover, Desktop: Right Aligned */}
                        <div className="absolute inset-0 z-0">
                          <img 
                            src={famousInfo?.image} 
                            alt={selectedDistrict || ''} 
                            className={`w-full h-full object-cover grayscale transition-all duration-700 pointer-events-none ${theme === 'dark' ? 'brightness-150 contrast-150' : 'brightness-110 contrast-110'}`} 
                          />
                          {/* Theme-based Overlay */}
                          <div className={`absolute inset-0 backdrop-blur-[2px] ${theme === 'dark' ? 'bg-black/60' : 'bg-white/60'}`} />
                          
                          {/* Desktop Gradient Mask - only visible on md+ */}
                          <div className={`absolute inset-0 hidden md:block ${theme === 'dark' ? 'bg-gradient-to-r from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-r from-white/80 via-white/40 to-transparent'}`} />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                          <div className="space-y-2">
                            <h1 className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {selectedDistrict}
                            </h1>
                            <div className={`flex items-center gap-2 text-[10px] font-black font-mono uppercase tracking-[0.2em] opacity-60 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              <MapPin size={10} />
                              <div className="line-clamp-1">{famousInfo?.place} • {markerCoords?.lat}N, {markerCoords?.lng}E</div>
                            </div>
                          </div>

                          <p className={`text-lg md:text-xl font-bold italic tracking-tight max-w-sm leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Famous for its cultural heritage and local landmarks.
                          </p>
                        </div>
                      </div>

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
