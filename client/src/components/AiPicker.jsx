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
}) => {
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
          if (!isPlaceholder) onSelectImage(item.id);
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
