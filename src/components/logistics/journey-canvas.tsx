"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, type Group } from "three";
import type { JourneyMarker } from "@/lib/stages";
import type { RoutePoint } from "@/lib/route";

type Vehicle = "parcel" | "van" | "air" | "freight";

function toVec(latitude: number, longitude: number, radius: number): [number, number, number] {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function Refresh({ token }: { token: string }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate, token]);
  return null;
}

function DragGroup({
  children,
  skipClick,
}: {
  children: ReactNode;
  skipClick: MutableRefObject<boolean>;
}) {
  const ref = useRef<Group>(null);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const element = gl.domElement;
    const down = (event: PointerEvent) => {
      if (!ref.current) return;
      drag.current = { x: event.clientX, y: event.clientY, rx: ref.current.rotation.x, ry: ref.current.rotation.y };
    };
    const move = (event: PointerEvent) => {
      if (!drag.current || !ref.current) return;
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) skipClick.current = true;
      ref.current.rotation.y = drag.current.ry + dx * 0.008;
      ref.current.rotation.x = Math.max(-0.5, Math.min(0.4, drag.current.rx + dy * 0.006));
      invalidate();
    };
    const up = () => {
      drag.current = null;
    };
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    invalidate();
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, invalidate, skipClick]);

  return <group ref={ref}>{children}</group>;
}

function Parcel({ vehicle, alert }: { vehicle: Vehicle; alert: boolean }) {
  const body = alert ? "#8a4a32" : "#c4a574";
  const metal = "#8d9a94";
  if (vehicle === "air") {
    return (
      <group position={[-0.15, 0.15, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.95, 0.12, 0.14]} />
          <meshStandardMaterial color={metal} roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.72]} />
          <meshStandardMaterial color="#d7ddd8" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[-0.38, 0.08, 0]}>
          <boxGeometry args={[0.16, 0.1, 0.28]} />
          <meshStandardMaterial color={metal} roughness={0.5} metalness={0.25} />
        </mesh>
      </group>
    );
  }
  if (vehicle === "van") {
    return (
      <group position={[-0.15, 0.05, 0]}>
        <mesh position={[0.05, 0.08, 0]}>
          <boxGeometry args={[0.72, 0.32, 0.34]} />
          <meshStandardMaterial color="#243f36" roughness={0.55} metalness={0.15} />
        </mesh>
        <mesh position={[0.34, 0.08, 0]}>
          <boxGeometry args={[0.24, 0.22, 0.3]} />
          <meshStandardMaterial color="#d7ddd8" roughness={0.35} metalness={0.2} />
        </mesh>
      </group>
    );
  }
  if (vehicle === "freight") {
    return (
      <mesh position={[-0.1, 0.05, 0]}>
        <boxGeometry args={[0.95, 0.4, 0.38]} />
        <meshStandardMaterial color={metal} roughness={0.62} metalness={0.28} />
      </mesh>
    );
  }
  return (
    <group position={[-0.15, 0.05, 0]}>
      <mesh>
        <boxGeometry args={[0.46, 0.46, 0.46]} />
        <meshStandardMaterial color={body} roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.47, 0.06, 0.47]} />
        <meshStandardMaterial color="#9a5732" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Markers({
  markers,
  selected,
  onSelect,
  skipClick,
}: {
  markers: JourneyMarker[];
  selected: string | null;
  onSelect: (id: string) => void;
  skipClick: MutableRefObject<boolean>;
}) {
  return (
    <group>
      {markers.map((marker, index) => {
        const angle = -0.95 + (index / Math.max(1, markers.length - 1)) * 1.9;
        const color =
          marker.state === "current" || marker.state === "alert"
            ? "#d08a5a"
            : marker.state === "done"
              ? "#8fbfa8"
              : "#355248";
        const active = selected === marker.id;
        return (
          <mesh
            key={marker.id}
            position={[Math.sin(angle) * 1.2 - 0.15, -0.42, Math.cos(angle) * 0.28]}
            onClick={(event) => {
              event.stopPropagation();
              if (skipClick.current) {
                skipClick.current = false;
                return;
              }
              onSelect(marker.id);
            }}
          >
            <sphereGeometry args={[active ? 0.075 : 0.055, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0.12} />
          </mesh>
        );
      })}
    </group>
  );
}

function Globe({ points }: { points: RoutePoint[] }) {
  const radius = 0.46;
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      const [x, y, z] = toVec(point.latitude, point.longitude, radius * 1.02);
      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
    });
    const buffer = new BufferGeometry();
    buffer.setAttribute("position", new BufferAttribute(positions, 3));
    return buffer;
  }, [points]);
  const line = useMemo(() => new Line(geometry, new LineBasicMaterial({ color: "#e7c7ae" })), [geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
    };
  }, [geometry, line]);

  return (
    <group position={[1.35, 0.02, 0]}>
      <mesh>
        <sphereGeometry args={[radius, 28, 20]} />
        <meshStandardMaterial color="#1b3330" roughness={0.72} metalness={0.18} />
      </mesh>
      {points.length > 1 ? <primitive object={line} /> : null}
      {points.map((point, index) => {
        const [x, y, z] = toVec(point.latitude, point.longitude, radius * 1.04);
        const emphasis = point.role === "current" || point.role === "destination";
        return (
          <mesh key={`${point.role}-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[emphasis ? 0.038 : 0.024, 10, 10]} />
            <meshStandardMaterial color={point.role === "destination" ? "#f4efe6" : "#d08a5a"} />
          </mesh>
        );
      })}
    </group>
  );
}

export function JourneyCanvas({
  markers,
  points,
  vehicle,
  alert,
  selected,
  onSelect,
}: {
  markers: JourneyMarker[];
  points: RoutePoint[];
  vehicle: Vehicle;
  alert: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const skipClick = useRef(false);
  const token = `${vehicle}:${alert}:${selected}:${markers.map((item) => item.state).join("")}:${points.length}`;
  return (
    <Canvas
      camera={{ position: [0.2, 1.05, 3.35], fov: 38 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <color attach="background" args={["#14241e"]} />
      <Refresh token={token} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[3.2, 4.5, 2.4]} intensity={1.35} />
      <directionalLight position={[-2.4, 1.2, -1.6]} intensity={0.28} />
      <DragGroup skipClick={skipClick}>
        <group
          onClick={(event) => {
            event.stopPropagation();
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            onSelect("package");
          }}
        >
          <Parcel vehicle={vehicle} alert={alert} />
        </group>
        <Markers markers={markers} selected={selected} onSelect={onSelect} skipClick={skipClick} />
        {points.length ? <Globe points={points} /> : null}
      </DragGroup>
    </Canvas>
  );
}
