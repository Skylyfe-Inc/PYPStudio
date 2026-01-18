import React, { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import config from "../config/config/config";

const FALLBACK_GLB = "/public/TestShoe.glb";
const mode = import.meta.env.MODE || "development";
const API_BASE_URL =
  config[mode]?.backendUrl || config.development.backendUrl;

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

const PreviewModel = ({ url }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.35} />;
};

const MeshyPreview = ({
  modelUrl,
  hasMeshyModel = false,
  isLoading = false,
  className = "",
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const resolvedUrl = useMemo(
    () => {
      if (!loadFailed && modelUrl && typeof modelUrl === "string") {
        // Proxy Meshy assets through the backend to avoid CORS issues.
        if (/^https:\/\/assets\.meshy\.ai\//i.test(modelUrl)) {
          return `${API_BASE_URL}/api/v1/meshy/proxy?url=${encodeURIComponent(
            modelUrl,
          )}`;
        }
        return modelUrl;
      }
      return FALLBACK_GLB;
    },
    [modelUrl, loadFailed],
  );
  const isUsingFallback = resolvedUrl === FALLBACK_GLB;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl border-2 border-slate-900 bg-white ${className}`}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.85} />
        <hemisphereLight intensity={0.5} groundColor="#f1f5f9" />
        <directionalLight position={[4, 4, 4]} intensity={0.9} />
        <directionalLight position={[-4, 3, 2]} intensity={0.6} />
        <directionalLight position={[0, -4, 2]} intensity={0.4} />
        <directionalLight position={[0, 4, -2]} intensity={0.4} />
        <pointLight position={[0, 0, 4]} intensity={0.45} />
        <pointLight position={[0, 0, -4]} intensity={0.6} />
        <ModelErrorBoundary
          key={`${resolvedUrl}-${loadFailed}`}
          onError={() => setLoadFailed(true)}
          fallback={
            <Html center>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                Preview unavailable
              </div>
            </Html>
          }
        >
          <Suspense
            fallback={
              <Html center>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                  Loading preview…
                </div>
              </Html>
            }
          >
            <PreviewModel url={resolvedUrl} />
          </Suspense>
        </ModelErrorBoundary>
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="meshy-scanline" />
          <div className="meshy-scanline-glow" />
        </div>
      )}
      {!hasMeshyModel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
            No model yet
          </div>
        </div>
      )}
      {hasMeshyModel && isUsingFallback && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-slate-600 shadow">
          Showing sample model
        </div>
      )}
    </div>
  );
};

export default MeshyPreview;
