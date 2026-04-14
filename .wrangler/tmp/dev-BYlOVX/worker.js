var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// watchyourtemper-site/src/worker.ts
var PRINTFUL_API_BASE = "https://api.printful.com";
var STRIPE_API_BASE = "https://api.stripe.com/v1";
var REQUEST_TIMEOUT_MS = 8e3;
var ORDER_STORE_NAME = "watchyourtemper-order-store";
var encoder = new TextEncoder();
var DEFAULT_COUNTRY = "US";
var FALLBACK_CURRENCY = "USD";
var SHIPPING_COUNTRY_ALLOWLIST = [
  "US",
  "CA",
  "GB",
  "DE",
  "FR",
  "NL",
  "AU",
  "IE",
  "BE",
  "SE",
  "DK",
  "NZ",
  "ES",
  "IT"
];
var AVAILABLE_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD"];
var COUNTRY_TO_CURRENCY = {
  AU: "AUD",
  CA: "CAD",
  GB: "GBP",
  IE: "EUR",
  ES: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  NL: "EUR",
  PT: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  LV: "EUR",
  LT: "EUR",
  EE: "EUR",
  NZ: "NZD",
  US: "USD"
};
var statusRank = {
  requires_payment: 0,
  paid: 1,
  order_created: 2,
  in_production: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
  refunded: 7
};
var corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,stripe-signature,x-printful-signature,x-printful-webhook-signature"
};
var json = /* @__PURE__ */ __name((data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    "content-type": "application/json",
    ...corsHeaders,
    ...init.headers || {}
  }
}), "json");
var badRequest = /* @__PURE__ */ __name((message, status = 400) => json({ error: message }, { status }), "badRequest");
var nowIso = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
var safeJsonParse = /* @__PURE__ */ __name((rawBody) => {
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}, "safeJsonParse");
var parseVariantName = /* @__PURE__ */ __name((name) => {
  const parts = name.split("/").map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { color: parts[0], size: parts[parts.length - 1] };
  }
  return { color: "Default", size: name || "Default" };
}, "parseVariantName");
var normalizeProductSlug = /* @__PURE__ */ __name((title, id) => {
  const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  return base || `product-${id}`;
}, "normalizeProductSlug");
var PRODUCT_DESCRIPTIONS = {
  "limited-edition-pressure-test-v10-tee": "100% cotton T-shirt printed with Pressure Test v1.0 design.",
  "pressure-test-hoodie": "Medium weight cotton hoodie printed with Pressure Test v1.0 design.",
  "watchyourtemper-tee": "100% cotton T-shirt featuring the essential watchyourtemper project mark.",
  "watchyourtemper-tote": "100% certified organic cotton tote, to help carry your burdens."
};
var getProductDescription = /* @__PURE__ */ __name((title, slug) => {
  if (PRODUCT_DESCRIPTIONS[slug]) {
    return PRODUCT_DESCRIPTIONS[slug];
  }
  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes("hoodie")) {
    return PRODUCT_DESCRIPTIONS["pressure-test-hoodie"];
  }
  if (normalizedTitle.includes("tote")) {
    return PRODUCT_DESCRIPTIONS["watchyourtemper-tote"];
  }
  if (normalizedTitle.includes("pressure test")) {
    return PRODUCT_DESCRIPTIONS["pressure-test-tee"];
  }
  if (normalizedTitle.includes("tee") || normalizedTitle.includes("shirt")) {
    return PRODUCT_DESCRIPTIONS["watchyourtemper-tee"];
  }
  return "watchyourtemper merch item.";
}, "getProductDescription");
var normalizeStoreProduct = /* @__PURE__ */ __name((payload) => {
  const syncProduct = payload.sync_product;
  const syncVariants = Array.isArray(payload.sync_variants) ? payload.sync_variants : [];
  const slug = normalizeProductSlug(syncProduct.name, syncProduct.id);
  return {
    id: String(syncProduct.id),
    slug,
    title: syncProduct.name,
    description: getProductDescription(syncProduct.name, slug),
    image: syncProduct.thumbnail_url || "",
    variants: syncVariants.map((variant) => {
      const parsed = parseVariantName(variant.name || "");
      const retailPrice = Number.parseFloat(variant.retail_price);
      return {
        id: String(variant.id),
        name: variant.name || "Default",
        size: parsed.size,
        color: parsed.color,
        basePrice: Number.isFinite(retailPrice) ? retailPrice : 0,
        baseCurrency: variant.currency || "USD",
        price: Number.isFinite(retailPrice) ? retailPrice : 0,
        currency: variant.currency || "USD",
        availability: !variant.is_ignored && variant.availability_status !== "discontinued"
      };
    })
  };
}, "normalizeStoreProduct");
var getRequiredEnv = /* @__PURE__ */ __name((env, name) => {
  const value = env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${String(name)} environment variable.`);
  }
  return value.trim();
}, "getRequiredEnv");
var getOptionalEnv = /* @__PURE__ */ __name((env, name) => {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}, "getOptionalEnv");
var sanitizeQuantity = /* @__PURE__ */ __name((value) => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error("Each item quantity must be an integer between 1 and 20.");
  }
  return quantity;
}, "sanitizeQuantity");
var parseCartItems = /* @__PURE__ */ __name((body) => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items must contain at least one cart line.");
  }
  const parsed = items.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Each item must be an object.");
    }
    const candidate = item;
    if (!candidate.productId || typeof candidate.productId !== "string") {
      throw new Error("items[].productId is required.");
    }
    if (!candidate.variantId || typeof candidate.variantId !== "string") {
      throw new Error("items[].variantId is required.");
    }
    return {
      productId: candidate.productId,
      variantId: candidate.variantId,
      quantity: sanitizeQuantity(candidate.quantity)
    };
  });
  const totalQuantity = parsed.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 50) {
    throw new Error("Combined cart quantity cannot exceed 50 items.");
  }
  return parsed;
}, "parseCartItems");
var parseShippingAddress = /* @__PURE__ */ __name((value) => {
  if (!value || typeof value !== "object") {
    throw new Error("shippingAddress is required.");
  }
  const shipping = value;
  const requiredFields = ["name", "line1", "city", "state", "postalCode", "country"];
  for (const field of requiredFields) {
    const fieldValue = shipping[field];
    if (!fieldValue || typeof fieldValue !== "string") {
      throw new Error(`shippingAddress.${field} is required.`);
    }
  }
  const country = shipping.country.toUpperCase();
  if (!isCountryAllowed(country)) {
    throw new Error(`Shipping is not available yet for ${country}.`);
  }
  return {
    name: shipping.name,
    line1: shipping.line1,
    line2: typeof shipping.line2 === "string" ? shipping.line2 : void 0,
    city: shipping.city,
    state: shipping.state,
    postalCode: shipping.postalCode,
    country
  };
}, "parseShippingAddress");
var parseCheckoutStartInput = /* @__PURE__ */ __name((body) => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }
  const parsed = body;
  if (!parsed.customer?.email || typeof parsed.customer.email !== "string") {
    throw new Error("customer.email is required.");
  }
  return {
    items: parseCartItems(body),
    customer: {
      email: parsed.customer.email.trim()
    },
    shippingAddress: parseShippingAddress(parsed.shippingAddress),
    shippingRateId: typeof parsed.shippingRateId === "string" ? parsed.shippingRateId.trim() : void 0
  };
}, "parseCheckoutStartInput");
var parseCheckoutIntentInput = /* @__PURE__ */ __name((body) => ({ items: parseCartItems(body) }), "parseCheckoutIntentInput");
var parseShippingQuoteInput = /* @__PURE__ */ __name((body) => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }
  const parsed = body;
  if (!parsed.recipient || typeof parsed.recipient !== "object") {
    throw new Error("recipient is required.");
  }
  const country = typeof parsed.recipient.country === "string" ? parsed.recipient.country.trim().toUpperCase() : "";
  const state = typeof parsed.recipient.state === "string" ? parsed.recipient.state.trim().toUpperCase() : "";
  if (!country) {
    throw new Error("recipient.country is required.");
  }
  if (!isCountryAllowed(country)) {
    throw new Error(`Shipping is not available yet for ${country}.`);
  }
  if (["US", "CA", "AU"].includes(country) && !state) {
    throw new Error(`recipient.state is required for ${country}.`);
  }
  return {
    items: parseCartItems(body),
    recipient: {
      country,
      state,
      city: typeof parsed.recipient.city === "string" ? parsed.recipient.city.trim() : "",
      postalCode: typeof parsed.recipient.postalCode === "string" ? parsed.recipient.postalCode.trim() : "",
      line1: typeof parsed.recipient.line1 === "string" ? parsed.recipient.line1.trim() : "",
      line2: typeof parsed.recipient.line2 === "string" ? parsed.recipient.line2.trim() : "",
      name: typeof parsed.recipient.name === "string" ? parsed.recipient.name.trim() : ""
    },
    currency: typeof parsed.currency === "string" && AVAILABLE_CURRENCIES.includes(parsed.currency.trim().toUpperCase()) ? parsed.currency.trim().toUpperCase() : FALLBACK_CURRENCY,
    shippingRateId: typeof parsed.shippingRateId === "string" ? parsed.shippingRateId.trim() : void 0
  };
}, "parseShippingQuoteInput");
var toHex = /* @__PURE__ */ __name((buffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join(""), "toHex");
var signHmacSha256Hex = /* @__PURE__ */ __name(async (secret, payload) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}, "signHmacSha256Hex");
var sha256Hex = /* @__PURE__ */ __name(async (payload) => toHex(await crypto.subtle.digest("SHA-256", encoder.encode(payload))), "sha256Hex");
var timingSafeEqual = /* @__PURE__ */ __name((left, right) => {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}, "timingSafeEqual");
var parseAmount = /* @__PURE__ */ __name((value) => {
  const amount = Number.parseFloat(value || "0");
  return Number.isFinite(amount) ? amount : 0;
}, "parseAmount");
var toMoney = /* @__PURE__ */ __name((value) => Number(value.toFixed(2)), "toMoney");
var getPrintfulHeaders = /* @__PURE__ */ __name((env) => {
  const headers = {
    Authorization: `Bearer ${getRequiredEnv(env, "PRINTFUL_TOKEN")}`,
    "Content-Type": "application/json"
  };
  if (env.PRINTFUL_STORE_ID?.trim()) {
    headers["X-PF-Store-Id"] = env.PRINTFUL_STORE_ID.trim();
  }
  return headers;
}, "getPrintfulHeaders");
var defaultCurrencyForCountry = /* @__PURE__ */ __name((countryCode) => countryCode && COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || FALLBACK_CURRENCY, "defaultCurrencyForCountry");
var getProductCollectionBaseCurrency = /* @__PURE__ */ __name((products) => products.flatMap((product) => product.variants.map((variant) => variant.baseCurrency || variant.currency))[0] || FALLBACK_CURRENCY, "getProductCollectionBaseCurrency");
var detectCountryFromRequest = /* @__PURE__ */ __name((request) => {
  const requestWithCf = request;
  const cfCountry = requestWithCf.cf?.country?.trim().toUpperCase();
  if (cfCountry) {
    return cfCountry;
  }
  const headerCountry = request.headers.get("cf-ipcountry")?.trim().toUpperCase();
  if (headerCountry) {
    return headerCountry;
  }
  const acceptLanguage = request.headers.get("accept-language") || "";
  const regionMatch = acceptLanguage.match(/[-_](\w{2})(?:,|;|$)/);
  if (regionMatch?.[1]) {
    return regionMatch[1].toUpperCase();
  }
  return DEFAULT_COUNTRY;
}, "detectCountryFromRequest");
var normalizePrintfulCountry = /* @__PURE__ */ __name((country) => {
  const codeCandidate = typeof country.code === "string" ? country.code.trim() : "";
  const nameCandidate = typeof country.name === "string" ? country.name.trim() : "";
  const code = codeCandidate.length === 2 ? codeCandidate.toUpperCase() : nameCandidate.length === 2 ? nameCandidate.toUpperCase() : "";
  const name = codeCandidate.length === 2 ? nameCandidate : nameCandidate.length === 2 ? codeCandidate : nameCandidate;
  if (!code || !name) {
    return null;
  }
  return {
    code,
    name,
    region: country.region
  };
}, "normalizePrintfulCountry");
var isCountryAllowed = /* @__PURE__ */ __name((countryCode) => SHIPPING_COUNTRY_ALLOWLIST.includes(countryCode.toUpperCase()), "isCountryAllowed");
var printfulRequest = /* @__PURE__ */ __name(async (env, input) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${PRINTFUL_API_BASE}${input.path}`, {
      method: input.method || "GET",
      headers: getPrintfulHeaders(env),
      body: input.body ? JSON.stringify(input.body) : void 0,
      signal: controller.signal
    });
    const payload = await response.json();
    if (!response.ok || payload.code !== 200) {
      const reason = payload.error?.reason || payload.error?.message || `HTTP ${response.status}`;
      throw new Error(`Printful request failed: ${reason}`);
    }
    return payload.result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Printful request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}, "printfulRequest");
var getPrintfulCountries = /* @__PURE__ */ __name(async (env) => {
  const countries = await printfulRequest(env, { path: "/countries" });
  return countries.map(normalizePrintfulCountry).filter((country) => Boolean(country)).filter((country) => isCountryAllowed(country.code)).sort((left, right) => left.name.localeCompare(right.name));
}, "getPrintfulCountries");
var getExchangeRates = /* @__PURE__ */ __name(async (baseCurrency, currencies) => {
  const normalizedBase = baseCurrency.toUpperCase();
  const targets = currencies.filter((currency) => currency !== normalizedBase);
  const fallback = Object.fromEntries(currencies.map((currency) => [currency, currency === normalizedBase ? 1 : 0]));
  if (!targets.length) {
    return fallback;
  }
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(normalizedBase)}&to=${encodeURIComponent(targets.join(","))}`
    );
    if (!response.ok) {
      throw new Error(`Exchange rate request failed with HTTP ${response.status}`);
    }
    const payload = await response.json();
    return {
      ...fallback,
      ...payload.rates || {},
      [normalizedBase]: 1
    };
  } catch (error) {
    console.warn("[fx] failed to load live exchange rates", error);
    return fallback;
  }
}, "getExchangeRates");
var convertAmount = /* @__PURE__ */ __name((amount, sourceCurrency, targetCurrency, exchangeRates) => {
  const normalizedSource = sourceCurrency.toUpperCase();
  const normalizedTarget = targetCurrency.toUpperCase();
  if (normalizedSource === normalizedTarget) {
    return toMoney(amount);
  }
  const rate = exchangeRates[normalizedTarget];
  if (!rate) {
    return toMoney(amount);
  }
  return toMoney(amount * rate);
}, "convertAmount");
var getStoreProducts = /* @__PURE__ */ __name(async (env, targetCurrency) => {
  const summaries = await printfulRequest(env, { path: "/store/products" });
  const detailedProducts = await Promise.all(
    summaries.filter((item) => !item.is_ignored).map(async (item) => {
      try {
        const detail = await printfulRequest(env, { path: `/store/products/${item.id}` });
        return normalizeStoreProduct(detail);
      } catch (error) {
        console.error("[printful] failed to load product detail", item.id, error);
        return null;
      }
    })
  );
  const products = detailedProducts.filter((item) => Boolean(item)).filter((item) => item.variants.length > 0);
  const normalizedTargetCurrency = targetCurrency?.toUpperCase();
  const sourceCurrency = getProductCollectionBaseCurrency(products);
  if (!normalizedTargetCurrency || normalizedTargetCurrency === sourceCurrency) {
    return products;
  }
  const exchangeRates = await getExchangeRates(sourceCurrency, AVAILABLE_CURRENCIES);
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: convertAmount(variant.basePrice, variant.baseCurrency, normalizedTargetCurrency, exchangeRates),
      currency: normalizedTargetCurrency
    }))
  }));
}, "getStoreProducts");
var getStoreProductByIdOrSlug = /* @__PURE__ */ __name(async (env, idOrSlug, targetCurrency) => {
  if (/^\d+$/.test(idOrSlug)) {
    try {
      const detail = await printfulRequest(env, { path: `/store/products/${idOrSlug}` });
      const product = normalizeStoreProduct(detail);
      const sourceCurrency = product.variants[0]?.baseCurrency || FALLBACK_CURRENCY;
      if (!targetCurrency || targetCurrency.toUpperCase() === sourceCurrency) {
        return product;
      }
      const exchangeRates = await getExchangeRates(sourceCurrency, AVAILABLE_CURRENCIES);
      return {
        ...product,
        variants: product.variants.map((variant) => ({
          ...variant,
          price: convertAmount(variant.basePrice, variant.baseCurrency, targetCurrency, exchangeRates),
          currency: targetCurrency.toUpperCase()
        }))
      };
    } catch {
    }
  }
  const products = await getStoreProducts(env, targetCurrency);
  return products.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null;
}, "getStoreProductByIdOrSlug");
var validateCartItems = /* @__PURE__ */ __name(async (env, items) => {
  const productCache = /* @__PURE__ */ new Map();
  const loadProduct = /* @__PURE__ */ __name((productId) => {
    const existing = productCache.get(productId);
    if (existing) {
      return existing;
    }
    const next = getStoreProductByIdOrSlug(env, productId);
    productCache.set(productId, next);
    return next;
  }, "loadProduct");
  const validated = await Promise.all(
    items.map(async (item) => {
      const product = await loadProduct(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const variant = product.variants.find((candidate) => candidate.id === item.variantId);
      if (!variant || !variant.availability) {
        throw new Error(`Variant unavailable: ${item.variantId}`);
      }
      const subtotal = Number((variant.price * item.quantity).toFixed(2));
      return {
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        variantId: variant.id,
        variantName: variant.name,
        size: variant.size,
        color: variant.color,
        basePrice: variant.basePrice,
        baseCurrency: variant.baseCurrency,
        unitPrice: variant.price,
        currency: variant.currency,
        quantity: item.quantity,
        subtotal
      };
    })
  );
  const currencies = new Set(validated.map((item) => item.currency));
  if (currencies.size > 1) {
    throw new Error("Cart items must all use the same currency.");
  }
  return validated;
}, "validateCartItems");
var buildCheckoutIntent = /* @__PURE__ */ __name(async (env, input) => {
  const validatedItems = await validateCartItems(env, input.items);
  const subtotal = Number(validatedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const quantity = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    intentId: crypto.randomUUID(),
    status: "requires_payment",
    items: validatedItems,
    totals: {
      currency: validatedItems[0]?.currency || "USD",
      subtotal,
      quantity
    },
    message: "Checkout intent created. Attach payment provider next."
  };
}, "buildCheckoutIntent");
var buildCheckoutIdempotencyKey = /* @__PURE__ */ __name(async (input) => {
  const canonicalItems = [...input.items].sort(
    (left, right) => `${left.productId}:${left.variantId}`.localeCompare(`${right.productId}:${right.variantId}`)
  ).map((item) => `${item.productId}:${item.variantId}:${item.quantity}`).join("|");
  const canonicalShipping = [
    input.shippingAddress.name.trim(),
    input.shippingAddress.line1.trim(),
    input.shippingAddress.line2?.trim() || "",
    input.shippingAddress.city.trim(),
    input.shippingAddress.state.trim(),
    input.shippingAddress.postalCode.trim(),
    input.shippingAddress.country.trim().toUpperCase(),
    input.shippingRateId?.trim().toUpperCase() || "STANDARD"
  ].join("|");
  return sha256Hex(`${input.customer.email.trim().toLowerCase()}|${canonicalShipping}|${canonicalItems}`);
}, "buildCheckoutIdempotencyKey");
var buildShippingRecipient = /* @__PURE__ */ __name((recipient) => ({
  name: recipient.name || "",
  address1: recipient.line1 || "",
  address2: recipient.line2 || "",
  city: recipient.city || "",
  state_code: recipient.state || "",
  country_code: recipient.country || "",
  zip: recipient.postalCode || ""
}), "buildShippingRecipient");
var getShippingLocale = /* @__PURE__ */ __name((request) => {
  const acceptLanguage = request.headers.get("accept-language") || "";
  return acceptLanguage.toLowerCase().startsWith("es") ? "es_ES" : "en_US";
}, "getShippingLocale");
var getShippingRates = /* @__PURE__ */ __name(async (env, request, input) => {
  const rates = await printfulRequest(env, {
    path: "/shipping/rates",
    method: "POST",
    body: {
      recipient: buildShippingRecipient(input.recipient),
      items: input.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        value: item.unitPrice.toFixed(2)
      })),
      currency: input.currency,
      locale: getShippingLocale(request)
    }
  });
  return rates.map((rate) => ({
    id: rate.id,
    name: rate.name,
    rate: parseAmount(rate.rate),
    currency: rate.currency || input.currency,
    minDeliveryDays: rate.minDeliveryDays,
    maxDeliveryDays: rate.maxDeliveryDays
  }));
}, "getShippingRates");
var estimateOrderCosts = /* @__PURE__ */ __name(async (env, input) => printfulRequest(env, {
  path: "/orders/estimate-costs",
  method: "POST",
  body: {
    external_id: input.intentId,
    shipping: input.shippingRateId,
    recipient: {
      name: input.recipient.name,
      address1: input.recipient.line1,
      address2: input.recipient.line2,
      city: input.recipient.city,
      state_code: input.recipient.state,
      country_code: input.recipient.country,
      zip: input.recipient.postalCode
    },
    items: input.items.map((item) => ({
      variant_id: Number(item.variantId),
      quantity: item.quantity,
      retail_price: item.unitPrice.toFixed(2)
    }))
  }
}), "estimateOrderCosts");
var buildChargeSummary = /* @__PURE__ */ __name((items, estimate) => {
  const itemSubtotal = toMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
  const shipping = parseAmount(estimate.costs.shipping);
  const tax = parseAmount(estimate.costs.tax);
  const vat = parseAmount(estimate.costs.vat);
  const digitization = parseAmount(estimate.costs.digitization);
  const additionalFee = parseAmount(estimate.costs.additional_fee);
  const fulfillmentFee = parseAmount(estimate.costs.fulfillment_fee);
  const retailDeliveryFee = parseAmount(estimate.costs.retail_delivery_fee);
  return {
    currency: estimate.costs.currency || items[0]?.currency || FALLBACK_CURRENCY,
    itemSubtotal,
    shipping: toMoney(shipping),
    tax: toMoney(tax),
    vat: toMoney(vat),
    digitization: toMoney(digitization),
    additionalFee: toMoney(additionalFee),
    fulfillmentFee: toMoney(fulfillmentFee),
    retailDeliveryFee: toMoney(retailDeliveryFee),
    total: toMoney(itemSubtotal + shipping + tax + vat + digitization + additionalFee + fulfillmentFee + retailDeliveryFee)
  };
}, "buildChargeSummary");
var selectShippingOption = /* @__PURE__ */ __name((options, requestedRateId) => {
  if (!options.length) {
    throw new Error("No shipping options available for this destination.");
  }
  return options.find((option) => option.id === requestedRateId) || options.find((option) => option.id === "STANDARD") || options[0];
}, "selectShippingOption");
var buildStripeCheckoutBody = /* @__PURE__ */ __name((intent, customerEmail, storeBaseUrl, chargeSummary, shippingRateName) => {
  const successUrl = new URL("/store/success", storeBaseUrl);
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  successUrl.searchParams.set("intentId", intent.intentId);
  const cancelUrl = new URL("/store/cancel", storeBaseUrl);
  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    customer_email: customerEmail,
    client_reference_id: intent.intentId,
    "metadata[intentId]": intent.intentId,
    "metadata[itemCount]": String(intent.items.length),
    "metadata[cartQuantity]": String(intent.totals.quantity),
    "metadata[shippingMethod]": shippingRateName
  });
  let nextLineIndex = 0;
  intent.items.forEach((item, index) => {
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
    body.set(`line_items[${index}][price_data][currency]`, chargeSummary.currency.toLowerCase());
    body.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unitPrice * 100)));
    body.set(
      `line_items[${index}][price_data][product_data][name]`,
      `${item.productTitle} - ${item.variantName}`
    );
    nextLineIndex = index + 1;
  });
  const appendExtraLine = /* @__PURE__ */ __name((name, amount) => {
    if (amount <= 0) {
      return;
    }
    body.set(`line_items[${nextLineIndex}][quantity]`, "1");
    body.set(`line_items[${nextLineIndex}][price_data][currency]`, chargeSummary.currency.toLowerCase());
    body.set(`line_items[${nextLineIndex}][price_data][unit_amount]`, String(Math.round(amount * 100)));
    body.set(`line_items[${nextLineIndex}][price_data][product_data][name]`, name);
    nextLineIndex += 1;
  }, "appendExtraLine");
  appendExtraLine(`Shipping - ${shippingRateName}`, chargeSummary.shipping);
  appendExtraLine("Taxes", chargeSummary.tax + chargeSummary.vat);
  appendExtraLine("Fulfillment fees", chargeSummary.digitization + chargeSummary.additionalFee + chargeSummary.fulfillmentFee + chargeSummary.retailDeliveryFee);
  return body;
}, "buildStripeCheckoutBody");
var createStripeCheckoutSession = /* @__PURE__ */ __name(async (env, input) => {
  const secretKey = getRequiredEnv(env, "STRIPE_SECRET_KEY");
  const storeBaseUrl = getRequiredEnv(env, "STORE_BASE_URL");
  const body = buildStripeCheckoutBody(
    input.intent,
    input.customerEmail,
    storeBaseUrl,
    input.chargeSummary,
    input.shippingRateName
  );
  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": input.idempotencyKey
    },
    body
  });
  const payload = await response.json();
  if (!response.ok || !payload.id || !payload.url) {
    throw new Error(payload.error?.message || "Failed to create Stripe checkout session.");
  }
  return {
    provider: "stripe",
    checkoutSessionId: payload.id,
    checkoutUrl: payload.url
  };
}, "createStripeCheckoutSession");
var escapeHtml = /* @__PURE__ */ __name((value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"), "escapeHtml");
var buildOrderConfirmationEmail = /* @__PURE__ */ __name((record) => {
  const total = `${record.chargeSummary.currency} ${record.chargeSummary.total.toFixed(2)}`;
  const lineItemsText = record.items.map(
    (item) => `- ${item.productTitle} - ${item.variantName} x${item.quantity} (${item.currency} ${item.subtotal.toFixed(2)})`
  ).join("\n");
  const lineItemsHtml = record.items.map(
    (item) => `<li>${escapeHtml(item.productTitle)} - ${escapeHtml(item.variantName)} x${item.quantity} (${escapeHtml(
      item.currency
    )} ${item.subtotal.toFixed(2)})</li>`
  ).join("");
  const line2 = record.shipping.line2 ? `${record.shipping.line2}
` : "";
  const printfulReference = record.printfulOrderId || record.printfulExternalId || "Pending";
  const text = [
    `Thanks for your order, ${record.shipping.name}.`,
    "",
    "We have received your payment and successfully created your order with Printful.",
    "",
    `Order reference: ${printfulReference}`,
    "Items:",
    lineItemsText,
    "",
    `Shipping method: ${record.shippingRateName}`,
    `Total charged: ${total}`,
    "",
    "Shipping to:",
    `${record.shipping.name}`,
    `${record.shipping.line1}`,
    `${line2}${record.shipping.city}, ${record.shipping.state} ${record.shipping.postalCode}`,
    `${record.shipping.country}`,
    "",
    "You will receive another email with tracking details once the order ships."
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Order confirmed</h1>
      <p>Thanks for your order, ${escapeHtml(record.shipping.name)}.</p>
      <p>We have received your payment and successfully created your order with Printful.</p>
      <div style="border: 1px solid #ddd; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Order reference:</strong> ${escapeHtml(printfulReference)}</p>
        <p style="margin: 0 0 8px;"><strong>Items:</strong></p>
        <ul style="margin: 0 0 8px 20px; padding: 0;">${lineItemsHtml}</ul>
        <p style="margin: 0 0 8px;"><strong>Shipping method:</strong> ${escapeHtml(record.shippingRateName)}</p>
        <p style="margin: 0;"><strong>Total charged:</strong> ${escapeHtml(total)}</p>
      </div>
      <div style="margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Shipping to:</strong></p>
        <p style="margin: 0;">
          ${escapeHtml(record.shipping.name)}<br />
          ${escapeHtml(record.shipping.line1)}<br />
          ${record.shipping.line2 ? `${escapeHtml(record.shipping.line2)}<br />` : ""}
          ${escapeHtml(record.shipping.city)}, ${escapeHtml(record.shipping.state)} ${escapeHtml(
    record.shipping.postalCode
  )}<br />
          ${escapeHtml(record.shipping.country)}
        </p>
      </div>
      <p>You will receive another email with tracking details once the order ships.</p>
    </div>
  `.trim();
  return {
    subject: record.items.length === 1 ? `watchyourtemper order confirmed - ${record.items[0].productTitle}` : `watchyourtemper order confirmed - ${record.items.length} items`,
    text,
    html
  };
}, "buildOrderConfirmationEmail");
var sendOrderConfirmationEmail = /* @__PURE__ */ __name(async (env, record) => {
  const provider = getOptionalEnv(env, "EMAIL_PROVIDER") || "resend";
  if (provider !== "resend") {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }
  const apiKey = getOptionalEnv(env, "RESEND_API_KEY");
  const from = getOptionalEnv(env, "ORDER_CONFIRMATION_FROM_EMAIL");
  if (!apiKey || !from) {
    return { sent: false, reason: "missing_config" };
  }
  const email = buildOrderConfirmationEmail(record);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [record.customerEmail],
      subject: email.subject,
      text: email.text,
      html: email.html
    })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Email request failed with HTTP ${response.status}`);
  }
  return { sent: true };
}, "sendOrderConfirmationEmail");
var resolveNextStatus = /* @__PURE__ */ __name((current, next) => {
  if (!next) {
    return current;
  }
  if (next === "cancelled" || next === "refunded") {
    return next;
  }
  return statusRank[next] >= statusRank[current] ? next : current;
}, "resolveNextStatus");
var verifyStripeSignature = /* @__PURE__ */ __name(async (env, rawBody, signatureHeader) => {
  const secret = getRequiredEnv(env, "STRIPE_WEBHOOK_SECRET");
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header.");
  }
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signature = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature) {
    throw new Error("Malformed Stripe-Signature header.");
  }
  const expected = await signHmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  if (!timingSafeEqual(signature, expected)) {
    throw new Error("Invalid Stripe webhook signature.");
  }
}, "verifyStripeSignature");
var verifyPrintfulWebhook = /* @__PURE__ */ __name(async (env, rawBody, signatureHeader, authorizationHeader) => {
  const secret = getRequiredEnv(env, "PRINTFUL_WEBHOOK_SECRET");
  if (signatureHeader) {
    const expected = await signHmacSha256Hex(secret, rawBody);
    if (timingSafeEqual(signatureHeader, expected)) {
      return;
    }
  }
  if (authorizationHeader === `Bearer ${secret}`) {
    return;
  }
  throw new Error("Invalid Printful webhook signature/token.");
}, "verifyPrintfulWebhook");
var toStatusFromPrintful = /* @__PURE__ */ __name((status) => {
  switch (status) {
    case "fulfilled":
      return "delivered";
    case "shipped":
      return "shipped";
    case "inprocess":
      return "in_production";
    case "canceled":
      return "cancelled";
    default:
      return void 0;
  }
}, "toStatusFromPrintful");
var buildPrintfulWebhookEventId = /* @__PURE__ */ __name(async (rawBody) => sha256Hex(rawBody), "buildPrintfulWebhookEventId");
var getOrderStoreStub = /* @__PURE__ */ __name((env) => {
  const id = env.ORDER_STORE.idFromName(ORDER_STORE_NAME);
  return env.ORDER_STORE.get(id);
}, "getOrderStoreStub");
var orderStoreRequest = /* @__PURE__ */ __name(async (env, path, init) => {
  const stub = getOrderStoreStub(env);
  const response = await stub.fetch(new Request(`https://order-store${path}`, init));
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Order store request failed.");
  }
  return payload;
}, "orderStoreRequest");
var getRecordById = /* @__PURE__ */ __name(async (env, intentId) => orderStoreRequest(env, `/records/by-intent/${encodeURIComponent(intentId)}`).then(
  (payload) => payload.record
), "getRecordById");
var getRecordByPaymentReference = /* @__PURE__ */ __name(async (env, paymentReferenceId) => orderStoreRequest(
  env,
  `/records/by-payment/${encodeURIComponent(paymentReferenceId)}`
).then((payload) => payload.record), "getRecordByPaymentReference");
var getRecordByIdempotencyKey = /* @__PURE__ */ __name(async (env, idempotencyKey) => orderStoreRequest(
  env,
  `/records/by-idempotency/${encodeURIComponent(idempotencyKey)}`
).then((payload) => payload.record), "getRecordByIdempotencyKey");
var createCheckoutIntentRecord = /* @__PURE__ */ __name(async (env, record) => orderStoreRequest(env, "/records", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ record })
}).then((payload) => payload.record), "createCheckoutIntentRecord");
var updateCheckoutIntent = /* @__PURE__ */ __name(async (env, intentId, patch) => orderStoreRequest(env, `/records/${encodeURIComponent(intentId)}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ patch })
}).then((payload) => payload.record), "updateCheckoutIntent");
var startWebhookEvent = /* @__PURE__ */ __name(async (env, eventId) => orderStoreRequest(env, "/events/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId })
}), "startWebhookEvent");
var finishWebhookEvent = /* @__PURE__ */ __name(async (env, eventId) => orderStoreRequest(env, "/events/finish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId })
}), "finishWebhookEvent");
var releaseWebhookEvent = /* @__PURE__ */ __name(async (env, eventId) => orderStoreRequest(env, "/events/release", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId })
}), "releaseWebhookEvent");
var createPrintfulOrder = /* @__PURE__ */ __name(async (env, input) => {
  if (!input.items.length) {
    throw new Error("Printful order requires at least one item.");
  }
  return printfulRequest(env, {
    path: "/orders",
    method: "POST",
    body: {
      external_id: input.externalId,
      shipping: input.shipping,
      recipient: input.recipient,
      items: input.items,
      confirm: true
    }
  });
}, "createPrintfulOrder");
var handleCheckoutIntent = /* @__PURE__ */ __name(async (request, env) => {
  const body = safeJsonParse(await request.text());
  const input = parseCheckoutIntentInput(body);
  const intent = await buildCheckoutIntent(env, input);
  return json({ intent });
}, "handleCheckoutIntent");
var handleStorePreferences = /* @__PURE__ */ __name(async (request, env) => {
  const detectedCountry = detectCountryFromRequest(request);
  const countries = await getPrintfulCountries(env);
  const baseProducts = await getStoreProducts(env);
  const baseCurrency = getProductCollectionBaseCurrency(baseProducts);
  const exchangeRates = await getExchangeRates(baseCurrency, AVAILABLE_CURRENCIES);
  return json({
    detectedCountry,
    defaultCurrency: defaultCurrencyForCountry(detectedCountry),
    countries,
    currencies: AVAILABLE_CURRENCIES,
    exchangeRates,
    baseCurrency
  });
}, "handleStorePreferences");
var buildShippingQuoteResponse = /* @__PURE__ */ __name(async (request, env, input) => {
  const validatedItems = await validateCartItems(env, input.items);
  const shippingOptions = await getShippingRates(env, request, {
    items: validatedItems,
    recipient: input.recipient,
    currency: input.currency
  });
  const selectedShipping = selectShippingOption(shippingOptions, input.shippingRateId);
  const estimate = await estimateOrderCosts(env, {
    intentId: input.intentId || crypto.randomUUID(),
    items: validatedItems,
    shippingRateId: selectedShipping.id,
    recipient: {
      name: input.recipient.name || "Customer",
      line1: input.recipient.line1 || "Pending address",
      line2: input.recipient.line2,
      city: input.recipient.city || "Pending city",
      state: input.recipient.state,
      postalCode: input.recipient.postalCode || "00000",
      country: input.recipient.country
    }
  });
  const chargeSummary = buildChargeSummary(validatedItems, estimate);
  return {
    selectedShippingRateId: selectedShipping.id,
    shippingOptions,
    chargeSummary
  };
}, "buildShippingQuoteResponse");
var handleShippingQuote = /* @__PURE__ */ __name(async (request, env) => {
  const body = safeJsonParse(await request.text());
  const input = parseShippingQuoteInput(body);
  return json(
    await buildShippingQuoteResponse(request, env, {
      items: input.items,
      recipient: input.recipient,
      currency: input.currency,
      shippingRateId: input.shippingRateId
    })
  );
}, "handleShippingQuote");
var handleCheckoutStart = /* @__PURE__ */ __name(async (request, env) => {
  const body = safeJsonParse(await request.text());
  const input = parseCheckoutStartInput(body);
  const idempotencyKey = await buildCheckoutIdempotencyKey(input);
  const existing = await getRecordByIdempotencyKey(env, idempotencyKey);
  if (existing) {
    return json({
      intent: {
        intentId: existing.intentId,
        status: existing.status,
        items: existing.items,
        totals: existing.totals,
        shippingRateId: existing.shippingRateId,
        chargeSummary: existing.chargeSummary,
        message: "Reused existing checkout session."
      },
      payment: {
        provider: existing.paymentProvider,
        checkoutSessionId: existing.paymentReferenceId,
        checkoutUrl: existing.paymentCheckoutUrl
      },
      reused: true
    });
  }
  const intent = await buildCheckoutIntent(env, { items: input.items });
  const shippingQuote = await buildShippingQuoteResponse(request, env, {
    items: input.items,
    recipient: input.shippingAddress,
    currency: intent.totals.currency,
    shippingRateId: input.shippingRateId,
    intentId: intent.intentId
  });
  const payment = await createStripeCheckoutSession(env, {
    intent,
    customerEmail: input.customer.email,
    idempotencyKey,
    chargeSummary: shippingQuote.chargeSummary,
    shippingRateName: shippingQuote.shippingOptions.find((option) => option.id === shippingQuote.selectedShippingRateId)?.name || shippingQuote.selectedShippingRateId
  });
  const createdAt = nowIso();
  const record = await createCheckoutIntentRecord(env, {
    intentId: intent.intentId,
    status: "requires_payment",
    items: intent.items,
    totals: intent.totals,
    shipping: input.shippingAddress,
    customerEmail: input.customer.email,
    paymentProvider: payment.provider,
    paymentReferenceId: payment.checkoutSessionId,
    paymentCheckoutUrl: payment.checkoutUrl,
    idempotencyKey,
    shippingRateId: shippingQuote.selectedShippingRateId,
    shippingRateName: shippingQuote.shippingOptions.find((option) => option.id === shippingQuote.selectedShippingRateId)?.name || shippingQuote.selectedShippingRateId,
    chargeSummary: shippingQuote.chargeSummary,
    createdAt,
    updatedAt: createdAt
  });
  return json({
    intent: {
      intentId: record.intentId,
      status: record.status,
      items: record.items,
      totals: record.totals,
      shippingRateId: record.shippingRateId,
      chargeSummary: record.chargeSummary,
      message: "Checkout session created."
    },
    payment
  });
}, "handleCheckoutStart");
var handlePaymentWebhook = /* @__PURE__ */ __name(async (request, env) => {
  const rawBody = await request.text();
  await verifyStripeSignature(env, rawBody, request.headers.get("stripe-signature") || void 0);
  const event = safeJsonParse(rawBody);
  if (!event.id) {
    throw new Error("Missing Stripe event id.");
  }
  const eventKey = `stripe:${event.id}`;
  const eventLease = await startWebhookEvent(env, eventKey);
  if (!eventLease.acquired) {
    return json({ ok: true, duplicate: true });
  }
  try {
    if (event.type !== "checkout.session.completed") {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true });
    }
    const object = event.data?.object;
    const intentId = object?.metadata?.intentId;
    const paymentReferenceId = object?.id;
    const record = (intentId ? await getRecordById(env, intentId) : null) || (paymentReferenceId ? await getRecordByPaymentReference(env, paymentReferenceId) : null);
    if (!record) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: "intent_not_found" });
    }
    if (record.status === "order_created" || record.status === "in_production" || record.status === "shipped" || record.status === "delivered") {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, duplicate: true });
    }
    if (record.status === "requires_payment") {
      await updateCheckoutIntent(env, record.intentId, { status: "paid" });
    }
    const printfulOrder = await createPrintfulOrder(env, {
      externalId: record.intentId,
      shipping: record.shippingRateId,
      recipient: {
        name: record.shipping.name,
        address1: record.shipping.line1,
        address2: record.shipping.line2,
        city: record.shipping.city,
        state_code: record.shipping.state,
        zip: record.shipping.postalCode,
        country_code: record.shipping.country,
        email: record.customerEmail
      },
      items: record.items.map((item) => ({
        variant_id: Number(item.variantId),
        quantity: item.quantity
      }))
    });
    const updatedRecord = await updateCheckoutIntent(env, record.intentId, {
      status: "order_created",
      printfulOrderId: String(printfulOrder.id),
      printfulExternalId: printfulOrder.external_id || record.intentId,
      fulfillmentStatus: printfulOrder.status || "draft"
    });
    if (updatedRecord) {
      try {
        const emailResult = await sendOrderConfirmationEmail(env, updatedRecord);
        if (!emailResult.sent) {
          console.warn("[email] order confirmation skipped", {
            intentId: updatedRecord.intentId,
            reason: emailResult.reason
          });
        }
      } catch (error) {
        console.error("[email] failed to send order confirmation", {
          intentId: updatedRecord.intentId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    await finishWebhookEvent(env, eventKey);
    return json({ ok: true });
  } catch (error) {
    await releaseWebhookEvent(env, eventKey);
    throw error;
  }
}, "handlePaymentWebhook");
var handlePrintfulWebhook = /* @__PURE__ */ __name(async (request, env) => {
  const rawBody = await request.text();
  await verifyPrintfulWebhook(
    env,
    rawBody,
    request.headers.get("x-printful-signature") || request.headers.get("x-printful-webhook-signature") || void 0,
    request.headers.get("authorization") || void 0
  );
  const eventKey = `printful:${await buildPrintfulWebhookEventId(rawBody)}`;
  const eventLease = await startWebhookEvent(env, eventKey);
  if (!eventLease.acquired) {
    return json({ ok: true, duplicate: true });
  }
  try {
    const event = safeJsonParse(rawBody);
    const payload = event.data || event;
    const externalId = payload.order?.external_id;
    if (!externalId) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: "external_id_missing" });
    }
    const record = await getRecordById(env, externalId);
    if (!record) {
      await finishWebhookEvent(env, eventKey);
      return json({ ok: true, ignored: true, reason: "intent_not_found" });
    }
    const nextStatus = toStatusFromPrintful(payload.order?.status);
    await updateCheckoutIntent(env, record.intentId, {
      status: resolveNextStatus(record.status, nextStatus),
      fulfillmentStatus: payload.order?.status || record.fulfillmentStatus,
      trackingNumber: payload.shipment?.tracking_number || record.trackingNumber,
      trackingUrl: payload.shipment?.tracking_url || record.trackingUrl,
      carrier: payload.shipment?.carrier || record.carrier
    });
    await finishWebhookEvent(env, eventKey);
    return json({ ok: true });
  } catch (error) {
    await releaseWebhookEvent(env, eventKey);
    throw error;
  }
}, "handlePrintfulWebhook");
var handleApiRequest = /* @__PURE__ */ __name(async (request, env) => {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true, storage: "durable-object" });
  }
  if (request.method === "GET" && url.pathname === "/api/store/products") {
    const currency = url.searchParams.get("currency") || void 0;
    const products = await getStoreProducts(env, currency);
    return json({ products });
  }
  if (request.method === "GET" && url.pathname === "/api/store/preferences") {
    return handleStorePreferences(request, env);
  }
  if (request.method === "GET" && url.pathname.startsWith("/api/store/products/")) {
    const idOrSlug = decodeURIComponent(url.pathname.replace("/api/store/products/", ""));
    const currency = url.searchParams.get("currency") || void 0;
    const product = await getStoreProductByIdOrSlug(env, idOrSlug, currency);
    if (!product) {
      return badRequest("Product not found.", 404);
    }
    return json({ product });
  }
  if (request.method === "POST" && url.pathname === "/api/store/checkout-intent") {
    return handleCheckoutIntent(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/store/shipping-quote") {
    return handleShippingQuote(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/store/checkout-start") {
    return handleCheckoutStart(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/webhooks/payment") {
    return handlePaymentWebhook(request, env);
  }
  if (request.method === "POST" && url.pathname === "/api/webhooks/printful") {
    return handlePrintfulWebhook(request, env);
  }
  return badRequest("Not found.", 404);
}, "handleApiRequest");
var OrderStoreDurableObject = class {
  static {
    __name(this, "OrderStoreDurableObject");
  }
  state;
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "POST" && path === "/records") {
      const payload = safeJsonParse(await request.text());
      if (!payload.record) {
        return badRequest("record is required.");
      }
      const existingIntentId = await this.state.storage.get(`idempotency:${payload.record.idempotencyKey}`);
      if (existingIntentId) {
        const existing = await this.state.storage.get(`intent:${existingIntentId}`);
        if (existing) {
          return json({ record: existing });
        }
      }
      await this.state.storage.put(`intent:${payload.record.intentId}`, payload.record);
      await this.state.storage.put(`payment:${payload.record.paymentReferenceId}`, payload.record.intentId);
      await this.state.storage.put(`idempotency:${payload.record.idempotencyKey}`, payload.record.intentId);
      return json({ record: payload.record });
    }
    if (request.method === "GET" && path.startsWith("/records/by-intent/")) {
      const intentId = decodeURIComponent(path.replace("/records/by-intent/", ""));
      const record = await this.state.storage.get(`intent:${intentId}`) || null;
      return json({ record });
    }
    if (request.method === "GET" && path.startsWith("/records/by-payment/")) {
      const paymentReferenceId = decodeURIComponent(path.replace("/records/by-payment/", ""));
      const intentId = await this.state.storage.get(`payment:${paymentReferenceId}`);
      const record = intentId ? await this.state.storage.get(`intent:${intentId}`) : null;
      return json({ record: record || null });
    }
    if (request.method === "GET" && path.startsWith("/records/by-idempotency/")) {
      const idempotencyKey = decodeURIComponent(path.replace("/records/by-idempotency/", ""));
      const intentId = await this.state.storage.get(`idempotency:${idempotencyKey}`);
      const record = intentId ? await this.state.storage.get(`intent:${intentId}`) : null;
      return json({ record: record || null });
    }
    if (request.method === "PUT" && path.startsWith("/records/")) {
      const intentId = decodeURIComponent(path.replace("/records/", ""));
      const existing = await this.state.storage.get(`intent:${intentId}`);
      if (!existing) {
        return json({ record: null });
      }
      const payload = safeJsonParse(await request.text());
      const updated = {
        ...existing,
        ...payload.patch || {},
        intentId: existing.intentId,
        updatedAt: nowIso()
      };
      await this.state.storage.put(`intent:${intentId}`, updated);
      return json({ record: updated });
    }
    if (request.method === "POST" && path === "/events/start") {
      const payload = safeJsonParse(await request.text());
      if (!payload.eventId) {
        return badRequest("eventId is required.");
      }
      const key = `event:${payload.eventId}`;
      const existing = await this.state.storage.get(key);
      if (existing) {
        return json({ acquired: false, state: existing });
      }
      const state = { status: "processing", updatedAt: nowIso() };
      await this.state.storage.put(key, state);
      return json({ acquired: true, state });
    }
    if (request.method === "POST" && path === "/events/finish") {
      const payload = safeJsonParse(await request.text());
      if (!payload.eventId) {
        return badRequest("eventId is required.");
      }
      await this.state.storage.put(`event:${payload.eventId}`, {
        status: "done",
        updatedAt: nowIso()
      });
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "/events/release") {
      const payload = safeJsonParse(await request.text());
      if (!payload.eventId) {
        return badRequest("eventId is required.");
      }
      await this.state.storage.delete(`event:${payload.eventId}`);
      return json({ ok: true });
    }
    return badRequest("Not found.", 404);
  }
};
var handleWorkerError = /* @__PURE__ */ __name((error) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("required") || message.includes("quantity") || message.includes("Invalid") || message.includes("items") || message.includes("Product not found") || message.includes("Variant unavailable") ? 400 : message.includes("not found") ? 404 : 422;
  return json({ error: message }, { status });
}, "handleWorkerError");
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env);
      }
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return badRequest("Not found.", 404);
    } catch (error) {
      return handleWorkerError(error);
    }
  }
};
var __testables = {
  buildChargeSummary,
  buildCheckoutIdempotencyKey,
  defaultCurrencyForCountry,
  buildOrderConfirmationEmail,
  buildPrintfulWebhookEventId,
  buildStripeCheckoutBody,
  getProductDescription,
  normalizeStoreProduct,
  parseCheckoutIntentInput,
  parseCheckoutStartInput,
  parseShippingQuoteInput,
  resolveNextStatus
};

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Ighrtg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Ighrtg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  OrderStoreDurableObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  __testables,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
