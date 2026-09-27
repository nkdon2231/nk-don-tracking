"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const pearl = new MeshPhysicalMaterial({
  color: "#e7eef5",
  metalness: 0.84,
  roughness: 0.22,
  clearcoat: 0.82,
  clearcoatRoughness: 0.16,
  envMapIntensity: 0.92,
});

const silver = new MeshPhysicalMaterial({
  color: "#d5dee8",
  metalness: 0.88,
  roughness: 0.26,
  clearcoat: 0.7,
  clearcoatRoughness: 0.2,
  envMapIntensity: 0.88,
});

const belly = new MeshPhysicalMaterial({
  color: "#b7c3d1",
  metalness: 0.8,
  roughness: 0.34,
  clearcoat: 0.4,
  clearcoatRoughness: 0.28,
  envMapIntensity: 0.7,
});

const teal = new MeshStandardMaterial({
  color: "#1f8f8c",
  metalness: 0.55,
  roughness: 0.38,
  envMapIntensity: 0.6,
});

const cheat = new MeshStandardMaterial({
  color: "#2ad4c8",
  metalness: 0.42,
  roughness: 0.28,
  emissive: "#0b3f3c",
  emissiveIntensity: 0.18,
  envMapIntensity: 0.7,
});

const navy = new MeshStandardMaterial({
  color: "#0c2744",
  metalness: 0.58,
  roughness: 0.36,
  envMapIntensity: 0.65,
});

const glass = new MeshStandardMaterial({
  color: "#163044",
  metalness: 0.72,
  roughness: 0.08,
  envMapIntensity: 1.1,
});

const dark = new MeshStandardMaterial({ color: "#1a2430", metalness: 0.4, roughness: 0.46 });
const amber = new MeshStandardMaterial({
  color: "#ffb703",
  emissive: "#c8880a",
  emissiveIntensity: 0.65,
  roughness: 0.4,
});

function naca12(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return 0.6 * (0.2969 * Math.sqrt(c) - 0.126 * c - 0.3516 * c * c + 0.2843 * c * c * c - 0.1015 * c * c * c * c);
}

function liftingSurface(opts: {
  span0: number;
  span1: number;
  chord0: number;
  chord1: number;
  lead0: number;
  lead1: number;
  base0: number;
  base1: number;
  thick: number;
  side?: number;
  vertical?: boolean;
}) {
  const S = 18;
  const N = 14;
  const M = N * 2;
  const ring = M + 1;
  const side = opts.side ?? 1;
  const vertical = Boolean(opts.vertical);
  const grid = (S + 1) * ring;
  const positions = new Float32Array((grid + 2) * 3);
  const put = (index: number, x: number, y: number, z: number) => {
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
  };

  for (let i = 0; i <= S; i += 1) {
    const v = i / S;
    const span = opts.span0 + (opts.span1 - opts.span0) * v;
    const chord = opts.chord0 + (opts.chord1 - opts.chord0) * v;
    const lead = opts.lead0 + (opts.lead1 - opts.lead0) * v;
    const base = opts.base0 + (opts.base1 - opts.base0) * v;
    for (let j = 0; j <= M; j += 1) {
      const upper = j <= N;
      const t = upper ? j / N : (M - j) / N;
      const xFrac = 1 - Math.cos((t * Math.PI) / 2);
      const lift = (upper ? 1 : -1) * naca12(xFrac) * chord * (opts.thick / 0.12);
      const x = lead - xFrac * chord;
      if (vertical) put(i * ring + j, x, span, base + lift * side);
      else put(i * ring + j, x, base + lift, side * span);
    }
  }

  const centerOf = (i: number) => {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let j = 0; j < ring; j += 1) {
      const o = (i * ring + j) * 3;
      x += positions[o];
      y += positions[o + 1];
      z += positions[o + 2];
    }
    return [x / ring, y / ring, z / ring] as const;
  };
  const rootCenter = centerOf(0);
  const tipCenter = centerOf(S);
  put(grid, rootCenter[0], rootCenter[1], rootCenter[2]);
  put(grid + 1, tipCenter[0], tipCenter[1], tipCenter[2]);

  const indices: number[] = [];
  for (let i = 0; i < S; i += 1) {
    for (let j = 0; j < M; j += 1) {
      const a = i * ring + j;
      const b = a + 1;
      const c = a + ring;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  for (let j = 0; j < M; j += 1) {
    indices.push(grid, j + 1, j);
    const a = S * ring + j;
    indices.push(grid + 1, a, a + 1);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const normal = geo.getAttribute("normal");
  const probe = Math.floor(S / 2) * ring + Math.floor(N / 2);
  const facing = vertical ? normal.getZ(probe) : normal.getY(probe);
  if (facing < 0) {
    for (let k = 0; k < indices.length; k += 3) {
      const swap = indices[k + 1];
      indices[k + 1] = indices[k + 2];
      indices[k + 2] = swap;
    }
    geo.setIndex(indices);
    geo.computeVertexNormals();
  }
  return geo;
}

function mirrorAcrossZ(source: BufferGeometry) {
  const geo = source.clone();
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i += 1) pos.setZ(i, -pos.getZ(i));
  geo.computeVertexNormals();
  const normal = geo.getAttribute("normal");
  const probe = 9 * 29 + 7;
  if (normal.getY(probe) < 0) {
    const index = geo.getIndex();
    if (index) {
      for (let k = 0; k < index.count; k += 3) {
        const swap = index.getX(k + 1);
        index.setX(k + 1, index.getX(k + 2));
        index.setX(k + 2, swap);
      }
      geo.computeVertexNormals();
    }
  }
  return geo;
}

function paintFuselage(geo: LatheGeometry) {
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const localX = pos.getX(i);
    const bellyMix = Math.max(0, Math.min(1, (localX + 0.02) / 0.34));
    colors[i * 3] = 0.91 - bellyMix * 0.16;
    colors[i * 3 + 1] = 0.94 - bellyMix * 0.14;
    colors[i * 3 + 2] = 0.97 - bellyMix * 0.1;
  }
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function makeFan() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#101820";
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 7;
  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 20) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * 24, 128 + Math.sin(angle) * 24);
    ctx.lineTo(128 + Math.cos(angle + 0.22) * 116, 128 + Math.sin(angle + 0.22) * 116);
    ctx.stroke();
  }
  ctx.fillStyle = "#e7eef5";
  ctx.beginPath();
  ctx.arc(128, 128, 20, 0, Math.PI * 2);
  ctx.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function Engine({ side }: { side: number }) {
  const fan = useMemo(() => makeFan(), []);
  return (
    <group position={[0.08, -0.3, side * 1.28]}>
      <mesh rotation={[0, 0, -Math.PI / 2]} material={silver}>
        <latheGeometry
          args={[
            [
              new Vector2(0.035, -0.5),
              new Vector2(0.1, -0.44),
              new Vector2(0.15, -0.26),
              new Vector2(0.168, 0.02),
              new Vector2(0.158, 0.28),
              new Vector2(0.2, 0.4),
              new Vector2(0.168, 0.48),
            ],
            28,
          ]}
        />
      </mesh>
      <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={teal}>
        <cylinderGeometry args={[0.172, 0.172, 0.045, 24]} />
      </mesh>
      <mesh position={[0.02, 0.18, 0]} material={pearl}>
        <boxGeometry args={[0.46, 0.24, 0.05]} />
      </mesh>
      <mesh position={[0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={dark}>
        <cylinderGeometry args={[0.12, 0.145, 0.2, 20]} />
      </mesh>
      {fan ? (
        <mesh position={[0.47, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.15, 28]} />
          <meshBasicMaterial map={fan} toneMapped={false} side={DoubleSide} />
        </mesh>
      ) : null}
      <mesh position={[0.45, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={silver}>
        <torusGeometry args={[0.188, 0.022, 12, 28]} />
      </mesh>
      <mesh position={[-0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={dark}>
        <coneGeometry args={[0.09, 0.16, 16]} />
      </mesh>
    </group>
  );
}

function GearLeg({ position, reach = 0.42 }: { position: [number, number, number]; reach?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, -reach * 0.45, 0]} material={dark}>
        <cylinderGeometry args={[0.016, 0.014, reach, 8]} />
      </mesh>
      <mesh position={[0, -reach, 0]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
        <cylinderGeometry args={[0.014, 0.014, 0.14, 8]} />
      </mesh>
      <mesh position={[0.055, -reach, 0]} rotation={[0, 0, Math.PI / 2]} material={silver}>
        <torusGeometry args={[0.046, 0.013, 8, 16]} />
      </mesh>
    </group>
  );
}

function CameraFit({ embedded }: { embedded: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    if (embedded) {
      cam.fov = aspect < 0.9 ? 36 : 30;
      const distance = aspect < 0.9 ? 8.6 : 6.7;
      cam.position.set(-0.15, -0.05, distance);
      cam.lookAt(0.1, 0.12, 0);
      cam.updateProjectionMatrix();
      return;
    }
    const fov = aspect < 1.25 ? 30 : 25;
    cam.fov = fov;
    const half = (fov * Math.PI) / 360;
    const targetWidth = aspect < 1.2 ? 8.15 : aspect < 1.7 ? 7.7 : 7.35;
    const distance = targetWidth / (2 * Math.tan(half) * aspect);
    const direction = new Vector3(0.42, 0.98, 1.05).normalize().multiplyScalar(Math.max(distance, 4.8));
    cam.position.copy(direction);
    cam.lookAt(0.02, 0.06, 0);
    cam.updateProjectionMatrix();
  }, [camera, embedded, size]);
  return null;
}

function Stage({ motion, embedded }: { motion: boolean; embedded: boolean }) {
  const rig = useRef<Group>(null);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  const offset = useRef(0);
  const { gl, scene } = useThree();
  const built = useMemo(() => {
    const profile = [
      new Vector2(0.01, 3.2),
      new Vector2(0.07, 3.12),
      new Vector2(0.14, 3.0),
      new Vector2(0.21, 2.82),
      new Vector2(0.27, 2.58),
      new Vector2(0.31, 2.28),
      new Vector2(0.335, 1.9),
      new Vector2(0.348, 1.35),
      new Vector2(0.35, 0.35),
      new Vector2(0.35, -0.85),
      new Vector2(0.345, -1.7),
      new Vector2(0.32, -2.2),
      new Vector2(0.26, -2.62),
      new Vector2(0.17, -2.95),
      new Vector2(0.07, -3.18),
      new Vector2(0.012, -3.3),
    ];
    const fuselage = new LatheGeometry(profile, 56);
    paintFuselage(fuselage);
    const fuseMat = pearl.clone();
    fuseMat.vertexColors = true;
    const wing = liftingSurface({
      span0: 0.18,
      span1: 3.22,
      chord0: 1.42,
      chord1: 0.36,
      lead0: 0.98,
      lead1: -0.22,
      base0: -0.04,
      base1: 0.36,
      thick: 0.125,
    });
    const wingPort = mirrorAcrossZ(wing);
    const stab = liftingSurface({
      span0: 0.08,
      span1: 1.12,
      chord0: 0.78,
      chord1: 0.3,
      lead0: -2.18,
      lead1: -2.52,
      base0: 0.18,
      base1: 0.3,
      thick: 0.1,
    });
    const stabPort = mirrorAcrossZ(stab);
    const fin = liftingSurface({
      span0: 0.02,
      span1: 1.28,
      chord0: 1.12,
      chord1: 0.4,
      lead0: -1.78,
      lead1: -2.22,
      base0: 0,
      base1: 0,
      thick: 0.09,
      vertical: true,
    });
    const winglet = liftingSurface({
      span0: 0.02,
      span1: 0.46,
      chord0: 0.34,
      chord1: 0.14,
      lead0: -0.02,
      lead1: -0.2,
      base0: 0,
      base1: 0,
      thick: 0.1,
      vertical: true,
    });
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d");
    let shadowMap: CanvasTexture | null = null;
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 64, 8, 128, 64, 120);
      gradient.addColorStop(0, "rgba(0,0,0,0.45)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 128);
      shadowMap = new CanvasTexture(shadowCanvas);
    }
    return { fuselage, fuseMat, wing, wingPort, stab, stabPort, fin, winglet, shadowMap };
  }, []);

  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = embedded ? 1.34 : 1.18;
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.045);
    scene.environment = env.texture;
    const el = gl.domElement;
    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      drag.current = { x: event.clientX, yaw: offset.current };
    };
    const move = (event: PointerEvent) => {
      if (!drag.current) return;
      offset.current = Math.max(-0.4, Math.min(0.4, drag.current.yaw + (event.clientX - drag.current.x) * 0.004));
    };
    const up = () => {
      drag.current = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      env.dispose();
      pmrem.dispose();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      built.fuselage.dispose();
      built.fuseMat.dispose();
      built.wing.dispose();
      built.wingPort.dispose();
      built.stab.dispose();
      built.stabPort.dispose();
      built.fin.dispose();
      built.winglet.dispose();
      built.shadowMap?.dispose();
    };
  }, [built, embedded, gl, scene]);

  useFrame((state) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    const sway = motion ? Math.sin(t * 0.22) * (embedded ? 0.035 : 0.07) : 0;
    rig.current.rotation.y = (embedded ? -2.02 : -0.5) + sway + offset.current;
    rig.current.rotation.z = (embedded ? 0.2 : 0) + (motion ? Math.sin(t * 0.28) * 0.015 : 0);
    rig.current.rotation.x = (embedded ? 0.16 : -0.06) + (motion ? Math.sin(t * 0.17) * 0.01 : 0);
    rig.current.position.y = (embedded ? 0.12 : 0) + (motion ? Math.sin(t * 0.36) * 0.02 : 0);
    amber.emissiveIntensity = motion ? 0.4 + Math.sin(t * 2.2) * 0.35 : 0.6;
  });

  return (
    <group ref={rig}>
      <mesh geometry={built.fuselage} material={built.fuseMat} rotation={[0, 0, -Math.PI / 2]} />
      <mesh position={[2.48, 0.3, 0]} scale={[0.7, 0.11, 0.22]} material={silver}>
        <sphereGeometry args={[1, 28, 16]} />
      </mesh>
      <mesh position={[2.62, 0.33, 0]} scale={[0.32, 0.055, 0.15]} material={glass}>
        <sphereGeometry args={[1, 24, 12]} />
      </mesh>
      <mesh position={[2.86, 0.2, 0]} scale={[0.24, 0.028, 0.09]} material={dark}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh position={[0.2, 0.08, 0.358]} material={cheat}>
        <boxGeometry args={[4.55, 0.07, 0.02]} />
      </mesh>
      <mesh position={[0.2, 0.08, -0.358]} material={cheat}>
        <boxGeometry args={[4.55, 0.07, 0.02]} />
      </mesh>
      <mesh geometry={built.wing} material={pearl} />
      <mesh geometry={built.wingPort} material={pearl} />
      <mesh geometry={built.stab} material={silver} />
      <mesh geometry={built.stabPort} material={silver} />
      <mesh geometry={built.fin} material={navy} />
      <mesh position={[-2.02, 0.78, 0.03]} rotation={[0, 0, 0.85]} material={cheat}>
        <boxGeometry args={[0.46, 0.05, 0.02]} />
      </mesh>
      <mesh position={[-1.92, 0.62, 0.03]} rotation={[0, 0, 0.85]} material={cheat}>
        <boxGeometry args={[0.28, 0.035, 0.02]} />
      </mesh>
      <mesh geometry={built.winglet} material={pearl} position={[-0.16, 0.36, 3.18]} />
      <mesh geometry={built.winglet} material={pearl} position={[-0.16, 0.36, -3.18]} />
      <mesh position={[0.12, -0.18, 0]} scale={[0.95, 0.14, 0.26]} material={belly}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <Engine side={1} />
      <Engine side={-1} />
      <mesh position={[3.18, -0.02, 0]} material={amber}>
        <sphereGeometry args={[0.035, 12, 12]} />
      </mesh>
      <mesh position={[0.15, 0.4, 0]} material={amber}>
        <sphereGeometry args={[0.04, 12, 12]} />
      </mesh>
      <mesh position={[-2.15, 1.26, 0]} material={amber}>
        <sphereGeometry args={[0.032, 10, 10]} />
      </mesh>
      <mesh position={[-0.08, 0.38, 3.2]} material={amber}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>
      <mesh position={[-0.08, 0.38, -3.2]} material={amber}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>
      <GearLeg position={[1.72, -0.18, 0]} reach={0.36} />
      <GearLeg position={[0.12, -0.16, 0.58]} reach={0.5} />
      <GearLeg position={[0.12, -0.16, -0.58]} reach={0.5} />
      {embedded || !built.shadowMap ? null : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, -0.78, 0]}>
          <planeGeometry args={[7.2, 2.4]} />
          <meshBasicMaterial map={built.shadowMap} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function HeroAircraftCanvas({ motion, embedded = false }: { motion: boolean; embedded?: boolean }) {
  return (
    <Canvas
      camera={{ position: [2.2, 2.4, 6.6], fov: 25 }}
      dpr={[1, 1.5]}
      frameloop={motion ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
      onCreated={({ camera, invalidate }) => {
        camera.lookAt(0.02, 0.06, 0);
        invalidate();
      }}
    >
      <CameraFit embedded={embedded} />
      {embedded ? (
        <>
          <ambientLight intensity={0.46} />
          <hemisphereLight args={["#d5e7f8", "#6a3d1c", 0.72]} />
          <directionalLight position={[6.5, 2.4, 2.2]} intensity={2.9} color="#ffd7a8" />
          <directionalLight position={[-5, 5.5, -2]} intensity={0.9} color="#9ec6ea" />
          <directionalLight position={[0.4, -1.2, 5]} intensity={0.4} color="#ffb56a" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.38} />
          <hemisphereLight args={["#e7eef6", "#0b1522", 0.62]} />
          <directionalLight position={[5.5, 7, 4]} intensity={2.7} color="#f7f9fc" />
          <directionalLight position={[-6, 2.4, -2]} intensity={1.55} color="#b7fff6" />
          <directionalLight position={[-1, 1.2, 6]} intensity={0.4} color="#d5e2f0" />
        </>
      )}
      <Stage motion={motion} embedded={embedded} />
    </Canvas>
  );
}
