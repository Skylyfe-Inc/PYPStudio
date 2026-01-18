import CustomButton from "./CustomButton";
import MeshyPreview from "./MeshyPreview";

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
  meshyTexturePrompt = "",
  setMeshyTexturePrompt = () => {},
  meshyTextureImageUrl = "",
  setMeshyTextureImageUrl = () => {},
  meshyEnablePbr = true,
  setMeshyEnablePbr = () => {},
  onMeshyRefine = () => {},
  meshyStlUrl = "",
  meshyStlName = "",
  slantMaterial = "PLA",
  setSlantMaterial = () => {},
  slantColor = "black",
  setSlantColor = () => {},
  slantQuantity = 1,
  setSlantQuantity = () => {},
  slantLoading = false,
  slantQuote = null,
  slantError = "",
  onSlantQuote = () => {},
  slantOrder = null,
  slantOrderLoading = false,
  slantOrderError = "",
  slantContact = { name: "", email: "", phone: "" },
  setSlantContact = () => {},
  slantShipping = { street: "", city: "", state: "", zip: "", country: "US", isUSResidential: true },
  setSlantShipping = () => {},
  slantBilling = { street: "", city: "", state: "", zip: "", country: "US", isUSResidential: true },
  setSlantBilling = () => {},
  slantUseShippingForBilling = true,
  setSlantUseShippingForBilling = () => {},
  slantPlatformId = "",
  setSlantPlatformId = () => {},
  slantFilamentId = "",
  setSlantFilamentId = () => {},
  slantPublicFileServiceId = "",
  setSlantPublicFileServiceId = () => {},
  slantItemName = "",
  setSlantItemName = () => {},
  slantSku = "",
  setSlantSku = () => {},
  slantMetadata = "",
  setSlantMetadata = () => {},
  slantFilaments = [],
  slantFilamentsError = "",
  onSlantOrder = () => {},
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
      normalizedTask?.id ||
      normalizedTask?.data?.id ||
      normalizedTask?.result?.id ||
      normalizedTask?.raw?.id ||
      "—";
    const status =
      normalizedTask.status ||
      normalizedTask?.data?.status ||
      normalizedTask?.result?.status ||
      "pending";
    const progressRaw =
      normalizedTask.progress ||
      normalizedTask?.data?.progress ||
      normalizedTask?.result?.progress ||
      0;
    const progressValue = Math.max(0, Math.min(100, Number(progressRaw) || 0));
    const canRefine =
      Boolean(taskId) && String(status).toLowerCase() === "succeeded";
    const normalizedSlantQuote =
      slantQuote?.result || slantQuote?.data || slantQuote || null;
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
    const previewUrl = downloadUrl;
    const hasMeshyModel = Boolean(previewUrl);
    const taskStatus = String(status || "").toLowerCase();
    const isMeshyComplete =
      taskStatus === "succeeded" || taskStatus === "success";
    // STL readiness gates quoting/ordering steps.
    const hasStl = Boolean(meshyStlUrl);
    const isMeshyReady = isMeshyComplete || progressValue >= 100;
    // Platform + filament IDs are required for Slant v2.
    const hasSlantInputs =
      Boolean(slantFilamentId) &&
      Boolean(slantPlatformId);
    const contactReady =
      Boolean(String(slantContact?.name || "").trim()) &&
      Boolean(String(slantContact?.email || "").trim());
    const shippingReady =
      Boolean(String(slantShipping?.street || "").trim()) &&
      Boolean(String(slantShipping?.city || "").trim()) &&
      Boolean(String(slantShipping?.state || "").trim()) &&
      Boolean(String(slantShipping?.zip || "").trim()) &&
      Boolean(String(slantShipping?.country || "").trim());
    const quoteReady = Boolean(normalizedSlantQuote);
    const canQuote = hasSlantInputs && hasStl && contactReady && shippingReady;

    return (
      <div className="aipicker-container aipicker-meshy">
        <div className="flex h-full flex-col gap-4">
          <textarea
            placeholder="Describe the 3D model you want to print (e.g., 'A phone stand with a cable slot and 45-degree tilt, print-ready')…"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="aipicker-textarea"
          />

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur">
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
                customStyles={`w-full justify-center text-[11px] font-semibold uppercase tracking-wide border-2 border-zinc-900 rounded-lg py-1.5 ${
                  meshyLoading
                    ? "bg-zinc-300 text-zinc-500"
                    : disabled
                      ? "bg-zinc-200 text-zinc-400"
                      : "bg-indigo-500 text-white hover:bg-indigo-400"
                }`}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <span>Preview</span>
                <span>{previewUrl ? "Meshy Preview" : "Sample model"}</span>
              </div>
              <MeshyPreview
                modelUrl={previewUrl}
                hasMeshyModel={hasMeshyModel}
                isLoading={meshyLoading || (hasMeshyModel && !isMeshyComplete)}
              />
              {!previewUrl && (
                <p className="text-xs text-zinc-500">
                  Generate a preview to see the Meshy model here.
                </p>
              )}
              <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 text-xs text-zinc-600">
                <p className="font-semibold uppercase tracking-wide text-zinc-500">
                  Texture refine
                </p>
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Texture prompt
                  </span>
                  <textarea
                    rows={3}
                    value={meshyTexturePrompt}
                    onChange={(event) => setMeshyTexturePrompt(event.target.value)}
                    className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                    placeholder="Describe the texture style..."
                  />
                </label>
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Texture image URL (optional)
                  </span>
                  <input
                    type="url"
                    value={meshyTextureImageUrl}
                    onChange={(event) => setMeshyTextureImageUrl(event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                    placeholder="https://..."
                  />
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    checked={meshyEnablePbr}
                    onChange={(event) => setMeshyEnablePbr(event.target.checked)}
                  />
                  Enable PBR textures
                </label>
                {meshyLoading && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      <span>Refine progress</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border border-zinc-300 bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onMeshyRefine(taskId)}
                  disabled={!canRefine}
                  className={`mt-3 w-full rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                    canRefine
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  }`}
                >
                  Refine with textures
                </button>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 text-xs text-zinc-600">
                <p className="font-semibold uppercase tracking-wide text-zinc-500">
                  GLB export
                </p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  The GLB download button appears under the progress bar when the model is ready.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 text-xs text-zinc-600">
                <p className="font-semibold uppercase tracking-wide text-zinc-500">
                  3D Printing Quote
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                  {/* Simple stepper to guide users through quote/order flow. */}
                  <span className={`rounded-full px-2 py-1 ${
                    hasStl ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    1. Model ready
                  </span>
                  <span className={`rounded-full px-2 py-1 ${
                    quoteReady ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    2. Quote
                  </span>
                  <span className={`rounded-full px-2 py-1 ${
                    slantOrder ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    3. Order
                  </span>
                </div>
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Material profile
                  </span>
                  <select
                    value={slantMaterial}
                    onChange={(event) => setSlantMaterial(event.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                  </select>
                </label>
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Color
                  </span>
                  <input
                    type="text"
                    value={slantColor}
                    onChange={(event) => setSlantColor(event.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                    placeholder="Black"
                  />
                </label>
                <label className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={slantQuantity}
                    onChange={(event) =>
                      setSlantQuantity(Math.max(1, Number(event.target.value || 1)))
                    }
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                  />
                </label>
                <button
                  type="button"
                  onClick={onSlantQuote}
                  disabled={slantLoading || !canQuote}
                  className={`mt-3 w-full rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                    slantLoading || !canQuote
                      ? "cursor-not-allowed bg-slate-200 text-slate-400"
                      : "bg-indigo-500 text-white hover:bg-indigo-400"
                  }`}
                >
                  {slantLoading ? "Requesting quote…" : "Get 3D Printing Quote"}
                </button>
                {!hasStl && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Waiting for STL before requesting a quote.
                  </p>
                )}
                {hasStl && !slantPublicFileServiceId && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Uploading STL to Slant3D to generate a file ID…
                  </p>
                )}
                {!hasSlantInputs && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Set platform and filament IDs to enable quotes.
                  </p>
                )}
                {hasStl && hasSlantInputs && (!contactReady || !shippingReady) && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Add contact + shipping to unlock quotes.
                  </p>
                )}
                {slantError && (
                  <p className="mt-2 text-[11px] font-semibold text-rose-600">
                    {slantError}
                  </p>
                )}
                {normalizedSlantQuote && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] text-emerald-700">
                    <p className="font-semibold uppercase tracking-wide">Quote ready</p>
                    {normalizedSlantQuote?.serviceCharge ? (
                      <div className="mt-1 space-y-1 text-[10px] text-emerald-700">
                        <div className="flex justify-between">
                          <span>Print + shipping</span>
                          <span>${normalizedSlantQuote.serviceCharge.baseAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service fee (5%)</span>
                          <span>${normalizedSlantQuote.serviceCharge.serviceCharge}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>${normalizedSlantQuote.serviceCharge.totalWithServiceCharge}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1">Review details in your order history.</p>
                    )}
                  </div>
                )}
                <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white/80 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Step 2: Contact & shipping
                  </p>
                  {(!slantPlatformId || !slantFilamentId) && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Set `VITE_SLANT3D_PLATFORM_ID` and `VITE_SLANT3D_FILAMENT_ID` to enable orders.
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500">
                    File ID is generated automatically after upload.
                  </p>
                  <div className="grid gap-2">
                    <input
                      type="text"
                      value={slantContact.name}
                      onChange={(event) =>
                        setSlantContact((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                      placeholder="Full name"
                    />
                    <input
                      type="email"
                      value={slantContact.email}
                      onChange={(event) =>
                        setSlantContact((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={slantContact.phone}
                      onChange={(event) =>
                        setSlantContact((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="grid gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Shipping address
                    </p>
                    <input
                      type="text"
                      value={slantShipping.street}
                      onChange={(event) =>
                        setSlantShipping((prev) => ({ ...prev, street: event.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                      placeholder="Street address"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={slantShipping.city}
                        onChange={(event) =>
                          setSlantShipping((prev) => ({ ...prev, city: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={slantShipping.state}
                        onChange={(event) =>
                          setSlantShipping((prev) => ({ ...prev, state: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={slantShipping.zip}
                        onChange={(event) =>
                          setSlantShipping((prev) => ({ ...prev, zip: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        placeholder="ZIP"
                      />
                      <input
                        type="text"
                        value={slantShipping.country}
                        onChange={(event) =>
                          setSlantShipping((prev) => ({ ...prev, country: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        placeholder="Country (ISO)"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={slantUseShippingForBilling}
                        onChange={(event) => setSlantUseShippingForBilling(event.target.checked)}
                      />
                      Use shipping address for billing
                    </label>
                  </div>
                  {!slantUseShippingForBilling && (
                    <div className="grid gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Billing address
                      </p>
                      <input
                        type="text"
                        value={slantBilling.street}
                        onChange={(event) =>
                          setSlantBilling((prev) => ({ ...prev, street: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        placeholder="Street address"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={slantBilling.city}
                          onChange={(event) =>
                            setSlantBilling((prev) => ({ ...prev, city: event.target.value }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={slantBilling.state}
                          onChange={(event) =>
                            setSlantBilling((prev) => ({ ...prev, state: event.target.value }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          placeholder="State"
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={slantBilling.zip}
                          onChange={(event) =>
                            setSlantBilling((prev) => ({ ...prev, zip: event.target.value }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          placeholder="ZIP"
                        />
                        <input
                          type="text"
                          value={slantBilling.country}
                          onChange={(event) =>
                            setSlantBilling((prev) => ({ ...prev, country: event.target.value }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                          placeholder="Country (ISO)"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Filament
                    </label>
                    {slantFilamentsError ? (
                      <p className="text-[11px] text-rose-600">
                        {slantFilamentsError}
                      </p>
                    ) : (
                      <select
                        value={slantFilamentId}
                        onChange={(event) => setSlantFilamentId(event.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                      >
                        <option value="" disabled>
                          Select a filament
                        </option>
                        {slantFilaments.map((filament) => (
                          <option key={filament.publicId} value={filament.publicId}>
                            {filament.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onSlantOrder}
                    disabled={slantOrderLoading || !quoteReady}
                    className={`mt-2 w-full rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                      slantOrderLoading || !quoteReady
                        ? "cursor-not-allowed bg-slate-200 text-slate-400"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {slantOrderLoading ? "Redirecting to payment…" : "Pay & Place Order"}
                  </button>
                  {!quoteReady && (
                    <p className="text-[11px] text-zinc-500">
                      Get a quote first to enable ordering.
                    </p>
                  )}
                  {slantOrderError && (
                    <p className="text-[11px] font-semibold text-rose-600">
                      {slantOrderError}
                    </p>
                  )}
                  {slantOrder && (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Order processed successfully.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <span>Progress</span>
                    <span>{progressValue}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-zinc-300 bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>
                {downloadUrl && isMeshyReady ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-400"
                    >
                      Download GLB
                    </a>
                    {meshyStlUrl ? (
                      <a
                        href={meshyStlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-slate-900 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
                      >
                        Download STL
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {isMeshyReady ? (
                  meshyStlUrl ? (
                    <p className="text-[11px] font-semibold text-emerald-600">
                      STL ready for printing.
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      STL not ready yet.
                    </p>
                  )
                ) : null}
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
