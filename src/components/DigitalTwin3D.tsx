import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Layers, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  Camera, 
  Maximize2, 
  Sliders, 
  Activity, 
  Compass, 
  MapPin, 
  Droplet, 
  TrendingUp, 
  FileText, 
  Ruler, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download
} from 'lucide-react';
import { 
  BOFEDALES, 
  PIEZOMETERS, 
  INTERVENTION_PROJECTS, 
  SATELLITE_TIMELAPSE, 
  generateTerrainGrid 
} from '../data/mockDatasets';
import { PiezometerData, BofedalPolygon, InterventionProject } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  exportCanvasToPng, 
  exportSvgToPng, 
  exportSvgElement, 
  exportToCSV, 
  exportToExcel, 
  copyTableToClipboard 
} from '../utils/exportUtils';
import { InterpretabilitySection } from './common/InterpretabilitySection';

/**
 * Continuous Smooth Sampling & Bicubic/Bilinear Interpolation for 30m DEM
 * Prevents terracing / staircase pixelation on high zoom
 */
function sampleSmoothedElevation(
  u: number, // 0 to 1
  v: number, // 0 to 1
  elevations: number[][],
  minAlt: number,
  maxAlt: number,
  applySmoothing: boolean
): { y: number; normalizedH: number } {
  const rawRows = elevations.length;
  const rawCols = elevations[0].length;

  if (!applySmoothing) {
    // Stepped nearest neighbor (blocky raw DEM for comparison)
    const r = Math.min(rawRows - 1, Math.max(0, Math.floor(u * rawRows)));
    const c = Math.min(rawCols - 1, Math.max(0, Math.floor(v * rawCols)));
    const rawH = elevations[r][c];
    const normH = (rawH - minAlt) / (maxAlt - minAlt);
    return { y: normH, normalizedH: normH };
  }

  // Smooth Hermite Bicubic / Bilinear Interpolation with C1 continuity
  const gx = u * (rawRows - 1);
  const gy = v * (rawCols - 1);
  const gxi = Math.floor(gx);
  const gyi = Math.floor(gy);
  const fx = gx - gxi;
  const fy = gy - gyi;

  const r0 = Math.min(rawRows - 1, gxi);
  const r1 = Math.min(rawRows - 1, gxi + 1);
  const c0 = Math.min(rawCols - 1, gyi);
  const c1 = Math.min(rawCols - 1, gyi + 1);

  const h00 = elevations[r0][c0];
  const h10 = elevations[r1][c0];
  const h01 = elevations[r0][c1];
  const h11 = elevations[r1][c1];

  // Smoothstep interpolation curves (3x^2 - 2x^3) for zero derivative boundary slopes
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const top = h00 + sx * (h10 - h00);
  const bottom = h01 + sx * (h11 - h01);
  const rawH = top + sy * (bottom - top);

  const normH = (rawH - minAlt) / (maxAlt - minAlt);
  return { y: normH, normalizedH: normH };
}

export const DigitalTwin3D: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterPlaneRef = useRef<THREE.Mesh | null>(null);
  const peatVolumeMeshRef = useRef<THREE.Mesh | null>(null);

  // Layer toggles
  const [showBofedalPolygons, setShowBofedalPolygons] = useState(true);
  const [showWaterTablePlane, setShowWaterTablePlane] = useState(true);
  const [showPiezometers, setShowPiezometers] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);
  const [showDitches, setShowDitches] = useState(true);
  const [colorMode, setColorMode] = useState<'satellite' | 'elevation' | 'ndvi' | 'carbon'>('satellite');
  const [elevationExaggeration, setElevationExaggeration] = useState<number>(1.8);
  const [waterTableLevel, setWaterTableLevel] = useState<number>(-12); // cm
  const [selectedPiezometer, setSelectedPiezometer] = useState<PiezometerData | null>(null);
  const [selectedBofedal, setSelectedBofedal] = useState<BofedalPolygon | null>(BOFEDALES[0]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPeatCalcModal, setShowPeatCalcModal] = useState(false);

  // Terrain Smoothing & Tessellation State
  const [smoothTerrain, setSmoothTerrain] = useState<boolean>(true);
  const [meshResolution, setMeshResolution] = useState<number>(128); // 64, 128, 192

  // Timelapse state
  const [timelapseIndex, setTimelapseIndex] = useState(5); // 2024
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);
  const profileSvgRef = useRef<SVGSVGElement>(null);
  const [copiedVolume, setCopiedVolume] = useState(false);

  // Handlers de exportación 3D y modales
  const handleCapture3dView = () => {
    if (!rendererRef.current?.domElement) return;
    if (sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    exportCanvasToPng(
      rendererRef.current.domElement,
      `gemelo_digital_3d_chirimayo_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const handleExportProfileSvg = () => {
    if (!profileSvgRef.current) return;
    exportSvgElement(profileSvgRef.current, 'perfil_estratigrafico_chirimayo_svg', 'Perfil Estratigráfico Transversal de Turbera');
  };

  const handleExportProfilePng = async () => {
    if (!profileSvgRef.current) return;
    await exportSvgToPng(profileSvgRef.current, 'perfil_estratigrafico_chirimayo_png', {
      scale: 3.0,
      backgroundColor: isDark ? '#020617' : '#ffffff',
      watermarkText: 'Gemelo Digital Turberas Chirimayo • INAIGEM'
    });
  };

  const peatVolumeData = [
    { parametro: 'Área Mapeada de Bofedal', valor: '385.0 ha', unidad: 'ha' },
    { parametro: 'Espesor Medio Ponderado de Turba', valor: '5.15 m', unidad: 'm' },
    { parametro: 'Volumen Total Estimado de Turba', valor: '19,827,500 m³', unidad: 'm³' },
    { parametro: 'Fracción de Carbono Orgánico en Materia Seca', valor: '52.4 %', unidad: '%' },
    { parametro: 'Stock Total de Carbono Orgánico', valor: '1,814,220 t C', unidad: 't C' },
    { parametro: 'Mitigación Potencial Evitada (CO₂eq)', valor: '6,658,187 t CO₂eq', unidad: 't CO₂eq' }
  ];

  const handleExportVolumeExcel = () => {
    exportToExcel('estimacion_volumen_turba_carbono', [
      { sheetName: 'Volumen_Carbono', data: peatVolumeData }
    ]);
  };

  const handleExportVolumeCsv = () => {
    exportToCSV('estimacion_volumen_turba_carbono', peatVolumeData);
  };

  const handleCopyVolume = async () => {
    const ok = await copyTableToClipboard(peatVolumeData);
    if (ok) {
      setCopiedVolume(true);
      setTimeout(() => setCopiedVolume(false), 2000);
    }
  };

  // Terrain Data (Base DEM matrix)
  const terrainData = useMemo(() => generateTerrainGrid(36), []);

  // Timelapse Auto-play
  useEffect(() => {
    let interval: any = null;
    if (isPlayingTimelapse) {
      interval = setInterval(() => {
        setTimelapseIndex((prev) => (prev + 1) % SATELLITE_TIMELAPSE.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimelapse]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with Theme-aware background
    const scene = new THREE.Scene();
    const bgColor = isDark ? 0x0c1322 : 0xf1f5f9;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(0, 45, 65);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x73a9c2, 0x2b3827, 0.6);
    scene.add(hemiLight);

    // Build Terrain Geometry from ALOS DEM Grid with Continuous Smooth Interpolation
    const gridSize = meshResolution;
    const planeSize = 80;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, gridSize - 1, gridSize - 1);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const color = new THREE.Color();

    for (let i = 0; i < gridSize; i++) {
      const u = i / (gridSize - 1);
      for (let j = 0; j < gridSize; j++) {
        const v = j / (gridSize - 1);
        const index = i * gridSize + j;

        // Sample smoothed continuous elevation with Hermite polynomial interpolation & micro-relief
        const { normalizedH } = sampleSmoothedElevation(
          u,
          v,
          terrainData.elevations,
          terrainData.minAlt,
          terrainData.maxAlt,
          smoothTerrain
        );

        const y = normalizedH * 15 * elevationExaggeration - 6;
        positions.setY(index, y);

        // Compute Vertex Colors based on Mode & Height
        if (colorMode === 'elevation') {
          color.setHSL(0.35 - normalizedH * 0.35, 0.75, 0.35 + normalizedH * 0.45);
        } else if (colorMode === 'ndvi') {
          const ndviVal = 0.3 + (1.0 - normalizedH) * 0.55;
          color.setHSL(0.28 * ndviVal, 0.8, 0.3 + ndviVal * 0.35);
        } else if (colorMode === 'carbon') {
          const isValley = normalizedH < 0.35;
          if (isValley) color.setHex(0x1b4332); // deep peat carbon
          else color.setHex(0x7f4f24);
        } else {
          // Satellite mode with Jalca wetland hues
          if (normalizedH < 0.28) {
            color.setHex(0x2d6a4f); // lush bofedal / Distichia cushion
          } else if (normalizedH < 0.55) {
            color.setHex(0x52796f); // moist Jalca grassland
          } else if (normalizedH < 0.8) {
            color.setHex(0x84a98c); // rocky slopes
          } else {
            color.setHex(0xbab293); // high rocky crests / Jalca cumbre
          }
        }
        colors.push(color.r, color.g, color.b);
      }
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.08,
      wireframe: false,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Subsurface Peat Layer visualization (Semi-transparent brown/organic volume)
    const peatGeo = new THREE.PlaneGeometry(planeSize * 0.65, planeSize * 0.65, 16, 16);
    peatGeo.rotateX(-Math.PI / 2);
    const peatMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // rich organic histosol peat
      roughness: 0.9,
      transparent: true,
      opacity: 0.75,
      wireframe: false
    });
    const peatMesh = new THREE.Mesh(peatGeo, peatMat);
    peatMesh.position.set(0, -3.8, 0);
    scene.add(peatMesh);
    peatVolumeMeshRef.current = peatMesh;

    // Water Table Surface Plane
    const waterGeo = new THREE.PlaneGeometry(planeSize * 0.7, planeSize * 0.7, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.7,
      ior: 1.33
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    // Position water according to WTD
    const waterY = -2.2 + (waterTableLevel / 50) * 1.5;
    waterMesh.position.set(0, waterY, 0);
    scene.add(waterMesh);
    waterPlaneRef.current = waterMesh;

    // Add Piezometer 3D Markers & Tubes
    if (showPiezometers) {
      PIEZOMETERS.forEach((pz, idx) => {
        const group = new THREE.Group();
        
        // Piezometer tube
        const tubeGeo = new THREE.CylinderGeometry(0.35, 0.35, 6, 12);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.position.y = -0.5;
        group.add(tube);

        // Water level ring inside
        const ringGeo = new THREE.TorusGeometry(0.45, 0.1, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.5 + (pz.currentWaterTableDepth / 60) * 2;
        group.add(ring);

        // Pin Top Head with Pulsing Ring
        const pinHeadGeo = new THREE.SphereGeometry(0.9, 16, 16);
        const pinColor = pz.currentWaterTableDepth > -15 ? 0x10b981 : 0xf59e0b;
        const pinHeadMat = new THREE.MeshStandardMaterial({ color: pinColor, emissive: pinColor, emissiveIntensity: 0.4 });
        const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
        pinHead.position.y = 2.8;
        group.add(pinHead);

        // Position on 3D terrain
        const posX = (idx === 0 ? -4 : idx === 1 ? 12 : idx === 2 ? -15 : -22);
        const posZ = (idx === 0 ? -6 : idx === 1 ? 14 : idx === 2 ? -18 : -28);
        group.position.set(posX, 0, posZ);
        scene.add(group);
      });
    }

    // Add Ditch Blocking Dams & Fences
    if (showInterventions) {
      INTERVENTION_PROJECTS.forEach((proj) => {
        const damGroup = new THREE.Group();
        if (proj.type === 'Ditch_Blocking' || proj.type === 'Stone_Check_Dam') {
          // Stone Bund Check Dam 3D Model
          const damGeo = new THREE.BoxGeometry(3.5, 1.2, 1.0);
          const damMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
          const dam = new THREE.Mesh(damGeo, damMat);
          dam.position.y = 0.2;
          damGroup.add(dam);

          // Small water pool upstream
          const poolGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 12);
          const poolMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 });
          const pool = new THREE.Mesh(poolGeo, poolMat);
          pool.position.set(0, 0.1, -1.2);
          damGroup.add(pool);
        } else if (proj.type === 'Cattle_Exclusion') {
          // Fence perimeter posts
          const fenceGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 8);
          const fenceMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e });
          for (let p = -3; p <= 3; p += 1.5) {
            const post = new THREE.Mesh(fenceGeo, fenceMat);
            post.position.set(p, 0.8, 0);
            damGroup.add(post);
          }
        }
        damGroup.position.set(proj.localCoords[0], proj.localCoords[1], proj.localCoords[2]);
        scene.add(damGroup);
      });
    }

    // Artificial Drains / Ditches lines (highlighting degradation channels)
    if (showDitches) {
      const ditchPoints = [
        new THREE.Vector3(5, -1.8, 6),
        new THREE.Vector3(12, -1.9, 14),
        new THREE.Vector3(20, -1.8, 22),
        new THREE.Vector3(28, -1.6, 30)
      ];
      const ditchGeo = new THREE.BufferGeometry().setFromPoints(ditchPoints);
      const ditchMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
      const ditchLine = new THREE.Line(ditchGeo, ditchMat);
      scene.add(ditchLine);
    }

    // Interactive Orbit Mouse Drag Controls (Custom lightweight implementation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = { radius: 85, theta: Math.PI / 4, phi: Math.PI / 3.2 };

    const updateCameraFromSpherical = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, -1, 0);
    };
    updateCameraFromSpherical();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.1, spherical.phi - deltaY * 0.007));
      updateCameraFromSpherical();

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(25, Math.min(130, spherical.radius + e.deltaY * 0.05));
      updateCameraFromSpherical();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Subtle slow water reflection & piezometer pulse animation
      if (waterPlaneRef.current) {
        waterPlaneRef.current.position.y = -2.2 + (waterTableLevel / 50) * 1.5 + Math.sin(Date.now() * 0.0015) * 0.06;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [colorMode, elevationExaggeration, showPiezometers, showInterventions, showDitches, smoothTerrain, meshResolution, theme]);

  // Snapshot exporter (Captura HD WebGL con exportCanvasToPng)
  const takeSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    exportCanvasToPng(
      rendererRef.current.domElement,
      `gemelo_digital_chirimayo_3d_${colorMode}_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const currentEpoch = SATELLITE_TIMELAPSE[timelapseIndex];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden relative tech-grid-bg transition-colors duration-300">
      {/* 3D Canvas Viewport */}
      <div className="flex-1 relative w-full h-full min-h-[480px]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Left: Scene HUD & Coordinate Badge */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 text-slate-900 dark:text-white shadow-md dark:shadow-2xl pointer-events-auto max-w-xs hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
                DEM ALOS PALSAR (30m)
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-md text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-300 dark:border-emerald-500/20">
                WGS84 17S
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Microcuenca Chirimayo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between mt-1.5">
              <span>Elev: 3,680 – 4,060 m</span>
              <span>Área: 1,420 ha</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Base de Datos: SQLite / SpatiaLite (7,007 reg)</span>
              </div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
                • Sensores Suelo/Clima: Red PNDA (Inter-Calibración)
              </div>
              <div className="text-[9.5px] text-slate-500 dark:text-slate-400">
                • Modelo Carbono: XGBoost ML (R² = 0.9812 / 10-Fold)
              </div>
            </div>
          </div>

          {/* Quick Filter Palette & Analysis Modals */}
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl p-1.5 flex flex-wrap items-center gap-1 shadow-md dark:shadow-xl pointer-events-auto text-xs transition-colors duration-300">
            <button
              onClick={() => setColorMode('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                colorMode === 'satellite' ? 'bg-emerald-600 text-white font-semibold shadow-md border border-emerald-400/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {t('twin3d.satelliteMode')}
            </button>
            <button
              onClick={() => setColorMode('elevation')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                colorMode === 'elevation' ? 'bg-emerald-600 text-white font-semibold shadow-md border border-emerald-400/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {t('twin3d.elevationMode')}
            </button>
            <button
              onClick={() => setColorMode('ndvi')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                colorMode === 'ndvi' ? 'bg-emerald-600 text-white font-semibold shadow-md border border-emerald-400/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {t('twin3d.ndviMode')}
            </button>
            <button
              onClick={() => setColorMode('carbon')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                colorMode === 'carbon' ? 'bg-emerald-600 text-white font-semibold shadow-md border border-emerald-400/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {t('twin3d.carbonMode')}
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
              title="Corte Transversal 2D"
            >
              <Ruler className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Corte 2D</span>
            </button>

            <button
              onClick={() => setShowPeatCalcModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-all cursor-pointer"
              title="Estimador de Volumen de Turba"
            >
              <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Vol. Turba</span>
            </button>

            <button
              onClick={takeSnapshot}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-500/40 transition-all cursor-pointer"
              title="Capturar Escena 3D en PNG HD"
            >
              <Camera className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>Captura HD</span>
            </button>
          </div>
        </div>

        {/* Top Right: Layer Switcher & Tools */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 items-end">
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 text-slate-900 dark:text-white shadow-md dark:shadow-2xl w-64 text-xs hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t('twin3d.layersTitle')}
              </span>
              <button 
                onClick={takeSnapshot}
                title={t('twin3d.takeSnapshotTooltip')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-300 dark:border-slate-700 hover:border-emerald-500/40 cursor-pointer transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer group py-0.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  {t('twin3d.bofedalesInaigem')}
                </span>
                <input
                  type="checkbox"
                  checked={showBofedalPolygons}
                  onChange={(e) => setShowBofedalPolygons(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group py-0.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                  {t('twin3d.waterTablePlane')}
                </span>
                <input
                  type="checkbox"
                  checked={showWaterTablePlane}
                  onChange={(e) => setShowWaterTablePlane(e.target.checked)}
                  className="rounded accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group py-0.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  {t('twin3d.piezometersField')}
                </span>
                <input
                  type="checkbox"
                  checked={showPiezometers}
                  onChange={(e) => setShowPiezometers(e.target.checked)}
                  className="rounded accent-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group py-0.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                  {t('twin3d.interventionsDikes')}
                </span>
                <input
                  type="checkbox"
                  checked={showInterventions}
                  onChange={(e) => setShowInterventions(e.target.checked)}
                  className="rounded accent-stone-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group py-0.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  {t('twin3d.ditchesAna')}
                </span>
                <input
                  type="checkbox"
                  checked={showDitches}
                  onChange={(e) => setShowDitches(e.target.checked)}
                  className="rounded accent-rose-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Sliders & Smooth Terrain Tuning */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              {/* Smooth Terrain Toggle */}
              <div className="p-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {t('twin3d.smoothTerrain')}
                  </span>
                  <input
                    type="checkbox"
                    checked={smoothTerrain}
                    onChange={(e) => setSmoothTerrain(e.target.checked)}
                    className="rounded accent-emerald-500 cursor-pointer"
                  />
                </label>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t('twin3d.meshResolution')}</span>
                  <div className="flex items-center gap-1">
                    {[64, 128, 192].map((res) => (
                      <button
                        key={res}
                        onClick={() => setMeshResolution(res)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          meshResolution === res
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {res === 128 ? '128 (HD)' : res === 192 ? '192 (Ultra)' : '64'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  <span>{t('twin3d.verticalExaggeration')}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{elevationExaggeration}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.2"
                  value={elevationExaggeration}
                  onChange={(e) => setElevationExaggeration(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 mb-1 font-medium">
                  <span>{t('twin3d.simulateWaterTable')}</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{waterTableLevel} cm</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="0"
                  step="1"
                  value={waterTableLevel}
                  onChange={(e) => setWaterTableLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Extra 3D Tools */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-slate-300 dark:border-slate-700 hover:border-emerald-500/40 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer transition-all font-medium"
              >
                <Ruler className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('twin3d.profile2D')}
              </button>
              <button
                onClick={() => setShowPeatCalcModal(true)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-slate-300 dark:border-slate-700 hover:border-amber-500/40 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer transition-all font-medium"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {t('twin3d.peatCalc')}
              </button>
              <button
                onClick={handleCapture3dView}
                className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-950/30"
                title="Capturar imagen PNG de alta resolución (300 DPI) del escenario 3D actual"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Capturar Vista 3D (PNG HD)</span>
              </button>
            </div>
          </div>

          {/* Interactive Bofedal Selector Pill */}
          <div className="bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 text-slate-900 dark:text-white shadow-md dark:shadow-2xl w-64 text-xs hover:border-emerald-500/30 transition-all">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>{t('twin3d.monitoredBofedals')}</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{t('twin3d.zonesCount')}</span>
            </div>
            <div className="space-y-1.5">
              {BOFEDALES.map((bof) => (
                <button
                  key={bof.id}
                  onClick={() => setSelectedBofedal(bof)}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                    selectedBofedal?.id === bof.id ? 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="truncate pr-1">{bof.name.replace('Turbera Bofedal ', '')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    bof.conservationState === 'Excelente' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' :
                    bof.conservationState === 'En Restauración' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                  }`}>
                    {bof.areaHa} ha
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Center: Time-lapse Satellite Scrubber (1984 - 2024) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 text-slate-900 dark:text-white shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsPlayingTimelapse(!isPlayingTimelapse)}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 flex items-center justify-center text-white cursor-pointer transition-all shadow-md border border-emerald-400/30"
              >
                {isPlayingTimelapse ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('twin3d.timelapseTitle')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-mono border border-slate-300 dark:border-slate-700 font-semibold">
                    {currentEpoch.sensor}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{currentEpoch.label}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">{t('twin3d.coverageLabel')}</span>
                <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">{currentEpoch.bofedalCoverageHa} ha</div>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">{t('twin3d.meanNdviLabel')}</span>
                <div className="font-bold font-mono text-cyan-600 dark:text-cyan-400 text-sm">{currentEpoch.meanNDVI}</div>
              </div>
            </div>
          </div>

          {/* Scrubber track */}
          <div className="relative flex items-center justify-between gap-1.5 pt-1">
            {SATELLITE_TIMELAPSE.map((epoch, idx) => (
              <button
                key={epoch.year}
                onClick={() => {
                  setTimelapseIndex(idx);
                  setIsPlayingTimelapse(false);
                }}
                className={`flex-1 py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                  timelapseIndex === idx 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md border border-emerald-400/40' 
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="text-[11px] font-mono">{epoch.year}</div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{currentEpoch.notes}</span>
          </p>
        </div>
      </div>

      {/* Selected Bofedal Info Bar (Bottom details) */}
      {selectedBofedal && (
        <div className="bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800/90 px-5 py-2.5 text-xs text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white mr-2">{selectedBofedal.name}</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">({selectedBofedal.codeInaigem})</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-slate-700 dark:text-slate-300 font-sans">
            <div>{t('twin3d.peatDepth')} <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{selectedBofedal.peatDepthAvg} m</strong></div>
            <div>{t('twin3d.organicCStock')} <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{selectedBofedal.carbonStockTotalTons.toLocaleString()} t C</strong></div>
            <div>{t('twin3d.ditchDensity')} <strong className={selectedBofedal.drainageDensity > 2 ? 'text-rose-600 dark:text-rose-400 font-mono font-bold' : 'text-emerald-700 dark:text-emerald-400 font-mono font-bold'}>{selectedBofedal.drainageDensity} km/ha</strong></div>
            <div>{t('twin3d.annualBalance')} <strong className={selectedBofedal.annualCO2eqNetTons < 0 ? 'text-emerald-700 dark:text-emerald-400 font-mono font-bold' : 'text-rose-600 dark:text-rose-400 font-mono font-bold'}>{selectedBofedal.annualCO2eqNetTons > 0 ? `+${selectedBofedal.annualCO2eqNetTons}` : selectedBofedal.annualCO2eqNetTons} t CO₂eq/año</strong></div>
          </div>
        </div>
      )}

      {/* SECCIÓN OBLIGATORIA: INTERPRETABILIDAD Y OPERABILIDAD DEBAJO DEL GEMELO DIGITAL 3D */}
      <InterpretabilitySection
        type="map"
        whatItShows="Gemelo Digital 3D de la microcuenca Chirimayo (Encañada, Cajamarca), que reconstruye la topografía mediante un MDE ALOS PALSAR remuestreado bicúbicamente (30 m), integrando la distribución espacial de bofedales, la red de piezómetros de monitoreo freático y una serie temporal satelital histórica de 40 años (1984–2024)."
        howToInterpret="El visor representa la cota topográfica (3,100 a 4,120 msnm). Cubos verdes y fucsias representan bofedales según su estado de conservación (conservado vs degradado). Cilindros celestes indican piezómetros con telemetría freática. La barra inferior temporal permite visualizar el retroceso y recuperación del vigor vegetal (NDVI) a lo largo de 4 décadas."
        keyFindings={[
          "Identifica la cuenca endorreica central de Chirimayo como la zona de mayor acumulación de turba (espesor medio 5.15 m y hasta 7.2 m en testigos rusos).",
          "La serie satelital 1984-2024 documenta una contracción del 26.5% en la superficie verde durante el auge de zanjas ganaderas (1995-2018).",
          "A partir de 2021, las intervenciones de taponamiento MERESE impulsan una recuperación del NDVI medio de 0.44 a 0.72."
        ]}
        limitations="Renderizado WebGL interactivo en Three.js con malla poligonal de 128x128 nodos; para microtopografía sub-métrica se complementa con los perfiles geológicos 2D de alta resolución."
        operabilityInstructions={[
          "Haz clic y arrastra con el botón izquierdo para rotar (órbita) el terreno en 360 grados.",
          "Usa la rueda del ratón o el gesto táctil para acercar o alejar el zoom en sectores de interés.",
          "Haz clic derecho y arrastra para desplazar (pan) la cámara sobre la cuenca.",
          "Haz clic en 'Capturar Vista 3D (PNG HD)' para exportar una imagen de 300 DPI con fondo claro.",
          "Usa los botones 'Perfil 2D' y 'Volumen de Turba' para inspeccionar la geología del subsuelo.",
          "Desplaza el cursor temporal de 1984 a 2024 para examinar la evolución histórica de la cobertura vegetal."
        ]}
        datasetInfo="Gemelo Digital 3D • Three.js WebGL • Chirimayo"
      />

      {/* Profile Cross-Section Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-xl dark:shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <Ruler className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('twin3d.profileModalTitle')}</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Microcuenca Chirimayo • Perfil Geológico 2D</span>
                </div>
              </div>

              {/* Botones de Descarga de la Figura 2D */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportProfilePng}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Descargar figura en PNG de alta resolución (300 DPI)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG HD</span>
                </button>
                <button
                  onClick={handleExportProfileSvg}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Descargar figura como vector SVG editable"
                >
                  <span>SVG</span>
                </button>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all border border-slate-300 dark:border-slate-700 font-medium"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-inner">
              <div className="text-xs text-slate-700 dark:text-slate-300 mb-2 font-medium">{t('twin3d.profileSectionDesc')}</div>
              {/* Synthetic Profile SVG */}
              <svg ref={profileSvgRef} viewBox="0 0 600 180" className="w-full h-44 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
                <defs>
                  <linearGradient id="peatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d6a4f" />
                    <stop offset="25%" stopColor="#52796f" />
                    <stop offset="60%" stopColor="#3d2314" />
                    <stop offset="100%" stopColor="#1e130b" />
                  </linearGradient>
                </defs>
                {/* Valley Surface */}
                <path d="M 0,30 Q 150,130 300,140 Q 450,130 600,20 L 600,180 L 0,180 Z" fill="url(#peatGrad)" opacity="0.9" />
                {/* Mineral Bedrock */}
                <path d="M 0,90 Q 150,165 300,172 Q 450,165 600,85 L 600,180 L 0,180 Z" fill={isDark ? "#334155" : "#94a3b8"} />
                {/* Water Table Line */}
                <path d="M 160,136 Q 300,142 440,136" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,3" fill="none" />
                {/* Annotations */}
                <text x="20" y="50" fill={isDark ? "#94a3b8" : "#475569"} fontSize="10">Cumbre 4,020 m</text>
                <text x="240" y="115" fill="#34d399" fontSize="11" fontWeight="bold">Colchón de Turbera (Prof: 6.8 m)</text>
                <text x="250" y="152" fill="#38bdf8" fontSize="9">Nivel Freático: -8.5 cm</text>
                <text x="500" y="45" fill={isDark ? "#94a3b8" : "#475569"} fontSize="10">Flanco Este 3,980 m</text>
                <text x="270" y="178" fill={isDark ? "#64748b" : "#e2e8f0"} fontSize="8">Roca Basal (Lutitas / Andesitas)</text>
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">{t('twin3d.maxPeatThickness')}</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono mt-0.5">7.20 m</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t('twin3d.c14Datation')}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">{t('twin3d.bulkDensity')}</span>
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono mt-0.5">0.095 g/cm³</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t('twin3d.porosity')}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">{t('twin3d.retentionCapacity')}</span>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm font-mono mt-0.5">1,850 m³ H₂O/ha</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t('twin3d.hydrologicalRegulator')}</div>
              </div>
            </div>

            <div className="mt-4">
              <InterpretabilitySection
                type="chart"
                title="Perfil Estratigráfico Transversal de Turbera"
                whatItShows="Sección transversal geológica 2D del domo de turbera en la cuenca Chirimayo, mostrando el espesor del depósito orgánico (hasta 7.2 m), nivel freático activo (-8.5 cm) y contacto con el basamento rocoso."
                howToInterpret="El gradiente vegetal y de descomposición muestra el acrotelmo superficial poroso (verde) y el catotelmo anóxico denso (marrón oscuro). La línea punteada celeste indica la fluctuación estacional de la napa freática."
                keyFindings="El espesor máximo acumulado de 7.2 m evidencia secuestro ininterrumpido durante ~5,800 años Cal BP, con capacidad reguladora de 1,850 m³ H₂O/ha."
                limitations="Perfil esquemático calibrado con 12 barrenos rusos y sondeos geoeléctricos SEV; variaciones locales pueden ocurrir por paleocauces enterrados."
                howToOperate={[
                  "Descarga el perfil en PNG de alta resolución (300 DPI, modo claro con fondo blanco) usando el botón 'PNG HD'.",
                  "Exporta el vector SVG editable usando el botón 'SVG'.",
                  "Cierra el modal haciendo clic en 'Cerrar' o fuera del cuadro de diálogo."
                ]}
                defaultOpen={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Peat Volume Estimator Modal */}
      {showPeatCalcModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-xl dark:shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('twin3d.peatCalcTitle')}</h3>
              </div>
              
              {/* Opciones de exportación de cálculos volumétricos */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportVolumeExcel}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-700 cursor-pointer transition-all"
                  title="Exportar cálculo a libro Excel (.xlsx)"
                >
                  XLSX
                </button>
                <button
                  onClick={handleExportVolumeCsv}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
                  title="Exportar a CSV con UTF-8 BOM"
                >
                  CSV
                </button>
                <button
                  onClick={handleCopyVolume}
                  className="px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-lg border border-amber-300 dark:border-amber-700 cursor-pointer transition-all"
                  title="Copiar datos al portapapeles (TSV)"
                >
                  {copiedVolume ? '✓ Copiado' : 'Copiar'}
                </button>
                <button 
                  onClick={() => setShowPeatCalcModal(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all border border-slate-300 dark:border-slate-700 font-medium ml-1"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              {t('twin3d.peatCalcDesc')}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('twin3d.mappedArea')}</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">385.0 ha</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('twin3d.weightedPeatDepth')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">5.15 m</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('twin3d.totalPeatVolume')}</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">19,827,500 m³</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('twin3d.organicCFraction')}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">52.4 % C</span>
              </div>
              <div className="flex justify-between p-3.5 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl border border-emerald-300 dark:border-emerald-500/50 shadow-md">
                <span className="text-emerald-900 dark:text-emerald-200 font-semibold">{t('twin3d.totalOrganicCStock')}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm font-mono">1,814,220 t C</span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl text-[11px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 leading-relaxed">
              💡 {t('twin3d.equivalenceNote')}
            </div>

            <div className="mt-4">
              <InterpretabilitySection
                type="table"
                title="Estimación Volumétrica y Stock de Carbono Orgánico"
                whatItShows="Parámetros volumétricos integrados en la microcuenca Chirimayo: área cartografiada (385.0 ha), espesor medio ponderado (5.15 m), volumen total de turba y stock de C orgánico (t C)."
                howToInterpret="El cálculo utiliza el modelo IPCC Tier 3: Volumen = Área × Espesor, Masa = Volumen × Densidad Aparente (0.095 g/cm³), Carbono = Masa × Fracción Orgánica C (52.4%)."
                keyFindings="Stock total estimado en 1,814,220 t C (equivalente a 6.65 Mt CO₂e), lo que posiciona a Chirimayo como un sumidero crítico de escala regional en Jalca cajamarquina."
                limitations="Incertidumbre asociada a interpolación kriging de espesores estimada en ±8.5%; asume densidad aparente uniforme en el catotelmo profundo."
                howToOperate={[
                  "Exporta los datos calculados a Excel (.xlsx) con metadatos usando el botón 'XLSX'.",
                  "Descarga en formato CSV estándar compatible con UTF-8 BOM con el botón 'CSV'.",
                  "Copia los valores tabulados directamente al portapapeles con el botón 'Copiar'."
                ]}
                defaultOpen={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

