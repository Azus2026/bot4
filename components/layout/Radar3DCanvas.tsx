"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Radar3DCanvasProps {
  activeLeadCount?: number;
  isScanning?: boolean;
}

export function Radar3DCanvas({ activeLeadCount = 5, isScanning = false }: Radar3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    // Escena, Cámara y Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Grupo principal para rotación
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);

    // 1. Esfera interior con líneas de malla (Holográfico)
    const sphereRadius = 0.85;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 16, 16);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, wireframeMat);
    radarGroup.add(sphereMesh);

    // 2. Anillos orbitales ecuatoriales y meridianos
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });

    const createRing = (radius: number, rotationX: number, rotationY: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 64);
      const ring = new THREE.LineLoop(ringGeo, ringMat);
      ring.rotation.x = rotationX;
      ring.rotation.y = rotationY;
      return ring;
    };

    radarGroup.add(createRing(sphereRadius + 0.02, Math.PI / 2, 0));
    radarGroup.add(createRing(sphereRadius + 0.02, 0, Math.PI / 4));

    // 3. Haz de barrido tipo Radar (Sweeping ray)
    const sweepGeo = new THREE.RingGeometry(0.01, sphereRadius, 32, 1, 0, Math.PI / 3);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.rotation.x = Math.PI / 2;
    radarGroup.add(sweepMesh);

    // 4. Nodos de prospectos detectados (Puntos ámbar y blancos parpadeantes)
    const nodeCount = Math.max(8, activeLeadCount);
    const nodeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const amberColor = new THREE.Color(0xf97316);
    const whiteColor = new THREE.Color(0xf8fafc);
    const blueColor = new THREE.Color(0x38bdf8);

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const r = sphereRadius * (0.98 + Math.random() * 0.08);
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color aleatorio entre ámbar, blanco y azul
      const chosenColor = i % 3 === 0 ? amberColor : i % 3 === 1 ? whiteColor : blueColor;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nodeGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    radarGroup.add(nodes);

    // Animación y rotación
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const speed = isScanning ? 2.5 : 0.8;

      // Rotación suave del globo
      radarGroup.rotation.y += 0.3 * delta;
      radarGroup.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.15;

      // Barrido del radar
      sweepMesh.rotation.z -= speed * delta * 2;

      // Parpadeo de nodos
      nodeMaterial.opacity = 0.7 + Math.sin(clock.getElapsedTime() * 4) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamiento
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Limpieza
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      wireframeMat.dispose();
      ringMat.dispose();
      sweepGeo.dispose();
      sweepMat.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
    };
  }, [activeLeadCount, isScanning]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        ref={mountRef}
        className="h-36 w-36 cursor-pointer transition-transform duration-300 hover:scale-105"
        title="Holograma Orbital de Telemetría: Nodos geográficos en tiempo real"
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-radar-textMuted text-center mt-1">
        {isScanning ? (
          <span className="text-radar-accent animate-pulse font-bold">● ESCANEANDO RED</span>
        ) : (
          <span className="text-radar-blue">RADAR TELEMÉTRICO 3D</span>
        )}
      </div>
    </div>
  );
}
