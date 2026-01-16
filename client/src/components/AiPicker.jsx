import CustomButton from "./CustomButton";

const TYPE_MAP = {
  front: {
    logo: "logo",
    full: "full",
  },
  back: {
    logo: "backLogo",
    full: "backFull",
  },
};

const PLACEMENT_OPTIONS = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
];

const COVERAGE_OPTIONS = [
  { value: "logo", label: "Logo View" },
  { value: "full", label: "Full View" },
];

const AiPicker = ({
  mode = "image",
  prompt,
  setPrompt,
  generatingImg,
  handleSubmit,
  results = [],
  selectedImageId,
  onSelectImage = () => {},
  activeAiType,
  activeAiTypeLabel,
  currentType,
  currentTypeLabel,
  placement = "front",
  onPlacementChange = () => {},
  coverage = "logo",
  expectedCount = 6,
  onMeshySubmit = () => {},
  meshyLoading = false,
  meshyTask = null,
  meshyError = "",
  meshyStyle = "realistic",
  setMeshyStyle = () => {},
  meshyTopology = "triangle",
  setMeshyTopology = () => {},
  meshyPolycount = 30000,
  setMeshyPolycount = () => {},
  meshySymmetry = "auto",
  setMeshySymmetry = () => {},
  meshyPoseMode = "",
  setMeshyPoseMode = () => {},
}) => {
  if (mode === "meshy") {
    const disabled = meshyLoading || !prompt?.trim();
    const normalizedTask =
      typeof meshyTask === "string"
        ? { task_id: meshyTask }
        : meshyTask || {};
    const taskId =
      normalizedTask.task_id ||
      normalizedTask?.data?.task_id ||
      normalizedTask?.result?.task_id ||
      normalizedTask?.raw?.task_id ||
      "—";
    const status =
      normalizedTask.status ||
      normalizedTask?.data?.status ||
      normalizedTask?.result?.status ||
      "pending";
    const assets =
      normalizedTask.assets ||
      normalizedTask?.result?.assets ||
      normalizedTask?.raw?.result?.assets ||
      [];
    const downloadUrl =
      normalizedTask.downloadUrl ||
      (Array.isArray(assets)
        ? assets.find((asset) => asset?.url)?.url
        : undefined);

    return (
      <div className="aipicker-container aipicker-meshy">
        <div className="flex h-full flex-col gap-4">
          <textarea
            placeholder="Describe the 3D model you want Meshy to create…"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="aipicker-textarea"
          />

          <div className="grid gap-3 rounded-xl border-2 border-zinc-200 bg-white/90 p-3 text-xs text-zinc-600">
            <label className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Art style
              </span>
              <select
                value={meshyStyle}
                onChange={(event) => setMeshyStyle(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700"
              >
                <option value="realistic">Realistic</option>
                <option value="sculpture">Sculpture</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Topology
              </span>
              <select
                value={meshyTopology}
                onChange={(event) => setMeshyTopology(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700"
              >
                <option value="triangle">Triangle</option>
                <option value="quad">Quad</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Target polycount
              </span>
              <input
                type="number"
                min={100}
                max={300000}
                step={100}
                value={meshyPolycount}
                onChange={(event) =>
                  setMeshyPolycount(Number(event.target.value || 0))
                }
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Symmetry
              </span>
              <select
                value={meshySymmetry}
                onChange={(event) => setMeshySymmetry(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700"
              >
                <option value="auto">Auto</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Pose mode
              </span>
              <select
                value={meshyPoseMode}
                onChange={(event) => setMeshyPoseMode(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700"
              >
                <option value="">None</option>
                <option value="a-pose">A-pose</option>
                <option value="t-pose">T-pose</option>
              </select>
            </label>
          </div>

          {meshyError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
              {meshyError}
            </div>
          )}

          <CustomButton
            type="custom"
            title={meshyLoading ? "Submitting…" : "Generate 3D Preview"}
            handleClick={onMeshySubmit}
            disabled={disabled}
            customStyles={`w-full justify-center text-[12px] font-semibold uppercase tracking-wide border-2 border-zinc-900 rounded-lg py-2 ${
              meshyLoading
                ? "bg-zinc-300 text-zinc-500"
                : disabled
                  ? "bg-zinc-200 text-zinc-400"
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
            }`}
          />

          <div className="flex flex-1 flex-col gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white/90 p-3">
            {meshyTask ? (
              <>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  <span>Meshy Task Created</span>
                  <span>Status: {status}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Task ID:{" "}
                  <span className="font-semibold text-zinc-700">{taskId}</span>
                </p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-400"
                  >
                    Download GLB
                  </a>
                )}
                {Array.isArray(assets) && assets.length > 0 && (
                  <div className="space-y-1 text-[10px] text-zinc-500">
                    <p className="font-semibold uppercase tracking-wide text-zinc-600">
                      Assets
                    </p>
                    <ul className="space-y-1">
                      {assets.map((asset, index) => (
                        <li key={asset?.url || index}>
                          <a
                            href={asset?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {asset?.type || "asset"} {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <pre className="flex-1 overflow-auto rounded-lg bg-zinc-950 px-3 py-2 text-[10px] leading-relaxed text-zinc-100">
                  {JSON.stringify(normalizedTask.raw ?? normalizedTask, null, 2)}
                </pre>
                <p className="text-[10px] text-zinc-500">
                  Poll the Meshy task status to download the generated GLB once it is ready.
                </p>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                <span>Describe your model and submit to start a Meshy preview task.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasResults = Array.isArray(results) && results.length > 0;
  const images = Array.isArray(results) ? results : [];
  const currentConfigType =
    currentType || TYPE_MAP[placement]?.[coverage] || "logo";
  const displayLabel =
    activeAiTypeLabel || currentTypeLabel || "Selected Placement";

  const slotCount = Math.max(expectedCount, images.length);
  const tileItems = [
    ...images,
    ...Array.from(
      { length: Math.max(0, slotCount - images.length) },
      (_, index) => ({ id: `placeholder-${index}`, placeholder: true }),
    ),
  ];

  const isStreaming = generatingImg && images.length < expectedCount;

  const handleRegenerate = () => {
    handleSubmit(currentConfigType, { force: true });
  };

  const handleCoverageClick = (nextCoverage) => {
    const nextType = TYPE_MAP[placement]?.[nextCoverage];
    if (!nextType) return;
    handleSubmit(nextType, { reuseExisting: true });
  };

  const renderTile = (item, index) => {
    const src = item.base64 || item.url;
    const isPlaceholder = !src;
    const isSelected = !isPlaceholder && item.id === selectedImageId;

    return (
      <button
        type="button"
        key={item.id || `placeholder-${index}`}
        onClick={() => {
          if (!isPlaceholder) onSelectImage(item);
        }}
        disabled={isPlaceholder}
        className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 border-zinc-900 transition-all duration-150 ${
          isPlaceholder
            ? "bg-zinc-950 text-[10px] font-semibold uppercase tracking-wide text-zinc-200"
            : "bg-black hover:ring-2 hover:ring-amber-300"
        } ${
          isSelected ? "ring-2 ring-offset-2 ring-amber-400" : ""
        }`}
      >
        {src ? (
          <img
            src={src}
            alt="AI generated preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>Image</span>
        )}
      </button>
    );
  };

  return (
    <div className="aipicker-container">
      <div className="flex h-full flex-col gap-3">
        <textarea
          placeholder="Ask AI..."
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="aipicker-textarea"
        />

        <CustomButton
          type="custom"
          title={generatingImg ? "Generating..." : "Regenerate Design"}
          handleClick={handleRegenerate}
          disabled={generatingImg || !prompt}
          customStyles={`w-full justify-center text-[12px] font-semibold uppercase tracking-wide border-2 border-zinc-900 rounded-lg py-2 ${
            generatingImg
              ? "bg-amber-200 text-zinc-500"
              : "bg-amber-400 text-zinc-900 hover:bg-amber-300"
          }`}
        />

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
            <span>{displayLabel}</span>
            <span>{`${Math.min(images.length, expectedCount)}/${expectedCount}`}</span>
          </div>

          <div className="aipicker-grid">
            {tileItems.map((item, index) => renderTile(item, index))}
            {isStreaming && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <span className="inline-flex h-9 w-9 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                <span className="sr-only">Generating images…</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PLACEMENT_OPTIONS.map((option) => {
            const isActive = placement === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => onPlacementChange(option.value)}
                aria-pressed={isActive}
                className={`rounded-lg border-2 border-zinc-900 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? "bg-zinc-300 text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {COVERAGE_OPTIONS.map((option) => {
            const isActive = coverage === option.value;
            const accent =
              option.value === "full"
                ? "bg-amber-400 text-zinc-900 hover:bg-amber-300"
                : "bg-zinc-300 text-zinc-900 hover:bg-zinc-200";
            return (
              <CustomButton
                key={option.value}
                type="custom"
                title={option.label}
                handleClick={() => handleCoverageClick(option.value)}
                customStyles={`justify-center text-[11px] font-semibold uppercase tracking-wide border-2 border-zinc-900 rounded-lg py-2 ${
                  isActive ? accent : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AiPicker;
