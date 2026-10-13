"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface CameraControllerProps {
  viewMode: "torso" | "heart";
  autoRotate?: boolean;
}

export function CameraController({ viewMode, autoRotate = false }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isTransitioning = useRef(true);

  // Target camera position
  const targetPos = useRef(new THREE.Vector3(0, 0, 6.2));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (viewMode === "torso") {
      targetPos.current.set(0, 0.1, 6.2);
      targetLook.current.set(0, 0, 0);
    } else {
      // Focused on the heart & coronary arteries
      targetPos.current.set(0, 0.15, 3.1);
      targetLook.current.set(0, 0.05, 0);
    }
    isTransitioning.current = true;
  }, [viewMode]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    // Smooth lerp camera towards target
    const step = Math.min(1, delta * 3.0);
    camera.position.lerp(targetPos.current, step);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, step);
      controlsRef.current.update();
    }

    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.8}
      maxDistance={9.0}
      maxPolarAngle={Math.PI / 1.7}
      minPolarAngle={Math.PI / 4}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
      makeDefault
    />
  );
}
