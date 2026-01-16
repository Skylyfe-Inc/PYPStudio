import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import config from "../config/config/config";
import state from "../store";

const mode = import.meta.env.MODE || "development";
const API_BASE_URL =
  config[mode]?.backendUrl || config.development.backendUrl;

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const SIZE_TOKENS = [
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "xxs",
  "xxl",
  "xxxl",
];

const COLOR_SWATCHES = {
  black: "#111827",
  white: "#f8fafc",
  gray: "#9ca3af",
  grey: "#9ca3af",
  charcoal: "#374151",
  navy: "#1f2937",
  blue: "#3b82f6",
  red: "#ef4444",
  maroon: "#7f1d1d",
  green: "#22c55e",
  olive: "#4d7c0f",
  yellow: "#facc15",
  orange: "#fb923c",
  pink: "#f472b6",
  purple: "#8b5cf6",
  brown: "#92400e",
  beige: "#f5f5dc",
};

const SERVICE_FEE_CENTS = 1000;

const pickImageUrl = (candidate) => {
  if (!candidate) return "";
  if (typeof candidate === "string") return candidate;
  if (typeof candidate?.src === "string") return candidate.src;
  if (typeof candidate?.url === "string") return candidate.url;
  return "";
};

const resolvePreviewImage = (variant, blueprint) => {
  const matchedImage = Array.isArray(variant?.variantImages)
    ? variant.variantImages.find((image) =>
        Array.isArray(image?.variant_ids)
          ? image.variant_ids.includes(variant?.id)
          : false,
      )
    : null;
  const variantImages = Array.isArray(variant?.images) ? variant.images : [];
  const variantImage =
    pickImageUrl(variant?.image) ||
    pickImageUrl(variant?.preview) ||
    pickImageUrl(variant?.preview_url) ||
    pickImageUrl(matchedImage) ||
    pickImageUrl(variantImages[0]) ||
    pickImageUrl(variantImages.find((img) => img?.is_default));

  if (variantImage) return variantImage;

  const blueprintImages = Array.isArray(blueprint?.images)
    ? blueprint.images
    : [];
  const blueprintImage =
    pickImageUrl(blueprint?.image) ||
    pickImageUrl(blueprint?.preview) ||
    pickImageUrl(blueprint?.preview_url) ||
    pickImageUrl(blueprintImages.find((img) => img?.is_default)) ||
    pickImageUrl(blueprintImages[0]);

  return blueprintImage || "";
};

const buildProviderMeta = (provider) => {
  if (!provider) return null;
  return {
    id: provider.id,
    name:
      provider.title || provider.name || provider.company || `Provider ${provider.id}`,
    logo:
      provider.logo ||
      provider.logo_url ||
      provider.image ||
      provider.icon ||
      provider.avatar ||
      "",
    url:
      provider.website ||
      provider.url ||
      provider.site_url ||
      provider.external_url ||
      provider.home_url ||
      "",
  };
};

const getVariantMeta = (variants) => {
  const sizes = new Set();
  const colors = new Set();
  const prices = [];
  const placeholders = new Set();

  variants.forEach((variant) => {
    if (variant?.options && typeof variant.options === "object") {
      const color = variant.options.color || variant.options.Colour;
      const size = variant.options.size || variant.options.Size;
      if (color) colors.add(String(color));
      if (size) sizes.add(String(size).toUpperCase());
    } else if (Array.isArray(variant?.options)) {
      variant.options.forEach((option) => {
        const raw = String(option || "").trim();
        if (!raw) return;
        const normalized = raw.toLowerCase().replace(/\s+/g, "");
        if (SIZE_TOKENS.includes(normalized)) {
          sizes.add(raw.toUpperCase());
        } else {
          colors.add(raw);
        }
      });
    }
    if (Array.isArray(variant?.placeholders)) {
      variant.placeholders.forEach((placeholder) => {
        if (placeholder?.position) {
          placeholders.add(String(placeholder.position));
        }
      });
    }
    if (typeof variant?.price === "number") {
      prices.push(variant.price);
    }
  });

  const minPrice = prices.length ? Math.min(...prices) + SERVICE_FEE_CENTS : null;
  return {
    sizes: Array.from(sizes),
    colors: Array.from(colors),
    minPrice,
    placeholders: Array.from(placeholders),
  };
};

const PrintifyCatalog = () => {
  const [blueprints, setBlueprints] = useState([]);
  const [providers, setProviders] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantImages, setVariantImages] = useState([]);
  const [blueprintDetail, setBlueprintDetail] = useState(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providerNotice, setProviderNotice] = useState("");
  const blueprintFilterTerms = ["t-shirt", "tee", "hoodie"];
  const navigate = useNavigate();
  const snap = useSnapshot(state);
  const selectedProvider = useMemo(
    () =>
      providers.find(
        (provider) => String(provider.id) === String(selectedProviderId),
      ) || null,
    [providers, selectedProviderId],
  );
  const variantMeta = useMemo(() => getVariantMeta(variants), [variants]);

  const filteredBlueprints = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return blueprints;
    return blueprints.filter((bp) =>
      String(bp?.title || bp?.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [blueprints, filter]);

  useEffect(() => {
    const fetchBlueprints = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/printify/catalog/blueprints`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load blueprints");
        }
        const allBlueprints = normalizeList(data);
        const filtered = allBlueprints.filter((bp) => {
          const title = String(bp?.title || bp?.name || "").toLowerCase();
          return blueprintFilterTerms.some((term) => title.includes(term));
        });
        setBlueprints(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchBlueprints();
  }, []);

  useEffect(() => {
    if (!selectedBlueprintId) {
      setProviders([]);
      setVariants([]);
      setVariantImages([]);
      setSelectedProviderId("");
      setSelectedVariantId("");
      setBlueprintDetail(null);
      setProviderNotice("");
      return;
    }

    const fetchProviders = async () => {
      setLoading(true);
      setError("");
      setProviderNotice("");
      setProviders([]);
      setVariants([]);
      setVariantImages([]);
      setSelectedProviderId("");
      setSelectedVariantId("");
      setBlueprintDetail(null);
      try {
        const [providersResponse, blueprintResponse] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/v1/printify/catalog/blueprints/${selectedBlueprintId}/providers`,
          ),
          fetch(
            `${API_BASE_URL}/api/v1/printify/catalog/blueprints/${selectedBlueprintId}`,
          ),
        ]);

        const providersData = await providersResponse.json();
        if (!providersResponse.ok) {
          throw new Error(
            providersData?.message || "Failed to load providers",
          );
        }
        const providerList = normalizeList(providersData);
        setProviders(providerList);
        setProviderNotice("");

        const blueprintData = await blueprintResponse.json();
        if (blueprintResponse.ok) {
          setBlueprintDetail(blueprintData || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedBlueprintId]);

  useEffect(() => {
    if (!selectedBlueprintId || !selectedProviderId) {
      setVariants([]);
      setVariantImages([]);
      setSelectedVariantId("");
      return;
    }

    const fetchVariants = async () => {
      setLoading(true);
      setError("");
      setVariants([]);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/printify/catalog/blueprints/${selectedBlueprintId}/providers/${selectedProviderId}/variants`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load variants");
        }
        if (Array.isArray(data?.variants)) {
          setVariants(data.variants);
          setVariantImages(Array.isArray(data?.images) ? data.images : []);
        } else {
          setVariants(normalizeList(data));
          setVariantImages([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [selectedBlueprintId, selectedProviderId]);

  useEffect(() => {
    if (!providers.length) return;
    const preferredId = snap.selectedPrintProvider?.id;
    if (!preferredId) return;
    const exists = providers.some((provider) => String(provider.id) === String(preferredId));
    if (exists) {
      setSelectedProviderId(String(preferredId));
    }
  }, [providers, snap.selectedPrintProvider]);

  const handleSelectVariant = (variant) => {
    if (!variant || !selectedBlueprintId || !selectedProviderId) return;
    const blueprintTitle = String(
      blueprintDetail?.title || blueprintDetail?.name || "",
    ).toLowerCase();
    if (blueprintTitle.includes("hoodie")) {
      state.activeModel = "hoodie";
    } else if (blueprintTitle.includes("t-shirt") || blueprintTitle.includes("tee")) {
      state.activeModel = "shirt";
    }
    const basePriceCents =
      typeof variant.price === "number" ? variant.price : null;
    state.selectedPrintifySelection = {
      blueprintId: Number(selectedBlueprintId),
      printProviderId: Number(selectedProviderId),
      variantId: variant.id,
      variantTitle: variant.title || variant.name || `Variant ${variant.id}`,
      blueprintTitle: blueprintDetail?.title || blueprintDetail?.name || "",
      basePriceCents,
      priceCents:
        typeof basePriceCents === "number"
          ? basePriceCents + SERVICE_FEE_CENTS
          : null,
    };
    state.intro = false;
    navigate("/home");
  };

  const handleStartDesigning = () => {
    if (!selectedVariantId) return;
    const variant = variants.find(
      (item) => String(item.id) === String(selectedVariantId),
    );
    if (!variant) return;
    handleSelectVariant(variant);
  };

  const handleProviderChange = (event) => {
    const nextId = event.target.value;
    setSelectedProviderId(nextId);
    const provider = providers.find(
      (item) => String(item.id) === String(nextId),
    );
    const meta = buildProviderMeta(provider);
    if (meta) {
      state.selectedPrintProvider = meta;
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-100 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-900">
            Vendor Browser
          </h1>
          <p className="text-sm text-slate-600">
            Browse blueprints, select a provider, and inspect variants.
          </p>
        </header>

        <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <label className="flex w-full items-center gap-2 rounded-full border-2 border-slate-900 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold uppercase tracking-wide">
                Search
              </span>
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search blueprints"
                className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <span className="text-xs font-semibold text-slate-500">
              {filteredBlueprints.length} blueprints
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          {providerNotice && !error && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {providerNotice}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blueprint
              </label>
              <select
                className="rounded-2xl border-2 border-slate-900 bg-white px-4 py-2 text-sm"
                value={selectedBlueprintId}
                onChange={(event) => setSelectedBlueprintId(event.target.value)}
              >
                <option value="">Select a blueprint</option>
                {filteredBlueprints.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.title || bp.name || `Blueprint ${bp.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Provider
              </label>
              <select
                className="rounded-2xl border-2 border-slate-900 bg-white px-4 py-2 text-sm"
                value={selectedProviderId}
                onChange={handleProviderChange}
                disabled={!providers.length}
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.title || provider.name || `Provider ${provider.id}`}
                  </option>
                ))}
              </select>
              {snap.selectedPrintProvider?.name && (
                <p className="text-xs text-slate-500">
                  Selected vendor: {snap.selectedPrintProvider.name}
                </p>
              )}
              {selectedProviderId && !variants.length && !loading && !error && (
                <p className="text-xs text-amber-600">
                  No variants returned for this provider. Try another provider.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>Variants loaded</span>
              <span className="font-semibold text-slate-900">
                {variants.length}
              </span>
            </div>
          </div>

          {loading && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading…
            </p>
          )}
        </section>

        <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Provider
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedProvider?.title ||
                  selectedProvider?.name ||
                  "Select a provider"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleStartDesigning}
              disabled={!selectedVariantId}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                selectedVariantId
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              Start Designing
            </button>
          </div>

          <div className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Variants
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {variants.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                From price
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {variantMeta.minPrice !== null
                  ? `$${(variantMeta.minPrice / 100).toFixed(2)}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sizes • Colors
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {variantMeta.sizes.length || "—"} •{" "}
                {variantMeta.colors.length || "—"}
              </p>
            </div>
          </div>

          {variantMeta.colors.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {variantMeta.colors.slice(0, 12).map((color) => {
                const normalized = color.toLowerCase();
                const swatch = COLOR_SWATCHES[normalized];
                return (
                  <span
                    key={color}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    {swatch && (
                      <span
                        className="h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: swatch }}
                      />
                    )}
                    {color}
                  </span>
                );
              })}
            </div>
          )}

          {!variants.length ? (
            <p className="mt-3 text-sm text-slate-500">
              Select a blueprint and provider to view variants.
            </p>
          ) : (
            <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {variants.map((variant) => {
                const variantWithImages = {
                  ...variant,
                  variantImages,
                };
                const imageUrl = resolvePreviewImage(
                  variantWithImages,
                  blueprintDetail,
                );
                const optionText = Array.isArray(variant.options)
                  ? variant.options.join(" • ")
                  : variant.options && typeof variant.options === "object"
                    ? Object.entries(variant.options)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" • ")
                    : "";
                const placeholders = Array.isArray(variant.placeholders)
                  ? variant.placeholders
                      .map((item) => {
                        if (!item?.position) return "";
                        const sizeLabel =
                          item?.width && item?.height
                            ? ` (${item.width}x${item.height})`
                            : "";
                        return `${item.position}${sizeLabel}`;
                      })
                      .filter(Boolean)
                  : [];
                const placeholderLabel = placeholders.length
                  ? `Print areas: ${placeholders.join(", ")}`
                  : "";
                const priceCents =
                  typeof variant.price === "number"
                    ? variant.price + SERVICE_FEE_CENTS
                    : null;
                const priceLabel =
                  priceCents !== null ? `$${(priceCents / 100).toFixed(2)}` : "";
                const availability =
                  typeof variant.is_enabled === "boolean"
                    ? variant.is_enabled
                      ? "Available"
                      : "Disabled"
                    : typeof variant.is_available === "boolean"
                      ? variant.is_available
                        ? "Available"
                        : "Unavailable"
                      : "";
                return (
                  <div
                    key={variant.id}
                    className={`rounded-2xl border p-4 text-sm text-slate-700 transition ${
                      selectedVariantId === String(variant.id)
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                    onClick={() => setSelectedVariantId(String(variant.id))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setSelectedVariantId(String(variant.id));
                      }
                    }}
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={variant.title || variant.name || "Variant"}
                        className="mb-3 h-32 w-full rounded-xl border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    )}
                    <p className="font-semibold text-slate-900">
                      {variant.title || variant.name || `Variant ${variant.id}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID: {variant.id}
                    </p>
                    {optionText && (
                      <p className="mt-2 text-xs text-slate-600">{optionText}</p>
                    )}
                    {placeholderLabel && (
                      <p className="mt-2 text-xs text-slate-500">
                        {placeholderLabel}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {priceLabel && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                        {priceLabel}
                      </span>
                    )}
                    {availability && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                        {availability}
                      </span>
                    )}
                    {variant.sku && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                        SKU: {variant.sku}
                      </span>
                    )}
                  </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectVariant(variant);
                      }}
                      className="mt-3 rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
                    >
                      Customize
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PrintifyCatalog;
