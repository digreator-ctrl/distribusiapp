var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
}, "bufferToFormData");

// ../node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// ../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i2 = groups.length - 1; i2 >= 0; i2--) {
    const [mark] = groups[i2];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i2][1]);
      break;
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
  try {
    return decoder2(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder2(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i2 = start;
  for (; i2 < url.length; i2++) {
    const charCode = url.charCodeAt(i2);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i2);
      const hashIndex = url.indexOf("#", i2);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i2);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v2, i2, a2) => a2.indexOf(v2) === i2);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url()` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method()` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes()` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `routePath()` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c2) => c2({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
}, "resolveCallback");

// ../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v2] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v2);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v2 = headers[k];
        if (typeof v2 === "string") responseHeaders.set(k, v2);
        else {
          responseHeaders.delete(k);
          for (const v22 of v2) responseHeaders.append(k, v22);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  }, "text");
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i2) {
      if (i2 <= index) throw new Error("next() called multiple times");
      index = i2;
      let res;
      let isError = false;
      let handler;
      if (middleware[i2]) {
        handler = middleware[i2][0][0];
        context.req.routeIndex = i2;
      } else handler = i2 === middleware.length && next || void 0;
      if (handler) try {
        res = await handler(context, () => dispatch(i2 + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c2) => {
  return c2.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c2) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c2.newResponse(res.body, res);
  }
  console.error(err);
  return c2.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class Hono2 {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p2 of [path].flat()) {
        this.#path = p2;
        for (const m2 of [method].flat()) {
          const methodName = m2.toUpperCase();
          for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r2) => {
      let handler;
      if (app2.errorHandler === errorHandler) handler = r2.handler;
      else {
        handler = /* @__PURE__ */ __name(async (c2, next) => (await compose([], app2.errorHandler)(c2, () => r2.handler(c2, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r2.handler;
      }
      subApp.#addRoute(r2.method, r2.path, handler, r2.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c2) => {
      const options2 = optionHandler(c2);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c2) => {
      let executionContext = void 0;
      try {
        executionContext = c2.executionCtx;
      } catch {
      }
      return [c2.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c2, next) => {
      const res = await applicationHandler(replaceRequest(c2.req.raw), ...getOptions(c2));
      if (res) return res;
      await next();
    }, "handler");
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r2 = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r2]);
    this.routes.push(r2);
  }
  #handleError(err, c2) {
    if (err instanceof Error) return this.errorHandler(err, c2);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c2 = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c2, async () => {
          c2.res = await this.#notFoundHandler(c2);
        });
      } catch (err) {
        return this.#handleError(err, c2);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c2.finalized ? c2.res : this.#notFoundHandler(c2))).catch((err) => this.#handleError(err, c2)) : res ?? this.#notFoundHandler(c2);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c2);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c2);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  }, "request");
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// ../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// ../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a2, b2) {
  if (a2.length === 1) return b2.length === 1 ? a2 < b2 ? -1 : 1 : -1;
  if (b2.length === 1) return 1;
  if (a2 === ".*" || a2 === "(?:|/.*)") return b2 === "(?:|/.*)" ? -1 : 1;
  else if (b2 === ".*" || b2 === "(?:|/.*)") return -1;
  if (a2 === "[^/]+") return 1;
  else if (b2 === "[^/]+") return -1;
  return a2.length === b2.length ? a2 < b2 ? -1 : 1 : b2.length - a2.length;
}
__name(compareKey, "compareKey");
var Node = class Node2 {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i2 = 0, len = tokens.length; i2 < len; i2++) {
      const token = tokens[i2];
      const pattern = token.length === 1 ? token === "*" ? i2 === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c2 = this.#children[k];
      const childStr = c2.buildRegExpStr();
      return childStr === "" ? "" : (typeof c2.#varIndex === "number" ? `(${k})@${c2.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// ../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i2 = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m2) => {
        const mark = `@\\${i2}`;
        groups[i2] = [mark, m2];
        i2++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i2 = groups.length - 1; i2 >= 0; i2--) {
      const [mark] = groups[i2];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i2][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_2, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// ../node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a2, b2) => b2.length - a2.length)) if (buildWildcardRegExp(k).test(path)) return [...middleware[k]];
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e2) {
      throw e2 === PATH_ERROR ? new UnsupportedPathError(path) : e2;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p2 in handlerMap["ALL"]) {
          handlerMap[method][p2] = [...handlerMap["ALL"][p2]];
          this.#insertPath(method, p2);
        }
      }
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m2 of methods) if (!middleware[m2][path]) {
        this.#insertPath(m2, path);
        middleware[m2][path] = findMiddleware(middleware[m2], path) || findMiddleware(middleware["ALL"], path) || [];
      }
      for (const handlerMap of [middleware, routes]) for (const m2 of methods) for (const p2 in handlerMap[m2]) re.test(p2) && handlerMap[m2][p2].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m2 of methods) {
      if (!routes[m2][path2]) {
        this.#insertPath(m2, path2);
        routes[m2][path2] = findMiddleware(middleware[m2], path2) || findMiddleware(middleware["ALL"], path2) || [];
      }
      routes[m2][path2].push([handler, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r2 of [middleware, routes]) for (const path in r2) {
      const handlers = r2[path];
      const pathData = trie.paths[path];
      if (!pathData) {
        staticMap[path] = [handlers.map(([h2]) => [h2, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h2, handlerPath]) => [h2, trie.paths[handlerPath][1].reduceRight((map, [key], i2) => {
        map[key] = paramReplacementMap[pathData[1][i2][1]];
        return map;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i2) => handlerData[i2]),
      staticMap
    ];
  }
};

// ../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i2 = 0;
    let res;
    for (; i2 < len; i2++) {
      const router = routers[i2];
      try {
        for (let i3 = 0, len2 = routes.length; i3 < len2; i3++) router.add(...routes[i3]);
        res = router.match(method, path);
      } catch (e2) {
        if (e2 instanceof UnsupportedPathError) continue;
        throw e2;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i2 === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// ../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  static {
    __name(this, "Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i2 = 0;
    for (const p2 of parts) {
      const nextP = parts[++i2];
      const pattern = getPattern(p2, nextP) || (nextP === void 0 && p2 && p2.indexOf("*") === p2.length - 1 ? p2 : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p2;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i2 = 0, len = node.#methods.length; i2 < len; i2++) {
      const m2 = node.#methods[i2];
      const handlerSet = m2[method] || m2["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i3 = 0, len2 = handlerSet.possibleKeys.length; i3 < len2; i3++) {
          const key = handlerSet.possibleKeys[i3];
          handlerSet.params[key] = params?.[key] && !i3 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i2 = 0; i2 < len; i2++) {
      const part = parts[i2];
      const isLast = i2 === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p2 = 0; p2 < len; p2++) {
                partOffsets[p2] = offset;
                offset += parts[p2].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i2]);
            const m2 = matcher.exec(restPathString);
            if (m2) {
              params[name] = m2[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m2[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _2 in child.#children) {
                child.#params = params;
                const componentCount = m2[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a2, b2) => {
      return a2.score - b2.score;
    });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// ../node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE",
      "PATCH",
      "QUERY"
    ],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") return () => optsOrigin;
      else return (origin) => optsOrigin === origin ? origin : null;
    } else if (typeof optsOrigin === "function") return optsOrigin;
    else return (origin) => optsOrigin.includes(origin) ? origin : null;
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") return async (origin, c2) => (await optsAllowMethods(origin, c2)).join(",");
    else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else return () => "";
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c2, next) {
    function set(key, value) {
      c2.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c2.req.header("origin") || "", c2);
    if (allowOrigin) set("Access-Control-Allow-Origin", allowOrigin);
    if (opts.credentials) set("Access-Control-Allow-Credentials", "true");
    if (exposeHeadersStr) set("Access-Control-Expose-Headers", exposeHeadersStr);
    if (c2.req.method === "OPTIONS") {
      if (opts.origin !== "*") c2.res.headers.append("Vary", "Origin");
      if (opts.maxAge != null) set("Access-Control-Max-Age", opts.maxAge.toString());
      const allowMethods = await findAllowMethods(c2.req.header("origin") || "", c2);
      if (allowMethods) set("Access-Control-Allow-Methods", allowMethods);
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c2.req.header("Access-Control-Request-Headers");
        if (requestHeaders) headersStr = requestHeaders.split(",").map((h2) => h2.trim()).join(",");
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c2.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c2.res.headers.delete("Content-Length");
      c2.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c2.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") c2.header("Vary", "Origin", { append: true });
  }, "cors");
}, "cors");

// ../node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno } = globalThis;
  return !(typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? "NO_COLOR" in process?.env : false);
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  return !(navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled());
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// ../node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  return times.map((v2) => v2.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter)).join(separator);
}, "humanize");
var time = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  if (await getColorEnabledAsync()) switch (status / 100 | 0) {
    case 5:
      return `\x1B[31m${status}\x1B[0m`;
    case 4:
      return `\x1B[33m${status}\x1B[0m`;
    case 3:
      return `\x1B[36m${status}\x1B[0m`;
    case 2:
      return `\x1B[32m${status}\x1B[0m`;
  }
  return `${status}`;
}, "colorStatus");
async function log(fn, prefix, method, path, status = 0, elapsed) {
  fn(prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`);
}
__name(log, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c2, next) {
    const { method, url } = c2.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c2.res.status, time(start));
  }, "logger");
}, "logger");

// ../node_modules/hono/dist/middleware/pretty-json/index.js
var jsonContentTypeRegex = /^application\/(?:[a-z0-9._-]+\+)?json(?=$|[;\s])/i;
var prettyJSON = /* @__PURE__ */ __name((options) => {
  const targetQuery = options?.query ?? "pretty";
  return /* @__PURE__ */ __name(async function prettyJSON2(c2, next) {
    const pretty = options?.force || c2.req.query(targetQuery) || c2.req.query(targetQuery) === "";
    await next();
    const contentType = c2.res.headers.get("Content-Type");
    if (pretty && contentType && jsonContentTypeRegex.test(contentType)) {
      let obj;
      try {
        obj = await c2.res.clone().json();
      } catch {
        return;
      }
      c2.res = new Response(JSON.stringify(obj, null, options?.space ?? 2), c2.res);
      c2.res.headers.delete("Content-Length");
    }
  }, "prettyJSON");
}, "prettyJSON");

// ../node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var strictDecoder = new TextDecoder("utf-8", { fatal: true });
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf = new Uint8Array(size);
  let i2 = 0;
  for (const buffer of buffers)
    buf.set(buffer, i2), i2 += buffer.length;
  return buf;
}
__name(concat, "concat");
var NON_ASCII = /[^\x00-\x7f]/;
function encode(string) {
  if (typeof string == "string" && string.length >= 128) {
    if (NON_ASCII.test(string))
      throw new TypeError("non-ASCII string encountered in encode()");
    return encoder.encode(string);
  }
  const bytes = new Uint8Array(string.length);
  for (let i2 = 0; i2 < string.length; i2++) {
    const code = string.charCodeAt(i2);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i2] = code;
  }
  return bytes;
}
__name(encode, "encode");
function encodeBase64(input, url = false) {
  if (Uint8Array.prototype.toBase64)
    return input.toBase64({ alphabet: url ? "base64url" : "base64", omitPadding: url });
  const CHUNK_SIZE = 32768, arr = [];
  for (let i2 = 0; i2 < input.length; i2 += CHUNK_SIZE)
    arr.push(String.fromCharCode.apply(null, input.subarray(i2, i2 + CHUNK_SIZE)));
  const encoded = btoa(arr.join(""));
  return url ? encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") : encoded;
}
__name(encodeBase64, "encodeBase64");
function decodeBase64(encoded, url = false) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded, { alphabet: url ? "base64url" : "base64" });
  if (url) {
    if (encoded.includes("+") || encoded.includes("/"))
      throw new TypeError("Invalid base64url");
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  }
  const binary = atob(encoded), bytes = new Uint8Array(binary.length);
  for (let i2 = 0; i2 < binary.length; i2++)
    bytes[i2] = binary.charCodeAt(i2);
  return bytes;
}
__name(decodeBase64, "decodeBase64");

// ../node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// ../node_modules/jose/dist/webapi/util/base64url.js
var invalid = "The input to be decoded is not correctly encoded.";
function decode(input) {
  try {
    return decodeBase64(typeof input == "string" ? input : decoder.decode(input), true);
  } catch (cause) {
    throw new TypeError(invalid, { cause });
  }
}
__name(decode, "decode");
function encode2(input) {
  return encodeBase64(typeof input == "string" ? encoder.encode(input) : input, true);
}
__name(encode2, "encode");

// ../node_modules/jose/dist/webapi/lib/validate.js
function isObject(input) {
  if (typeof input != "object" || input === null || Object.prototype.toString.call(input) !== "[object Object]")
    return false;
  const prototype = Object.getPrototypeOf(input);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}
__name(isObject, "isObject");
function isDisjoint(...headers) {
  const parameters = /* @__PURE__ */ new Set();
  for (const header of headers)
    if (header)
      for (const parameter of Object.keys(header)) {
        if (parameters.has(parameter))
          return false;
        parameters.add(parameter);
      }
  return true;
}
__name(isDisjoint, "isDisjoint");
function assertNotSet(value, name) {
  if (value !== void 0)
    throw new TypeError(`${name} can only be called once`);
}
__name(assertNotSet, "assertNotSet");
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
__name(decodeBase64url, "decodeBase64url");
function encodeBase64url(value, label, ErrorClass) {
  try {
    return encode(value);
  } catch {
    throw new ErrorClass(`The ${label} is not a valid base64url string`);
  }
}
__name(encodeBase64url, "encodeBase64url");
function parseJoseHeader(b64, ErrorClass, message2) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode(b64)));
  } catch {
    throw new ErrorClass(message2);
  }
  if (!isObject(parsed))
    throw new ErrorClass(message2);
  return parsed;
}
__name(parseJoseHeader, "parseJoseHeader");
var JWS_RECOGNIZED = { __proto__: null, b64: true };
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s2) => typeof s2 != "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  return algorithms === void 0 ? void 0 : new Set(algorithms);
}
__name(validateAlgorithms, "validateAlgorithms");
function validateCritDuplicates(Err, protectedHeader) {
  const { crit } = protectedHeader ?? {};
  if (Array.isArray(crit) && new Set(crit).size !== crit.length)
    throw new Err('"crit" (Critical) Header Parameter MUST NOT contain duplicate values');
}
__name(validateCritDuplicates, "validateCritDuplicates");
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === void 0)
    return [];
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input != "string" || input.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  const recognized = recognizedOption === void 0 ? recognizedDefault : { __proto__: null, ...recognizedOption, ...recognizedDefault };
  for (const parameter of protectedHeader.crit) {
    if (!(parameter in recognized))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === void 0)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized[parameter] && (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === void 0))
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return protectedHeader.crit;
}
__name(validateCrit, "validateCrit");
function validateB64(protectedHeader, extensions) {
  if (extensions.includes("b64")) {
    const b64 = protectedHeader.b64;
    if (typeof b64 != "boolean")
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    return b64;
  }
  return true;
}
__name(validateB64, "validateB64");
function serializeJoseHeader(Err, header) {
  let serialized, parsed;
  try {
    serialized = JSON.stringify(header), parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new Err("JOSE Header is not valid JSON", { cause });
  }
  if (!isObject(parsed))
    throw new Err("JOSE Header is not a JSON object");
  return [parsed, serialized];
}
__name(serializeJoseHeader, "serializeJoseHeader");

// ../node_modules/jose/dist/webapi/lib/key.js
var tag = /* @__PURE__ */ __name((key) => key[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((entry, key, usage) => {
  const { alg } = entry;
  if (key.use !== void 0) {
    const expected = usage === "sign" || usage === "verify" ? "sig" : "enc";
    if (key.use !== expected)
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
  }
  if (key.alg !== void 0 && key.alg !== alg)
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  if (Array.isArray(key.key_ops)) {
    const expectedKeyOp = usage === "encrypt" || usage === "decrypt" ? entry.ops?.[usage === "encrypt" ? 0 : 1] : usage;
    if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp))
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
  }
}, "jwkMatchesOp");
async function prepareKey(entry, key, usage) {
  const { alg, secret } = entry, privateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (privateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === void 0 && normalized.priv === void 0)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${privateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : privateKey ? "private" : "public";
    if (key.type !== expectedType && (secret || ["secret", "public", "private"].includes(key.type)))
      throw new TypeError(`${tag(key)} instances must be of type "${expectedType}" for the ${alg} algorithm`);
    if (isCryptoKey(key))
      return key;
    if (keyObject = key, keyObject.type === "secret")
      return keyObject.export();
  }
  cache ||= /* @__PURE__ */ new WeakMap();
  const cacheKey = key;
  let cached = cache.get(cacheKey);
  if (cached?.[alg])
    return cached[alg];
  if (cached || cache.set(cacheKey, cached = {}), keyObject && typeof keyObject.toCryptoKey == "function") {
    const isPublic = keyObject.type === "public", crv = nist[keyObject.asymmetricKeyDetails?.namedCurve], params = entry.resolve?.({ crv, asymmetricKeyType: keyObject.asymmetricKeyType }) ?? entry.subtle;
    return cached[alg] = keyObject.toCryptoKey(params, isPublic, entry.usages[isPublic ? 0 : 1]);
  }
  return normalized ??= keyObject.export({ format: "jwk" }), normalized.alg = alg, cached[alg] = await jwkToKey(entry, normalized);
}
__name(prepareKey, "prepareKey");
var cache;
var nist = {
  __proto__: null,
  prime256v1: "P-256",
  secp384r1: "P-384",
  secp521r1: "P-521"
};
var isCryptoKey = /* @__PURE__ */ __name((key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
}, "isCryptoKey");
var isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
var isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");
function message(msg, actual, ...types) {
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else types.length === 2 ? msg += `one of type ${types[0]} or ${types[1]}.` : msg += `of type ${types[0]}.`;
  return actual == null ? msg += ` Received ${actual}` : typeof actual == "function" && actual.name ? msg += ` Received function ${actual.name}` : typeof actual == "object" && actual != null && actual.constructor?.name && (msg += ` Received an instance of ${actual.constructor.name}`), msg;
}
__name(message, "message");
function invalidKeyType(alg, actual, secret) {
  const types = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return secret && types.push("Uint8Array"), new TypeError(message(`Key for the ${alg} algorithm must be `, actual, ...types));
}
__name(invalidKeyType, "invalidKeyType");
var unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
__name(checkUsage, "checkUsage");
function checkModulusLength(alg, key) {
  const { modulusLength } = key.algorithm;
  if (typeof modulusLength != "number" || modulusLength < 2048)
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
}
__name(checkModulusLength, "checkModulusLength");
function checkCryptoKey(key, expected, usage) {
  const algorithm = key.algorithm;
  if (algorithm.name !== expected.name)
    throw unusable(expected.name);
  if (expected.hash && algorithm.hash?.name !== expected.hash)
    throw unusable(expected.hash, "algorithm.hash");
  if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve)
    throw unusable(expected.namedCurve, "algorithm.namedCurve");
  if (expected.length !== void 0 && algorithm.length !== expected.length)
    throw unusable(expected.length, "algorithm.length");
  checkUsage(key, usage);
}
__name(checkCryptoKey, "checkCryptoKey");
function snapshotJwk(jwk) {
  return { __proto__: null, ...jwk };
}
__name(snapshotJwk, "snapshotJwk");
function normalizeJwk(jwk) {
  const normalized = snapshotJwk(jwk);
  if (normalized.ext !== void 0 && typeof normalized.ext != "boolean")
    throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (normalized.key_ops !== void 0) {
    const value = normalized.key_ops, keyOps = Array.isArray(value) ? [...value] : void 0;
    if (!keyOps || keyOps.some((operation) => typeof operation != "string") || new Set(keyOps).size !== keyOps.length)
      throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    normalized.key_ops = keyOps;
  }
  return normalized;
}
__name(normalizeJwk, "normalizeJwk");
async function jwkToKey(entry, jwk, extractable) {
  if (!entry.kty.includes(jwk.kty))
    throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle, isPrivate = !!(jwk.d || jwk.priv), keyData = { ...jwk, ext: extractable ?? jwk.ext };
  return keyData.kty !== "AKP" && delete keyData.alg, delete keyData.use, crypto.subtle.importKey("jwk", keyData, algorithm, keyData.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}
__name(jwkToKey, "jwkToKey");
async function rawKey(key, expected, usage, extractable = false) {
  return key instanceof Uint8Array && (key = await crypto.subtle.importKey("raw", key, expected, extractable, [usage])), checkCryptoKey(key, expected, usage), key;
}
__name(rawKey, "rawKey");

// ../node_modules/jose/dist/webapi/lib/key_descriptor.js
function table(entries) {
  const out = { __proto__: null };
  for (const alg in entries)
    out[alg] = { ...entries[alg], alg };
  return out;
}
__name(table, "table");

// ../node_modules/jose/dist/webapi/lib/jws_algorithms.js
var sig = [["verify"], ["sign"]];
function hmac(bits) {
  const subtle = { name: "HMAC", hash: `SHA-${bits}` };
  return { kty: ["oct"], secret: true, subtle, signing: subtle, usages: sig };
}
__name(hmac, "hmac");
function rsa(bits, saltLength) {
  const subtle = { name: saltLength ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${bits}` };
  return {
    kty: ["RSA"],
    subtle,
    signing: saltLength ? { ...subtle, saltLength } : subtle,
    usages: sig,
    minRsaBits: 2048
  };
}
__name(rsa, "rsa");
function ecdsa(crv, bits) {
  return {
    kty: ["EC"],
    crv,
    subtle: { name: "ECDSA", namedCurve: crv },
    signing: { name: "ECDSA", hash: `SHA-${bits}` },
    usages: sig
  };
}
__name(ecdsa, "ecdsa");
function eddsa() {
  const subtle = { name: "Ed25519" };
  return {
    kty: ["OKP"],
    crv: "Ed25519",
    subtle,
    signing: subtle,
    usages: sig
  };
}
__name(eddsa, "eddsa");
function mldsa(bits) {
  const subtle = { name: `ML-DSA-${bits}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
__name(mldsa, "mldsa");
var JWS = table({
  HS256: hmac(256),
  HS384: hmac(384),
  HS512: hmac(512),
  RS256: rsa(256),
  RS384: rsa(384),
  RS512: rsa(512),
  PS256: rsa(256, 32),
  PS384: rsa(384, 48),
  PS512: rsa(512, 64),
  ES256: ecdsa("P-256", 256),
  ES384: ecdsa("P-384", 384),
  ES512: ecdsa("P-521", 512),
  EdDSA: eddsa(),
  Ed25519: eddsa(),
  "ML-DSA-44": mldsa(44),
  "ML-DSA-65": mldsa(65),
  "ML-DSA-87": mldsa(87)
});
function jwsAlgorithm(alg) {
  const entry = typeof alg == "string" ? JWS[alg] : void 0;
  if (!entry)
    throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  return entry;
}
__name(jwsAlgorithm, "jwsAlgorithm");

// ../node_modules/jose/dist/webapi/lib/jws_verify.js
function prepareVerify(options) {
  return [options && validateAlgorithms("algorithms", options.algorithms), options?.crit];
}
__name(prepareVerify, "prepareVerify");
function parseProtectedHeader(encodedProtected) {
  return encodedProtected === void 0 ? {} : parseJoseHeader(encodedProtected, JWSInvalid, "JWS Protected Header is invalid");
}
__name(parseProtectedHeader, "parseProtectedHeader");
function encodeCompactUnencodedPayload(payload) {
  try {
    return encode(payload);
  } catch {
    throw new JWSInvalid("JWS Compact Serialization payload must use only ASCII characters");
  }
}
__name(encodeCompactUnencodedPayload, "encodeCompactUnencodedPayload");
async function verifySignature(jws, shared, key, encodeUnencodedPayload, parsedProtected) {
  const { protected: encodedProtected, header, payload: inputPayload } = jws, parsedProt = parsedProtected ?? parseProtectedHeader(encodedProtected);
  if (!isDisjoint(parsedProt, header))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...parsedProt, ...header }, b64 = validateB64(parsedProt, validateCrit(JWSInvalid, JWS_RECOGNIZED, shared[1], parsedProt, joseHeader)), { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  if (shared[0] && !shared[0].has(alg))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (b64) {
    if (typeof inputPayload != "string")
      throw new JWSInvalid("JWS Payload must be a string");
  } else if (typeof inputPayload != "string" && !(inputPayload instanceof Uint8Array))
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  const signingPayload = b64 || typeof inputPayload != "string" ? inputPayload : encodeUnencodedPayload(inputPayload);
  let resolvedKey = false;
  typeof key == "function" && (key = await key(parsedProt, jws), resolvedKey = true);
  const entry = jwsAlgorithm(alg), data = concat(encodedProtected !== void 0 ? encode(encodedProtected) : new Uint8Array(), encode("."), typeof signingPayload == "string" ? shared[2] ??= encodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload), signature = decodeBase64url(jws.signature, "signature", JWSInvalid), k = await prepareKey(entry, key, "verify"), cryptoKey = await rawKey(k, entry.subtle, "verify");
  entry.minRsaBits && checkModulusLength(entry.alg, cryptoKey);
  let verified = false;
  try {
    verified = await crypto.subtle.verify(entry.signing, cryptoKey, signature, data);
  } catch {
  }
  if (!verified)
    throw new JWSSignatureVerificationFailed();
  const result = { payload: typeof signingPayload == "string" ? decodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload };
  return encodedProtected !== void 0 && (result.protectedHeader = parsedProt), header !== void 0 && (result.unprotectedHeader = header), resolvedKey ? [{ ...result, key: k }, b64] : [result, b64];
}
__name(verifySignature, "verifySignature");
async function verifyCompact(jws, shared, key) {
  if (jws instanceof Uint8Array && (jws = decoder.decode(jws)), typeof jws != "string")
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3)
    throw new JWSInvalid("Invalid Compact JWS");
  return verifySignature({ payload, protected: protectedHeader, signature }, shared, key, encodeCompactUnencodedPayload);
}
__name(verifyCompact, "verifyCompact");

// ../node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
var multipliers = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31557600
};
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var checkFailed = "check_failed";
function invalidDuration() {
  throw new TypeError("Invalid time period format");
}
__name(invalidDuration, "invalidDuration");
function secs(str) {
  typeof str != "string" && invalidDuration();
  const matched = REGEX.exec(str);
  (!matched || matched[4] && matched[1]) && invalidDuration();
  const value = parseFloat(matched[2]), numericDate2 = Math.round(value * multipliers[matched[3][0].toLowerCase()]);
  return Number.isFinite(numericDate2) || invalidDuration(), matched[1] === "-" || matched[4] === "ago" ? -numericDate2 : numericDate2;
}
__name(secs, "secs");
function validateInput(label, input) {
  if (!Number.isFinite(input))
    throw new TypeError(`Invalid ${label} input`);
  return input;
}
__name(validateInput, "validateInput");
function validateStringClaim(claim, value) {
  if (typeof value != "string")
    throw new TypeError(`"${claim}" claim must be a string`);
}
__name(validateStringClaim, "validateStringClaim");
function validateAudienceClaim(value) {
  if (typeof value != "string" && (!Array.isArray(value) || Array.from(value).some((member) => typeof member != "string")))
    throw new TypeError('"aud" claim must be a string or an array of strings');
}
__name(validateAudienceClaim, "validateAudienceClaim");
function numericDate(value, label) {
  return typeof value == "number" ? validateInput(label, value) : value instanceof Date ? validateInput(label, epoch(value)) : epoch(/* @__PURE__ */ new Date()) + secs(value);
}
__name(numericDate, "numericDate");
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  const normalized = value.toLowerCase();
  return value.includes("/") ? normalized : `application/${normalized}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => typeof audPayload == "string" ? audOption.includes(audPayload) : Array.isArray(audPayload) ? audOption.some((aud) => audPayload.includes(aud)) : false, "checkAudiencePresence");
function validateNumericDate(payload, claim, required = false) {
  const value = payload[claim];
  if (!(value === void 0 && !required)) {
    if (typeof value != "number")
      throw new JWTClaimValidationFailed(`"${claim}" claim must be a number`, payload, claim, "invalid");
    return value;
  }
}
__name(validateNumericDate, "validateNumericDate");
function unexpectedClaim(payload, claim) {
  throw new JWTClaimValidationFailed(`unexpected "${claim}" claim value`, payload, claim, checkFailed);
}
__name(unexpectedClaim, "unexpectedClaim");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(strictDecoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload))
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  const { typ } = options;
  if (typ !== void 0 && (typeof protectedHeader.typ != "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ)))
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", checkFailed);
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options, presenceCheck = [...requiredClaims];
  maxTokenAge !== void 0 && presenceCheck.push("iat"), audience !== void 0 && presenceCheck.push("aud"), subject !== void 0 && presenceCheck.push("sub"), issuer !== void 0 && presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse()))
    if (!Object.hasOwn(payload, claim))
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
  issuer !== void 0 && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss) && unexpectedClaim(payload, "iss"), subject !== void 0 && payload.sub !== subject && unexpectedClaim(payload, "sub"), audience !== void 0 && !checkAudiencePresence(payload.aud, typeof audience == "string" ? [audience] : audience) && unexpectedClaim(payload, "aud");
  const { clockTolerance } = options;
  let tolerance = 0;
  if (typeof clockTolerance == "string")
    tolerance = secs(clockTolerance);
  else if (clockTolerance !== void 0) {
    if (typeof clockTolerance != "number")
      throw new TypeError("Invalid clockTolerance option type");
    tolerance = clockTolerance;
  }
  validateInput("clockTolerance option", tolerance);
  const { currentDate } = options, now = validateInput("currentDate option", epoch(currentDate === void 0 ? /* @__PURE__ */ new Date() : currentDate)), iat = validateNumericDate(payload, "iat", maxTokenAge !== void 0), nbf = validateNumericDate(payload, "nbf");
  if (nbf !== void 0 && nbf > now + tolerance)
    throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", checkFailed);
  const exp = validateNumericDate(payload, "exp");
  if (exp !== void 0 && exp <= now - tolerance)
    throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", checkFailed);
  if (maxTokenAge !== void 0) {
    const age = now - iat, max = validateInput("maxTokenAge option", typeof maxTokenAge == "number" ? maxTokenAge : secs(maxTokenAge));
    if (age - tolerance > max)
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", checkFailed);
    if (age < -tolerance)
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", checkFailed);
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");
var producerPayloads;
function producerPayload(producer) {
  return producerPayloads.get(producer);
}
__name(producerPayload, "producerPayload");
function jwtData(producer) {
  const payload = producerPayload(producer);
  for (const claim of ["iat", "nbf", "exp"]) {
    const value = payload[claim];
    if (typeof value == "number" && !Number.isFinite(value))
      throw new TypeError(`"${claim}" claim must be a finite number`);
  }
  return encoder.encode(JSON.stringify(payload));
}
__name(jwtData, "jwtData");
var JWTClaimsBuilder = class {
  static {
    __name(this, "JWTClaimsBuilder");
  }
  constructor(payload = {}) {
    if (!isObject(payload))
      throw new TypeError("JWT Claims Set MUST be an object");
    (producerPayloads ||= /* @__PURE__ */ new WeakMap()).set(this, structuredClone(payload));
  }
  setIssuer(value) {
    return validateStringClaim("iss", value), producerPayload(this).iss = value, this;
  }
  setSubject(value) {
    return validateStringClaim("sub", value), producerPayload(this).sub = value, this;
  }
  setAudience(value) {
    return validateAudienceClaim(value), producerPayload(this).aud = value, this;
  }
  setJti(value) {
    return validateStringClaim("jti", value), producerPayload(this).jti = value, this;
  }
  setNotBefore(value) {
    return producerPayload(this).nbf = numericDate(value, "setNotBefore"), this;
  }
  setExpirationTime(value) {
    return producerPayload(this).exp = numericDate(value, "setExpirationTime"), this;
  }
  setIssuedAt(value) {
    const payload = producerPayload(this);
    return value === void 0 ? payload.iat = epoch(/* @__PURE__ */ new Date()) : typeof value == "string" ? payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value)) : payload.iat = numericDate(value, "setIssuedAt"), this;
  }
};

// ../node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const [verified, b64] = await verifyCompact(jwt, prepareVerify(options), key);
  if (!b64)
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  return { ...verified, payload };
}
__name(jwtVerify, "jwtVerify");

// ../node_modules/jose/dist/webapi/lib/jws_sign.js
async function createSignature(input, key, rejectUnencoded) {
  let [payload, protectedHeader, unprotectedHeader, crit] = input, protectedHeaderString = "";
  if (protectedHeader !== void 0) {
    const normalized = serializeJoseHeader(JWSInvalid, protectedHeader);
    protectedHeader = normalized[0], protectedHeaderString = encode2(normalized[1]);
  }
  if (unprotectedHeader !== void 0 && (unprotectedHeader = serializeJoseHeader(JWSInvalid, unprotectedHeader)[0]), !protectedHeader && !unprotectedHeader)
    throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
  if (!isDisjoint(protectedHeader, unprotectedHeader))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...protectedHeader, ...unprotectedHeader };
  validateCritDuplicates(JWSInvalid, protectedHeader);
  const b64 = validateB64(protectedHeader, validateCrit(JWSInvalid, JWS_RECOGNIZED, crit, protectedHeader, joseHeader));
  b64 || rejectUnencoded?.();
  const { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  const entry = jwsAlgorithm(alg);
  let payloadS = "", payloadB = payload, data;
  if (b64) {
    const encoded = input[4];
    encoded ? (payloadS = encoded[0] ??= encode2(payload), payloadB = encoded[1] ??= encode(payloadS)) : (payloadS = encode2(payload), data = encoder.encode(`${protectedHeaderString}.${payloadS}`));
  }
  data ??= concat(encode(protectedHeaderString), encode("."), payloadB);
  const k = await rawKey(await prepareKey(entry, key, "sign"), entry.subtle, "sign");
  entry.minRsaBits && checkModulusLength(entry.alg, k);
  const jws = {
    signature: encode2(new Uint8Array(await crypto.subtle.sign(entry.signing, k, data))),
    payload: payloadS
  };
  return protectedHeader && (jws.protected = protectedHeaderString), unprotectedHeader && (jws.header = unprotectedHeader), [jws, b64];
}
__name(createSignature, "createSignature");
async function createCompactSignature(payload, protectedHeader, crit, key, rejectUnencoded) {
  const [jws] = await createSignature([payload, protectedHeader, void 0, crit], key, rejectUnencoded);
  return `${jws.protected}.${jws.payload}.${jws.signature}`;
}
__name(createCompactSignature, "createCompactSignature");

// ../node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT_base = JWTClaimsBuilder;
var SignJWT = class extends SignJWT_base {
  static {
    __name(this, "SignJWT");
  }
  #protectedHeader;
  setProtectedHeader(protectedHeader) {
    return assertNotSet(this.#protectedHeader, "setProtectedHeader"), this.#protectedHeader = protectedHeader, this;
  }
  async sign(key, options) {
    return createCompactSignature(jwtData(this), this.#protectedHeader, options?.crit, key, () => {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    });
  }
};

// ../node_modules/bcrypt-ts/dist/browser.js
var e = typeof scheduler == `object` && typeof scheduler.postTask == `function` ? scheduler.postTask.bind(scheduler) : setTimeout;
var t = [...`./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`];
var n = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, -1, -1, -1, -1, -1, -1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, -1, -1, -1, -1, -1, -1, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, -1];
var r = [608135816, 2242054355, 320440878, 57701188, 2752067618, 698298832, 137296536, 3964562569, 1160258022, 953160567, 3193202383, 887688300, 3232508343, 3380367581, 1065670069, 3041331479, 2450970073, 2306472731];
var i = [3509652390, 2564797868, 805139163, 3491422135, 3101798381, 1780907670, 3128725573, 4046225305, 614570311, 3012652279, 134345442, 2240740374, 1667834072, 1901547113, 2757295779, 4103290238, 227898511, 1921955416, 1904987480, 2182433518, 2069144605, 3260701109, 2620446009, 720527379, 3318853667, 677414384, 3393288472, 3101374703, 2390351024, 1614419982, 1822297739, 2954791486, 3608508353, 3174124327, 2024746970, 1432378464, 3864339955, 2857741204, 1464375394, 1676153920, 1439316330, 715854006, 3033291828, 289532110, 2706671279, 2087905683, 3018724369, 1668267050, 732546397, 1947742710, 3462151702, 2609353502, 2950085171, 1814351708, 2050118529, 680887927, 999245976, 1800124847, 3300911131, 1713906067, 1641548236, 4213287313, 1216130144, 1575780402, 4018429277, 3917837745, 3693486850, 3949271944, 596196993, 3549867205, 258830323, 2213823033, 772490370, 2760122372, 1774776394, 2652871518, 566650946, 4142492826, 1728879713, 2882767088, 1783734482, 3629395816, 2517608232, 2874225571, 1861159788, 326777828, 3124490320, 2130389656, 2716951837, 967770486, 1724537150, 2185432712, 2364442137, 1164943284, 2105845187, 998989502, 3765401048, 2244026483, 1075463327, 1455516326, 1322494562, 910128902, 469688178, 1117454909, 936433444, 3490320968, 3675253459, 1240580251, 122909385, 2157517691, 634681816, 4142456567, 3825094682, 3061402683, 2540495037, 79693498, 3249098678, 1084186820, 1583128258, 426386531, 1761308591, 1047286709, 322548459, 995290223, 1845252383, 2603652396, 3431023940, 2942221577, 3202600964, 3727903485, 1712269319, 422464435, 3234572375, 1170764815, 3523960633, 3117677531, 1434042557, 442511882, 3600875718, 1076654713, 1738483198, 4213154764, 2393238008, 3677496056, 1014306527, 4251020053, 793779912, 2902807211, 842905082, 4246964064, 1395751752, 1040244610, 2656851899, 3396308128, 445077038, 3742853595, 3577915638, 679411651, 2892444358, 2354009459, 1767581616, 3150600392, 3791627101, 3102740896, 284835224, 4246832056, 1258075500, 768725851, 2589189241, 3069724005, 3532540348, 1274779536, 3789419226, 2764799539, 1660621633, 3471099624, 4011903706, 913787905, 3497959166, 737222580, 2514213453, 2928710040, 3937242737, 1804850592, 3499020752, 2949064160, 2386320175, 2390070455, 2415321851, 4061277028, 2290661394, 2416832540, 1336762016, 1754252060, 3520065937, 3014181293, 791618072, 3188594551, 3933548030, 2332172193, 3852520463, 3043980520, 413987798, 3465142937, 3030929376, 4245938359, 2093235073, 3534596313, 375366246, 2157278981, 2479649556, 555357303, 3870105701, 2008414854, 3344188149, 4221384143, 3956125452, 2067696032, 3594591187, 2921233993, 2428461, 544322398, 577241275, 1471733935, 610547355, 4027169054, 1432588573, 1507829418, 2025931657, 3646575487, 545086370, 48609733, 2200306550, 1653985193, 298326376, 1316178497, 3007786442, 2064951626, 458293330, 2589141269, 3591329599, 3164325604, 727753846, 2179363840, 146436021, 1461446943, 4069977195, 705550613, 3059967265, 3887724982, 4281599278, 3313849956, 1404054877, 2845806497, 146425753, 1854211946, 1266315497, 3048417604, 3681880366, 3289982499, 290971e4, 1235738493, 2632868024, 2414719590, 3970600049, 1771706367, 1449415276, 3266420449, 422970021, 1963543593, 2690192192, 3826793022, 1062508698, 1531092325, 1804592342, 2583117782, 2714934279, 4024971509, 1294809318, 4028980673, 1289560198, 2221992742, 1669523910, 35572830, 157838143, 1052438473, 1016535060, 1802137761, 1753167236, 1386275462, 3080475397, 2857371447, 1040679964, 2145300060, 2390574316, 1461121720, 2956646967, 4031777805, 4028374788, 33600511, 2920084762, 1018524850, 629373528, 3691585981, 3515945977, 2091462646, 2486323059, 586499841, 988145025, 935516892, 3367335476, 2599673255, 2839830854, 265290510, 3972581182, 2759138881, 3795373465, 1005194799, 847297441, 406762289, 1314163512, 1332590856, 1866599683, 4127851711, 750260880, 613907577, 1450815602, 3165620655, 3734664991, 3650291728, 3012275730, 3704569646, 1427272223, 778793252, 1343938022, 2676280711, 2052605720, 1946737175, 3164576444, 3914038668, 3967478842, 3682934266, 1661551462, 3294938066, 4011595847, 840292616, 3712170807, 616741398, 312560963, 711312465, 1351876610, 322626781, 1910503582, 271666773, 2175563734, 1594956187, 70604529, 3617834859, 1007753275, 1495573769, 4069517037, 2549218298, 2663038764, 504708206, 2263041392, 3941167025, 2249088522, 1514023603, 1998579484, 1312622330, 694541497, 2582060303, 2151582166, 1382467621, 776784248, 2618340202, 3323268794, 2497899128, 2784771155, 503983604, 4076293799, 907881277, 423175695, 432175456, 1378068232, 4145222326, 3954048622, 3938656102, 3820766613, 2793130115, 2977904593, 26017576, 3274890735, 3194772133, 1700274565, 1756076034, 4006520079, 3677328699, 720338349, 1533947780, 354530856, 688349552, 3973924725, 1637815568, 332179504, 3949051286, 53804574, 2852348879, 3044236432, 1282449977, 3583942155, 3416972820, 4006381244, 1617046695, 2628476075, 3002303598, 1686838959, 431878346, 2686675385, 1700445008, 1080580658, 1009431731, 832498133, 3223435511, 2605976345, 2271191193, 2516031870, 1648197032, 4164389018, 2548247927, 300782431, 375919233, 238389289, 3353747414, 2531188641, 2019080857, 1475708069, 455242339, 2609103871, 448939670, 3451063019, 1395535956, 2413381860, 1841049896, 1491858159, 885456874, 4264095073, 4001119347, 1565136089, 3898914787, 1108368660, 540939232, 1173283510, 2745871338, 3681308437, 4207628240, 3343053890, 4016749493, 1699691293, 1103962373, 3625875870, 2256883143, 3830138730, 1031889488, 3479347698, 1535977030, 4236805024, 3251091107, 2132092099, 1774941330, 1199868427, 1452454533, 157007616, 2904115357, 342012276, 595725824, 1480756522, 206960106, 497939518, 591360097, 863170706, 2375253569, 3596610801, 1814182875, 2094937945, 3421402208, 1082520231, 3463918190, 2785509508, 435703966, 3908032597, 1641649973, 2842273706, 3305899714, 1510255612, 2148256476, 2655287854, 3276092548, 4258621189, 236887753, 3681803219, 274041037, 1734335097, 3815195456, 3317970021, 1899903192, 1026095262, 4050517792, 356393447, 2410691914, 3873677099, 3682840055, 3913112168, 2491498743, 4132185628, 2489919796, 1091903735, 1979897079, 3170134830, 3567386728, 3557303409, 857797738, 1136121015, 1342202287, 507115054, 2535736646, 337727348, 3213592640, 1301675037, 2528481711, 1895095763, 1721773893, 3216771564, 62756741, 2142006736, 835421444, 2531993523, 1442658625, 3659876326, 2882144922, 676362277, 1392781812, 170690266, 3921047035, 1759253602, 3611846912, 1745797284, 664899054, 1329594018, 3901205900, 3045908486, 2062866102, 2865634940, 3543621612, 3464012697, 1080764994, 553557557, 3656615353, 3996768171, 991055499, 499776247, 1265440854, 648242737, 3940784050, 980351604, 3713745714, 1749149687, 3396870395, 4211799374, 3640570775, 1161844396, 3125318951, 1431517754, 545492359, 4268468663, 3499529547, 1437099964, 2702547544, 3433638243, 2581715763, 2787789398, 1060185593, 1593081372, 2418618748, 4260947970, 69676912, 2159744348, 86519011, 2512459080, 3838209314, 1220612927, 3339683548, 133810670, 1090789135, 1078426020, 1569222167, 845107691, 3583754449, 4072456591, 1091646820, 628848692, 1613405280, 3757631651, 526609435, 236106946, 48312990, 2942717905, 3402727701, 1797494240, 859738849, 992217954, 4005476642, 2243076622, 3870952857, 3732016268, 765654824, 3490871365, 2511836413, 1685915746, 3888969200, 1414112111, 2273134842, 3281911079, 4080962846, 172450625, 2569994100, 980381355, 4109958455, 2819808352, 2716589560, 2568741196, 3681446669, 3329971472, 1835478071, 660984891, 3704678404, 4045999559, 3422617507, 3040415634, 1762651403, 1719377915, 3470491036, 2693910283, 3642056355, 3138596744, 1364962596, 2073328063, 1983633131, 926494387, 3423689081, 2150032023, 4096667949, 1749200295, 3328846651, 309677260, 2016342300, 1779581495, 3079819751, 111262694, 1274766160, 443224088, 298511866, 1025883608, 3806446537, 1145181785, 168956806, 3641502830, 3584813610, 1689216846, 3666258015, 3200248200, 1692713982, 2646376535, 4042768518, 1618508792, 1610833997, 3523052358, 4130873264, 2001055236, 3610705100, 2202168115, 4028541809, 2961195399, 1006657119, 2006996926, 3186142756, 1430667929, 3210227297, 1314452623, 4074634658, 4101304120, 2273951170, 1399257539, 3367210612, 3027628629, 1190975929, 2062231137, 2333990788, 2221543033, 2438960610, 1181637006, 548689776, 2362791313, 3372408396, 3104550113, 3145860560, 296247880, 1970579870, 3078560182, 3769228297, 1714227617, 3291629107, 3898220290, 166772364, 1251581989, 493813264, 448347421, 195405023, 2709975567, 677966185, 3703036547, 1463355134, 2715995803, 1338867538, 1343315457, 2802222074, 2684532164, 233230375, 2599980071, 2000651841, 3277868038, 1638401717, 4028070440, 3237316320, 6314154, 819756386, 300326615, 590932579, 1405279636, 3267499572, 3150704214, 2428286686, 3959192993, 3461946742, 1862657033, 1266418056, 963775037, 2089974820, 2263052895, 1917689273, 448879540, 3550394620, 3981727096, 150775221, 3627908307, 1303187396, 508620638, 2975983352, 2726630617, 1817252668, 1876281319, 1457606340, 908771278, 3720792119, 3617206836, 2455994898, 1729034894, 1080033504, 976866871, 3556439503, 2881648439, 1522871579, 1555064734, 1336096578, 3548522304, 2579274686, 3574697629, 3205460757, 3593280638, 3338716283, 3079412587, 564236357, 2993598910, 1781952180, 1464380207, 3163844217, 3332601554, 1699332808, 1393555694, 1183702653, 3581086237, 1288719814, 691649499, 2847557200, 2895455976, 3193889540, 2717570544, 1781354906, 1676643554, 2592534050, 3230253752, 1126444790, 2770207658, 2633158820, 2210423226, 2615765581, 2414155088, 3127139286, 673620729, 2805611233, 1269405062, 4015350505, 3341807571, 4149409754, 1057255273, 2012875353, 2162469141, 2276492801, 2601117357, 993977747, 3918593370, 2654263191, 753973209, 36408145, 2530585658, 25011837, 3520020182, 2088578344, 530523599, 2918365339, 1524020338, 1518925132, 3760827505, 3759777254, 1202760957, 3985898139, 3906192525, 674977740, 4174734889, 2031300136, 2019492241, 3983892565, 4153806404, 3822280332, 352677332, 2297720250, 60907813, 90501309, 3286998549, 1016092578, 2535922412, 2839152426, 457141659, 509813237, 4120667899, 652014361, 1966332200, 2975202805, 55981186, 2327461051, 676427537, 3255491064, 2882294119, 3433927263, 1307055953, 942726286, 933058658, 2468411793, 3933900994, 4215176142, 1361170020, 2001714738, 2830558078, 3274259782, 1222529897, 1679025792, 2729314320, 3714953764, 1770335741, 151462246, 3013232138, 1682292957, 1483529935, 471910574, 1539241949, 458788160, 3436315007, 1807016891, 3718408830, 978976581, 1043663428, 3165965781, 1927990952, 4200891579, 2372276910, 3208408903, 3533431907, 1412390302, 2931980059, 4132332400, 1947078029, 3881505623, 4168226417, 2941484381, 1077988104, 1320477388, 886195818, 18198404, 3786409e3, 2509781533, 112762804, 3463356488, 1866414978, 891333506, 18488651, 661792760, 1628790961, 3885187036, 3141171499, 876946877, 2693282273, 1372485963, 791857591, 2686433993, 3759982718, 3167212022, 3472953795, 2716379847, 445679433, 3561995674, 3504004811, 3574258232, 54117162, 3331405415, 2381918588, 3769707343, 4154350007, 1140177722, 4074052095, 668550556, 3214352940, 367459370, 261225585, 2610173221, 4209349473, 3468074219, 3265815641, 314222801, 3066103646, 3808782860, 282218597, 3406013506, 3773591054, 379116347, 1285071038, 846784868, 2669647154, 3771962079, 3550491691, 2305946142, 453669953, 1268987020, 3317592352, 3279303384, 3744833421, 2610507566, 3859509063, 266596637, 3847019092, 517658769, 3462560207, 3443424879, 370717030, 4247526661, 2224018117, 4143653529, 4112773975, 2788324899, 2477274417, 1456262402, 2901442914, 1517677493, 1846949527, 2295493580, 3734397586, 2176403920, 1280348187, 1908823572, 3871786941, 846861322, 1172426758, 3287448474, 3383383037, 1655181056, 3139813346, 901632758, 1897031941, 2986607138, 3066810236, 3447102507, 1393639104, 373351379, 950779232, 625454576, 3124240540, 4148612726, 2007998917, 544563296, 2244738638, 2330496472, 2058025392, 1291430526, 424198748, 50039436, 29584100, 3605783033, 2429876329, 2791104160, 1057563949, 3255363231, 3075367218, 3463963227, 1469046755, 985887462];
var a = [1332899944, 1700884034, 1701343084, 1684370003, 1668446532, 1869963892];
var o = /* @__PURE__ */ __name((e2, n2) => {
  if (n2 <= 0 || n2 > e2.length) throw Error(`Illegal length: ${n2}`);
  let r2 = 0, i2, a2, o2 = [];
  for (; r2 < n2; ) {
    if (i2 = e2[r2++] & 255, o2.push(t[i2 >> 2 & 63]), i2 = (i2 & 3) << 4, r2 >= n2) {
      o2.push(t[i2 & 63]);
      break;
    }
    if (a2 = e2[r2++] & 255, i2 |= a2 >> 4 & 15, o2.push(t[i2 & 63]), i2 = (a2 & 15) << 2, r2 >= n2) {
      o2.push(t[i2 & 63]);
      break;
    }
    a2 = e2[r2++] & 255, i2 |= a2 >> 6 & 3, o2.push(t[i2 & 63], t[a2 & 63]);
  }
  return o2.join(``);
}, "o");
var s = /* @__PURE__ */ __name((e2, t2) => {
  if (t2 <= 0) throw Error(`Illegal length: ${t2}`);
  let r2 = e2.length, i2 = 0, a2 = 0, o2, s2, c2, l2, u2, d2, f2 = [];
  for (; i2 < r2 - 1 && a2 < t2 && (d2 = e2.charCodeAt(i2++), o2 = d2 < n.length ? n[d2] : -1, d2 = e2.charCodeAt(i2++), s2 = d2 < n.length ? n[d2] : -1, !(o2 === -1 || s2 === -1 || (u2 = o2 << 2 >>> 0, u2 |= (s2 & 48) >> 4, f2.push(String.fromCharCode(u2)), ++a2 >= t2 || i2 >= r2) || (d2 = e2.charCodeAt(i2++), c2 = d2 < n.length ? n[d2] : -1, c2 === -1) || (u2 = (s2 & 15) << 4 >>> 0, u2 |= (c2 & 60) >> 2, f2.push(String.fromCharCode(u2)), ++a2 >= t2 || i2 >= r2) || (d2 = e2.charCodeAt(i2++), l2 = d2 < n.length ? n[d2] : -1, l2 === -1))); ) u2 = (c2 & 3) << 6 >>> 0, u2 |= l2, f2.push(String.fromCharCode(u2)), ++a2;
  return f2.map((e3) => e3.charCodeAt(0));
}, "s");
var c = /* @__PURE__ */ __name((e2, t2, n2, r2) => {
  let i2, a2 = e2[t2], o2 = e2[t2 + 1];
  return a2 ^= n2[0], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[1], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[2], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[3], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[4], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[5], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[6], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[7], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[8], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[9], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[10], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[11], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[12], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[13], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[14], i2 = r2[a2 >>> 24], i2 += r2[256 | a2 >> 16 & 255], i2 ^= r2[512 | a2 >> 8 & 255], i2 += r2[768 | a2 & 255], o2 ^= i2 ^ n2[15], i2 = r2[o2 >>> 24], i2 += r2[256 | o2 >> 16 & 255], i2 ^= r2[512 | o2 >> 8 & 255], i2 += r2[768 | o2 & 255], a2 ^= i2 ^ n2[16], e2[t2] = o2 ^ n2[17], e2[t2 + 1] = a2, e2;
}, "c");
var l = /* @__PURE__ */ __name((e2, t2) => {
  let n2 = 0;
  for (let r2 = 0; r2 < 4; ++r2) n2 = n2 << 8 | e2[t2] & 255, t2 = (t2 + 1) % e2.length;
  return { key: n2, offp: t2 };
}, "l");
var u = /* @__PURE__ */ __name((e2, t2, n2) => {
  let r2 = t2.length, i2 = n2.length, a2 = 0, o2 = new Int32Array([0, 0]), s2;
  for (let n3 = 0; n3 < r2; n3++) s2 = l(e2, a2), { offp: a2 } = s2, t2[n3] ^= s2.key;
  for (let e3 = 0; e3 < r2; e3 += 2) o2 = c(o2, 0, t2, n2), t2[e3] = o2[0], t2[e3 + 1] = o2[1];
  for (let e3 = 0; e3 < i2; e3 += 2) o2 = c(o2, 0, t2, n2), n2[e3] = o2[0], n2[e3 + 1] = o2[1];
}, "u");
var d = /* @__PURE__ */ __name((e2, t2, n2, r2) => {
  let i2 = n2.length, a2 = r2.length, o2 = 0, s2 = new Int32Array([0, 0]), u2;
  for (let e3 = 0; e3 < i2; e3++) u2 = l(t2, o2), { offp: o2 } = u2, n2[e3] ^= u2.key;
  o2 = 0;
  for (let t3 = 0; t3 < i2; t3 += 2) u2 = l(e2, o2), { offp: o2 } = u2, s2[0] ^= u2.key, u2 = l(e2, o2), { offp: o2 } = u2, s2[1] ^= u2.key, s2 = c(s2, 0, n2, r2), n2[t3] = s2[0], n2[t3 + 1] = s2[1];
  for (let t3 = 0; t3 < a2; t3 += 2) u2 = l(e2, o2), { offp: o2 } = u2, s2[0] ^= u2.key, u2 = l(e2, o2), { offp: o2 } = u2, s2[1] ^= u2.key, s2 = c(s2, 0, n2, r2), r2[t3] = s2[0], r2[t3 + 1] = s2[1];
}, "d");
var f = /* @__PURE__ */ __name((t2, n2, o2, s2, l2) => {
  let f2 = new Int32Array(a), p2 = f2.length;
  o2 = 1 << o2 >>> 0;
  let m2 = new Int32Array(r), h2 = new Int32Array(i);
  d(n2, t2, m2, h2);
  let g = 0, _2 = /* @__PURE__ */ __name(() => {
    if (l2 && l2(g / o2), g < o2) {
      let e2 = Date.now();
      for (; g < o2 && (g += 1, u(t2, m2, h2), u(n2, m2, h2), !(Date.now() - e2 > 100)); ) ;
    } else {
      for (let e3 = 0; e3 < 64; e3++) for (let e4 = 0; e4 < p2 >> 1; e4++) c(f2, e4 << 1, m2, h2);
      let e2 = [];
      for (let t3 = 0; t3 < p2; t3++) e2.push(f2[t3] >> 24 & 255, f2[t3] >> 16 & 255, f2[t3] >> 8 & 255, f2[t3] & 255);
      return s2 ? e2 : Promise.resolve(e2);
    }
    if (!s2) return new Promise((t3) => {
      e(() => {
        _2().then(t3);
      });
    });
  }, "_");
  if (!s2) return _2();
  let v2;
  do
    v2 = _2();
  while (!v2);
  return v2;
}, "f");
var p = /* @__PURE__ */ __name((e2) => {
  try {
    let t2 = new Uint32Array(e2);
    return globalThis.crypto.getRandomValues(t2), [...t2];
  } catch {
    throw Error(`WebCryptoAPI / globalThis is not available`);
  }
}, "p");
var m = /* @__PURE__ */ __name((...e2) => Error(`Illegal arguments: ${e2.map((e3) => typeof e3).join(`, `)}`), "m");
var h = /* @__PURE__ */ __name((e2 = 10) => {
  if (typeof e2 != `number`) throw m(e2);
  return e2 = Math.max(4, Math.min(31, e2)), `$2b$${e2 < 10 ? `0` : ``}${e2}$${o(p(16), 16)}`;
}, "h");
var _ = /* @__PURE__ */ __name((e2) => {
  let t2 = 0, n2 = 0;
  for (let r2 = 0; r2 < e2.length; ++r2) t2 = e2.charCodeAt(r2), t2 < 128 ? n2 += 1 : t2 < 2048 ? n2 += 2 : (t2 & 64512) == 55296 && (e2.charCodeAt(r2 + 1) & 64512) == 56320 ? (r2++, n2 += 4) : n2 += 3;
  return n2;
}, "_");
var v = /* @__PURE__ */ __name((e2) => {
  let t2 = 0, n2, r2, i2 = Array.from({ length: _(e2) });
  for (let a2 = 0, o2 = e2.length; a2 < o2; ++a2) n2 = e2.charCodeAt(a2), n2 < 128 ? i2[t2++] = n2 : (n2 < 2048 ? i2[t2++] = n2 >> 6 | 192 : ((n2 & 64512) == 55296 && ((r2 = e2.charCodeAt(a2 + 1)) & 64512) == 56320 ? (n2 = 65536 + ((n2 & 1023) << 10) + (r2 & 1023), ++a2, i2[t2++] = n2 >> 18 | 240, i2[t2++] = n2 >> 12 & 63 | 128) : i2[t2++] = n2 >> 12 | 224, i2[t2++] = n2 >> 6 & 63 | 128), i2[t2++] = n2 & 63 | 128);
  return i2;
}, "v");
var y = /* @__PURE__ */ __name((e2, t2, n2, r2) => {
  if (typeof e2 != `string` || typeof t2 != `string`) {
    let e3 = Error(`Invalid content / salt: not a string`);
    if (!n2) return Promise.reject(e3);
    throw e3;
  }
  let i2, c2;
  if (t2.charAt(0) !== `$` || t2.charAt(1) !== `2`) {
    let e3 = Error(`Invalid salt version: ${t2.slice(0, 2)}`);
    if (!n2) return Promise.reject(e3);
    throw e3;
  }
  if (t2.charAt(2) === `$`) i2 = `\0`, c2 = 3;
  else {
    if (i2 = t2.charAt(2), i2 !== `a` && i2 !== `b` && i2 !== `y` || t2.charAt(3) !== `$`) {
      let e3 = Error(`Invalid salt revision: ${t2.slice(2, 4)}`);
      if (!n2) return Promise.reject(e3);
      throw e3;
    }
    c2 = 4;
  }
  let l2 = t2.slice(c2, c2 + 2), u2 = /\d\d/u.test(l2) ? Number(l2) : null;
  if (u2 == null) {
    let e3 = Error(`Missing salt rounds`);
    if (!n2) return Promise.reject(e3);
    throw e3;
  }
  if (u2 < 4 || u2 > 31) {
    let e3 = Error(`Illegal number of rounds (4-31): ${u2}`);
    if (!n2) return Promise.reject(e3);
    throw e3;
  }
  let d2 = t2.slice(c2 + 3, c2 + 25);
  e2 += i2 >= `a` ? `\0` : ``;
  let p2 = v(e2), m2 = s(d2, 16);
  if (m2.length !== 16) {
    let e3 = Error(`Illegal salt: ${d2}`);
    if (!n2) return Promise.reject(e3);
    throw e3;
  }
  let h2 = /* @__PURE__ */ __name((e3) => `$2${i2 >= `a` ? i2 : ``}$${u2 < 10 ? `0` : ``}${u2}$${o(m2, 16)}${o(e3, a.length * 4 - 1)}`, "h");
  return n2 ? h2(f(p2, m2, u2, true, r2)) : f(p2, m2, u2, false, r2).then((e3) => h2(e3));
}, "y");
var b = /* @__PURE__ */ __name((e2, t2 = 10) => y(e2, typeof t2 == `number` ? h(t2) : t2, true), "b");
var S = /* @__PURE__ */ __name((e2, t2) => {
  if (typeof e2 != `string` || typeof t2 != `string`) throw m(e2, t2);
  return t2.length === 60 && b(e2, t2.slice(0, 29)) === t2;
}, "S");

// src/middleware/validation.ts
var validateRequired = /* @__PURE__ */ __name((body, fields) => {
  for (const field of fields) {
    if (body[field] === void 0 || body[field] === null || body[field] === "") {
      return `Field '${field}' wajib diisi.`;
    }
  }
  return null;
}, "validateRequired");
var validateEmail = /* @__PURE__ */ __name((email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}, "validateEmail");
var generateSlug = /* @__PURE__ */ __name((text) => {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s]+/g, "-").replace(/-+/g, "-").trim();
}, "generateSlug");
var parsePagination = /* @__PURE__ */ __name((c2) => {
  const page = Math.max(1, parseInt(c2.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c2.req.query("limit") || "20")));
  const search = c2.req.query("search") || "";
  const sortBy = c2.req.query("sortBy") || "created_at";
  const sortOrder = c2.req.query("sortOrder") || "desc";
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search,
    sortBy,
    sortOrder
  };
}, "parsePagination");
var generateNumber = /* @__PURE__ */ __name((prefix) => {
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}, "generateNumber");

// src/middleware/auth.ts
var authMiddleware = /* @__PURE__ */ __name(async (c2, next) => {
  const authHeader = c2.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c2.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Token tidak ditemukan. Silakan login terlebih dahulu."
      },
      401
    );
  }
  const token = authHeader.substring(7);
  try {
    const secret = new TextEncoder().encode(c2.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name
    };
    c2.set("user", user);
    await next();
  } catch (error) {
    return c2.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Token tidak valid atau sudah expired."
      },
      401
    );
  }
}, "authMiddleware");

// src/routes/auth.ts
var authRoutes = new Hono3();
authRoutes.post("/register", async (c2) => {
  const body = await c2.req.json();
  const { name, email, password, phone } = body;
  const err = validateRequired(body, ["name", "email", "password"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  if (!validateEmail(email)) {
    return c2.json({ success: false, message: "Format email tidak valid." }, 400);
  }
  const db = c2.env.DB;
  try {
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return c2.json({ success: false, message: "Email sudah terdaftar." }, 400);
    }
    const password_hash = b(password, 10);
    const userId = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO users (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, name, email, password_hash, phone || null).run();
    const payload = { userId, email, name };
    const secret = new TextEncoder().encode(c2.env.JWT_SECRET);
    const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
    return c2.json({
      success: true,
      message: "Registrasi berhasil",
      data: { token, user: { id: userId, name, email, phone } }
    }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Registrasi gagal.", error: error.message }, 500);
  }
});
authRoutes.post("/login", async (c2) => {
  const body = await c2.req.json();
  const { email, password } = body;
  const err = validateRequired(body, ["email", "password"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const db = c2.env.DB;
  try {
    const user = await db.prepare("SELECT * FROM users WHERE email = ? AND status = 'active'").bind(email).first();
    if (!user) {
      return c2.json({ success: false, message: "Email atau password salah." }, 401);
    }
    const isValid = S(password, user.password_hash);
    if (!isValid) {
      return c2.json({ success: false, message: "Email atau password salah." }, 401);
    }
    const business = await db.prepare(`
      SELECT b.*, bm.role_id, r.name as role_name 
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active' AND b.status = 'active'
      LIMIT 1
    `).bind(user.id).first();
    const payload = { userId: user.id, email: user.email, name: user.name };
    const secret = new TextEncoder().encode(c2.env.JWT_SECRET);
    const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
    return c2.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar_url: user.avatar_url },
        business: business ? { id: business.id, name: business.name, slug: business.slug } : null,
        role: business ? business.role_name : null
      }
    });
  } catch (error) {
    return c2.json({ success: false, message: "Login gagal.", error: error.message }, 500);
  }
});
authRoutes.use("/*", authMiddleware);
authRoutes.get("/profile", async (c2) => {
  const userPayload = c2.get("user");
  const db = c2.env.DB;
  try {
    const user = await db.prepare("SELECT id, name, email, phone, avatar_url, status, created_at FROM users WHERE id = ?").bind(userPayload.userId).first();
    const businesses = await db.prepare(`
      SELECT b.id, b.name, b.slug, r.name as role
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active'
    `).bind(userPayload.userId).all();
    return c2.json({
      success: true,
      data: {
        user,
        businesses: businesses.results
      }
    });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mengambil profil." }, 500);
  }
});
authRoutes.put("/profile", async (c2) => {
  const userPayload = c2.get("user");
  const body = await c2.req.json();
  const { name, phone } = body;
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const db = c2.env.DB;
  try {
    await db.prepare("UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?").bind(name, phone || null, userPayload.userId).run();
    return c2.json({
      success: true,
      message: "Profil berhasil diperbarui"
    });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal memperbarui profil." }, 500);
  }
});

// src/middleware/tenant.ts
var tenantMiddleware = /* @__PURE__ */ __name(async (c2, next) => {
  const user = c2.get("user");
  if (!user) {
    return c2.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Autentikasi diperlukan."
      },
      401
    );
  }
  const businessId = c2.req.header("X-Business-Id") || c2.req.query("businessId");
  if (!businessId) {
    return c2.json(
      {
        success: false,
        error: "Bad Request",
        message: "Business ID diperlukan. Kirim via header X-Business-Id."
      },
      400
    );
  }
  try {
    const member = await c2.env.DB.prepare(
      `SELECT bm.id, bm.status, r.name as role_name
       FROM business_members bm
       JOIN roles r ON r.id = bm.role_id
       WHERE bm.business_id = ? AND bm.user_id = ? AND bm.status = 'active'`
    ).bind(businessId, user.userId).first();
    if (!member) {
      return c2.json(
        {
          success: false,
          error: "Forbidden",
          message: "Anda tidak memiliki akses ke usaha ini."
        },
        403
      );
    }
    c2.set("businessId", businessId);
    c2.set("role", member.role_name);
    await next();
  } catch (error) {
    return c2.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Gagal memverifikasi akses usaha."
      },
      500
    );
  }
}, "tenantMiddleware");

// src/middleware/role.ts
var roleMiddleware = /* @__PURE__ */ __name((...allowedRoles) => {
  return async (c2, next) => {
    const role = c2.get("role");
    if (!role) {
      return c2.json(
        {
          success: false,
          error: "Forbidden",
          message: "Role tidak ditemukan. Pastikan autentikasi berhasil."
        },
        403
      );
    }
    if (!allowedRoles.includes(role)) {
      return c2.json(
        {
          success: false,
          error: "Forbidden",
          message: `Akses ditolak. Hanya role ${allowedRoles.join(", ")} yang dapat mengakses fitur ini.`
        },
        403
      );
    }
    await next();
  };
}, "roleMiddleware");

// src/routes/businesses.ts
var businessRoutes = new Hono3();
businessRoutes.use("/*", authMiddleware);
businessRoutes.post("/", async (c2) => {
  const user = c2.get("user");
  const body = await c2.req.json();
  const { name, phone, address, city, description } = body;
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const db = c2.env.DB;
  let slug = generateSlug(name);
  try {
    const existingSlug = await db.prepare("SELECT id FROM businesses WHERE slug = ?").bind(slug).first();
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const businessId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO businesses (id, owner_user_id, name, slug, phone, address, city, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(businessId, user.userId, name, slug, phone || null, address || null, city || null, description || null).run();
    await db.prepare(`
      INSERT INTO business_members (business_id, user_id, role_id) 
      VALUES (?, ?, 'role-owner')
    `).bind(businessId, user.userId).run();
    return c2.json({
      success: true,
      message: "Usaha berhasil didaftarkan.",
      data: { id: businessId, name, slug }
    }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mendaftar usaha.", error: error.message }, 500);
  }
});
businessRoutes.get("/", async (c2) => {
  const user = c2.get("user");
  const db = c2.env.DB;
  try {
    const { results } = await db.prepare(`
      SELECT b.*, r.name as role_name 
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.user_id = ? AND bm.status = 'active'
    `).bind(user.userId).all();
    return c2.json({ success: true, data: results });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mengambil data usaha." }, 500);
  }
});
businessRoutes.get("/:id", tenantMiddleware, async (c2) => {
  const businessId = c2.req.param("id");
  if (businessId !== c2.get("businessId")) {
    return c2.json({ success: false, message: "ID Usaha tidak cocok dengan konteks." }, 403);
  }
  const db = c2.env.DB;
  try {
    const business = await db.prepare("SELECT * FROM businesses WHERE id = ?").bind(businessId).first();
    if (!business) return c2.json({ success: false, message: "Usaha tidak ditemukan." }, 404);
    return c2.json({ success: true, data: business });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mengambil data usaha." }, 500);
  }
});
businessRoutes.put("/:id", tenantMiddleware, roleMiddleware("owner", "admin"), async (c2) => {
  const businessId = c2.req.param("id");
  const body = await c2.req.json();
  const { name, phone, address, city, description } = body;
  if (businessId !== c2.get("businessId")) {
    return c2.json({ success: false, message: "ID Usaha tidak cocok dengan konteks." }, 403);
  }
  const db = c2.env.DB;
  try {
    await db.prepare(`
      UPDATE businesses 
      SET name = ?, phone = ?, address = ?, city = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name, phone || null, address || null, city || null, description || null, businessId).run();
    return c2.json({ success: true, message: "Profil usaha diperbarui." });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal memperbarui usaha." }, 500);
  }
});
businessRoutes.get("/:id/members", tenantMiddleware, roleMiddleware("owner", "admin"), async (c2) => {
  const businessId = c2.get("businessId");
  const db = c2.env.DB;
  try {
    const { results } = await db.prepare(`
      SELECT bm.id as member_id, bm.status, u.id as user_id, u.name, u.email, u.phone, r.name as role_name
      FROM business_members bm
      JOIN users u ON u.id = bm.user_id
      JOIN roles r ON r.id = bm.role_id
      WHERE bm.business_id = ?
    `).bind(businessId).all();
    return c2.json({ success: true, data: results });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mengambil data anggota." }, 500);
  }
});
businessRoutes.post("/:id/members", tenantMiddleware, roleMiddleware("owner"), async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const { name, email, role_name, password, phone } = body;
  const err = validateRequired(body, ["name", "email", "role_name", "password"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const db = c2.env.DB;
  try {
    let roleId = "role-sales";
    if (role_name === "admin") roleId = "role-admin";
    if (role_name === "owner") roleId = "role-owner";
    let user = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      const userId = crypto.randomUUID();
      const password_hash = b(password, 10);
      await db.prepare(
        "INSERT INTO users (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)"
      ).bind(userId, name, email, password_hash, phone || null).run();
      user = { id: userId };
    }
    const existingMember = await db.prepare("SELECT id FROM business_members WHERE business_id = ? AND user_id = ?").bind(businessId, user.id).first();
    if (existingMember) {
      return c2.json({ success: false, message: "Pengguna sudah menjadi anggota di usaha ini." }, 400);
    }
    await db.prepare(`
      INSERT INTO business_members (business_id, user_id, role_id) 
      VALUES (?, ?, ?)
    `).bind(businessId, user.id, roleId).run();
    return c2.json({ success: true, message: "Anggota berhasil ditambahkan." }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal menambahkan anggota.", error: error.message }, 500);
  }
});
businessRoutes.put("/:id/members/:memberId", tenantMiddleware, roleMiddleware("owner"), async (c2) => {
  const businessId = c2.get("businessId");
  const memberId = c2.req.param("memberId");
  const body = await c2.req.json();
  const { role_name, status } = body;
  const db = c2.env.DB;
  try {
    if (role_name) {
      let roleId = "role-sales";
      if (role_name === "admin") roleId = "role-admin";
      if (role_name === "owner") roleId = "role-owner";
      await db.prepare("UPDATE business_members SET role_id = ? WHERE id = ? AND business_id = ?").bind(roleId, memberId, businessId).run();
    }
    if (status) {
      await db.prepare("UPDATE business_members SET status = ? WHERE id = ? AND business_id = ?").bind(status, memberId, businessId).run();
    }
    return c2.json({ success: true, message: "Data anggota diperbarui." });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal memperbarui anggota." }, 500);
  }
});

// src/routes/products.ts
var productRoutes = new Hono3();
productRoutes.use("/*", authMiddleware, tenantMiddleware);
productRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE p.business_id = ?
  `;
  const params = [businessId];
  if (search) {
    query += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM products WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND (name LIKE ? OR sku LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
productRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const sku = body.sku || generateNumber("PRD");
  await c2.env.DB.prepare(
    "INSERT INTO products (id, business_id, category_id, name, sku, description, product_type, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, businessId, body.category_id || null, body.name, sku, body.description || null, body.product_type || "self", body.image_url || null, body.status || "active").run();
  return c2.json({ success: true, data: { id, ...body, sku } }, 201);
});
productRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM products WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Produk tidak ditemukan" }, 404);
  const { results: variants } = await c2.env.DB.prepare("SELECT * FROM product_variants WHERE product_id = ? AND business_id = ?").bind(id, businessId).all();
  return c2.json({ success: true, data: { ...result, variants } });
});
productRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE products SET category_id = ?, name = ?, sku = ?, description = ?, product_type = ?, image_url = ?, status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.category_id || null, body.name, body.sku, body.description || null, body.product_type || "self", body.image_url || null, body.status || "active", id, businessId).run();
  return c2.json({ success: true, message: "Produk diperbarui" });
});
productRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const variants = await c2.env.DB.prepare("SELECT id FROM product_variants WHERE product_id = ? AND business_id = ?").bind(id, businessId).first();
  if (variants) return c2.json({ success: false, message: "Gagal dihapus: Hapus varian terlebih dahulu" }, 400);
  await c2.env.DB.prepare("DELETE FROM products WHERE id = ? AND business_id = ?").bind(id, businessId).run();
  return c2.json({ success: true, message: "Produk dihapus" });
});
productRoutes.get("/:id/variants", async (c2) => {
  const businessId = c2.get("businessId");
  const productId = c2.req.param("id");
  const { results } = await c2.env.DB.prepare(`
    SELECT v.*, u.name as unit_name, u.symbol as unit_symbol 
    FROM product_variants v
    LEFT JOIN units u ON u.id = v.unit_id
    WHERE v.product_id = ? AND v.business_id = ?
  `).bind(productId, businessId).all();
  return c2.json({ success: true, data: results });
});
productRoutes.post("/:id/variants", async (c2) => {
  const businessId = c2.get("businessId");
  const productId = c2.req.param("id");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const sku = body.sku || generateNumber("VAR");
  await c2.env.DB.prepare(`
    INSERT INTO product_variants 
    (id, business_id, product_id, name, sku, barcode, unit_id, price_production, price_sales, price_agent, weight, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    businessId,
    productId,
    body.name,
    sku,
    body.barcode || null,
    body.unit_id || null,
    body.price_production || 0,
    body.price_sales || 0,
    body.price_agent || 0,
    body.weight || 0,
    body.status || "active"
  ).run();
  return c2.json({ success: true, data: { id, ...body, sku } }, 201);
});
productRoutes.put("/:id/variants/:variantId", async (c2) => {
  const businessId = c2.get("businessId");
  const productId = c2.req.param("id");
  const variantId = c2.req.param("variantId");
  const body = await c2.req.json();
  await c2.env.DB.prepare(`
    UPDATE product_variants 
    SET name = ?, sku = ?, barcode = ?, unit_id = ?, price_production = ?, price_sales = ?, price_agent = ?, weight = ?, status = ?, updated_at = datetime("now")
    WHERE id = ? AND product_id = ? AND business_id = ?
  `).bind(body.name, body.sku, body.barcode || null, body.unit_id || null, body.price_production || 0, body.price_sales || 0, body.price_agent || 0, body.weight || 0, body.status || "active", variantId, productId, businessId).run();
  return c2.json({ success: true, message: "Varian diperbarui" });
});
productRoutes.delete("/:id/variants/:variantId", async (c2) => {
  const businessId = c2.get("businessId");
  const productId = c2.req.param("id");
  const variantId = c2.req.param("variantId");
  await c2.env.DB.prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ? AND business_id = ?").bind(variantId, productId, businessId).run();
  return c2.json({ success: true, message: "Varian dihapus" });
});

// src/routes/categories.ts
var categoryRoutes = new Hono3();
categoryRoutes.use("/*", authMiddleware, tenantMiddleware);
categoryRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM product_categories WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM product_categories WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND name LIKE ?";
    countParams.push(`%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
categoryRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  await c2.env.DB.prepare(
    "INSERT INTO product_categories (id, business_id, name, description, status) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, businessId, body.name, body.description || null, body.status || "active").run();
  return c2.json({ success: true, data: { id, ...body } }, 201);
});
categoryRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM product_categories WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Kategori tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});
categoryRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE product_categories SET name = ?, description = ?, status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.description || null, body.status || "active", id, businessId).run();
  return c2.json({ success: true, message: "Kategori diperbarui" });
});
categoryRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const products = await c2.env.DB.prepare("SELECT id FROM products WHERE category_id = ? AND business_id = ?").bind(id, businessId).first();
  if (products) return c2.json({ success: false, message: "Gagal dihapus: Kategori sedang digunakan oleh produk" }, 400);
  await c2.env.DB.prepare("DELETE FROM product_categories WHERE id = ? AND business_id = ?").bind(id, businessId).run();
  return c2.json({ success: true, message: "Kategori dihapus" });
});

// src/routes/units.ts
var unitRoutes = new Hono3();
unitRoutes.use("/*", authMiddleware, tenantMiddleware);
unitRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM units WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM units WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND name LIKE ?";
    countParams.push(`%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
unitRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name", "symbol"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  await c2.env.DB.prepare(
    "INSERT INTO units (id, business_id, name, symbol) VALUES (?, ?, ?, ?)"
  ).bind(id, businessId, body.name, body.symbol).run();
  return c2.json({ success: true, data: { id, ...body } }, 201);
});
unitRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM units WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Satuan tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});
unitRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE units SET name = ?, symbol = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.symbol, id, businessId).run();
  return c2.json({ success: true, message: "Satuan diperbarui" });
});
unitRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const variants = await c2.env.DB.prepare("SELECT id FROM product_variants WHERE unit_id = ? AND business_id = ?").bind(id, businessId).first();
  if (variants) return c2.json({ success: false, message: "Gagal dihapus: Satuan sedang digunakan" }, 400);
  await c2.env.DB.prepare("DELETE FROM units WHERE id = ? AND business_id = ?").bind(id, businessId).run();
  return c2.json({ success: true, message: "Satuan dihapus" });
});

// src/routes/suppliers.ts
var supplierRoutes = new Hono3();
supplierRoutes.use("/*", authMiddleware, tenantMiddleware);
supplierRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM suppliers WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM suppliers WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND name LIKE ?";
    countParams.push(`%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
supplierRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name", "type"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  await c2.env.DB.prepare(
    "INSERT INTO suppliers (id, business_id, name, contact_person, phone, email, address, city, type, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    businessId,
    body.name,
    body.contact_person || null,
    body.phone || null,
    body.email || null,
    body.address || null,
    body.city || null,
    body.type || "production",
    body.notes || null,
    body.status || "active"
  ).run();
  return c2.json({ success: true, data: { id, ...body } }, 201);
});
supplierRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM suppliers WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Supplier tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});
supplierRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(`
    UPDATE suppliers 
    SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, type = ?, notes = ?, status = ?, updated_at = datetime("now") 
    WHERE id = ? AND business_id = ?
  `).bind(
    body.name,
    body.contact_person || null,
    body.phone || null,
    body.email || null,
    body.address || null,
    body.city || null,
    body.type || "production",
    body.notes || null,
    body.status || "active",
    id,
    businessId
  ).run();
  return c2.json({ success: true, message: "Supplier diperbarui" });
});
supplierRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const batches = await c2.env.DB.prepare("SELECT id FROM product_batches WHERE supplier_id = ? AND business_id = ?").bind(id, businessId).first();
  if (batches) return c2.json({ success: false, message: "Gagal dihapus: Supplier sedang digunakan pada data batch produk" }, 400);
  await c2.env.DB.prepare("DELETE FROM suppliers WHERE id = ? AND business_id = ?").bind(id, businessId).run();
  return c2.json({ success: true, message: "Supplier dihapus" });
});

// src/routes/uploads.ts
var uploadRoutes = new Hono3();
uploadRoutes.use("/*", authMiddleware, tenantMiddleware);
uploadRoutes.post("/image", async (c2) => {
  const businessId = c2.get("businessId");
  try {
    const body = await c2.req.parseBody();
    const file = body["file"];
    if (!file) return c2.json({ success: false, message: "File tidak ditemukan" }, 400);
    if (!file.type.startsWith("image/")) return c2.json({ success: false, message: "File harus berupa gambar" }, 400);
    const ext = file.name.split(".").pop();
    const fileName = `${businessId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    await c2.env.STORAGE.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    const url = `/api/uploads/${fileName}`;
    return c2.json({ success: true, data: { url, key: fileName } });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mengupload gambar", error: error.message }, 500);
  }
});
uploadRoutes.get("/:businessId/:fileName", async (c2) => {
  const businessId = c2.req.param("businessId");
  const fileName = c2.req.param("fileName");
  const key = `${businessId}/${fileName}`;
  const object = await c2.env.STORAGE.get(key);
  if (!object) return c2.text("Not found", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
});
uploadRoutes.delete("/:key", async (c2) => {
  const businessId = c2.get("businessId");
  const key = c2.req.param("key");
  if (!key.startsWith(businessId)) {
    return c2.json({ success: false, message: "Unauthorized access to delete file" }, 403);
  }
  await c2.env.STORAGE.delete(key);
  return c2.json({ success: true, message: "File deleted" });
});

// src/routes/locations.ts
var locationRoutes = new Hono3();
locationRoutes.use("/*", authMiddleware, tenantMiddleware);
locationRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM stock_locations WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM stock_locations WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND name LIKE ?";
    countParams.push(`%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
locationRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name", "type"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  await c2.env.DB.prepare(
    "INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, businessId, body.type, body.reference_id || null, body.name).run();
  return c2.json({ success: true, data: { id, ...body } }, 201);
});
locationRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE stock_locations SET name = ?, type = ?, reference_id = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(body.name, body.type, body.reference_id || null, id, businessId).run();
  return c2.json({ success: true, message: "Lokasi diperbarui" });
});
locationRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const balances = await c2.env.DB.prepare("SELECT id FROM stock_balances WHERE location_id = ? AND business_id = ? AND quantity > 0").bind(id, businessId).first();
  if (balances) return c2.json({ success: false, message: "Gagal dihapus: Masih terdapat stok di lokasi ini" }, 400);
  await c2.env.DB.prepare("DELETE FROM stock_locations WHERE id = ? AND business_id = ?").bind(id, businessId).run();
  return c2.json({ success: true, message: "Lokasi dihapus" });
});

// src/routes/batches.ts
var batchRoutes = new Hono3();
batchRoutes.use("/*", authMiddleware, tenantMiddleware);
batchRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = `
    SELECT b.*, p.name as product_name, v.name as variant_name 
    FROM product_batches b
    JOIN products p ON p.id = b.product_id
    JOIN product_variants v ON v.id = b.variant_id
    WHERE b.business_id = ?
  `;
  const params = [businessId];
  if (search) {
    query += " AND (b.batch_number LIKE ? OR p.name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM product_batches WHERE business_id = ?";
  const countParams = [businessId];
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
batchRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["product_id", "variant_id", "source_type", "production_date", "expired_date"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const batchNumber = body.batch_number || generateNumber("BCH");
  await c2.env.DB.prepare(`
    INSERT INTO product_batches 
    (id, business_id, product_id, variant_id, batch_number, source_type, supplier_id, production_date, expired_date, quantity_initial, quantity_available, production_cost, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    businessId,
    body.product_id,
    body.variant_id,
    batchNumber,
    body.source_type,
    body.supplier_id || null,
    body.production_date,
    body.expired_date,
    body.quantity_initial || 0,
    body.quantity_initial || 0,
    body.production_cost || 0,
    body.notes || null
  ).run();
  return c2.json({ success: true, data: { id, batch_number: batchNumber } }, 201);
});
batchRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM product_batches WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Batch tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});

// src/routes/inventory.ts
var inventoryRoutes = new Hono3();
inventoryRoutes.use("/*", authMiddleware, tenantMiddleware);
inventoryRoutes.get("/balances", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  const locationId = c2.req.query("location_id");
  let query = `
    SELECT sb.*, p.name as product_name, p.sku as product_sku, v.name as variant_name, b.batch_number, l.name as location_name 
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    JOIN product_variants v ON v.id = sb.variant_id
    JOIN stock_locations l ON l.id = sb.location_id
    LEFT JOIN product_batches b ON b.id = sb.batch_id
    WHERE sb.business_id = ? AND sb.quantity > 0
  `;
  const params = [businessId];
  if (locationId) {
    query += " AND sb.location_id = ?";
    params.push(locationId);
  }
  if (search) {
    query += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY p.name ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    WHERE sb.business_id = ? AND sb.quantity > 0
  `;
  const countParams = [businessId];
  if (locationId) {
    countQuery += " AND sb.location_id = ?";
    countParams.push(locationId);
  }
  if (search) {
    countQuery += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
inventoryRoutes.get("/movements", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const { results } = await c2.env.DB.prepare(`
    SELECT sm.*, p.name as product_name, v.name as variant_name, 
           lf.name as from_location, lt.name as to_location, u.name as actor_name
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    JOIN product_variants v ON v.id = sm.variant_id
    LEFT JOIN stock_locations lf ON lf.id = sm.from_location_id
    LEFT JOIN stock_locations lt ON lt.id = sm.to_location_id
    LEFT JOIN users u ON u.id = sm.created_by
    WHERE sm.business_id = ?
    ORDER BY sm.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  const totalRes = await c2.env.DB.prepare("SELECT COUNT(*) as total FROM stock_movements WHERE business_id = ?").bind(businessId).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});

// src/routes/production.ts
var productionRoutes = new Hono3();
productionRoutes.use("/*", authMiddleware, tenantMiddleware);
productionRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const { results } = await c2.env.DB.prepare(`
    SELECT po.*, u.name as created_by_name 
    FROM production_orders po
    JOIN users u ON u.id = po.created_by
    WHERE po.business_id = ?
    ORDER BY po.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  const totalRes = await c2.env.DB.prepare("SELECT COUNT(*) as total FROM production_orders WHERE business_id = ?").bind(businessId).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
productionRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["production_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item produksi tidak boleh kosong" }, 400);
  const orderId = crypto.randomUUID();
  const productionNumber = generateNumber("PRD-ORD");
  const location = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
  if (!location) return c2.json({ success: false, message: "Lokasi gudang utama belum disetup. Silahkan setup di master data lokasi." }, 400);
  const locationId = location.id;
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO production_orders (id, business_id, production_number, production_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, businessId, productionNumber, body.production_date, "completed", body.notes || null, user.userId)
  );
  for (const item of items) {
    const itemId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const batchNumber = item.batch_number || generateNumber("BCH");
    statements.push(
      c2.env.DB.prepare(`
         INSERT INTO product_batches 
         (id, business_id, product_id, variant_id, batch_number, source_type, production_date, expired_date, quantity_initial, quantity_available, production_cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(
        batchId,
        businessId,
        item.product_id,
        item.variant_id,
        batchNumber,
        "self_production",
        body.production_date,
        item.expired_date || "2099-12-31",
        item.quantity,
        item.quantity,
        item.production_cost || 0
      )
    );
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO production_order_items (id, production_order_id, product_id, variant_id, batch_id, quantity, production_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, orderId, item.product_id, item.variant_id, batchId, item.quantity, item.production_cost || 0)
    );
    const movementId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
         INSERT INTO stock_movements 
         (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(movementId, businessId, item.product_id, item.variant_id, batchId, locationId, item.quantity, "production_in", "production_orders", orderId, user.userId)
    );
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(location_id, product_id, variant_id, batch_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
      `).bind(crypto.randomUUID(), businessId, locationId, item.product_id, item.variant_id, batchId, item.quantity)
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Produksi berhasil dicatat", data: { id: orderId } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mencatat produksi", error: error.message }, 500);
  }
});

// src/routes/receipts.ts
var receiptRoutes = new Hono3();
receiptRoutes.use("/*", authMiddleware, tenantMiddleware);
receiptRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const { results } = await c2.env.DB.prepare(`
    SELECT sr.*, s.name as supplier_name, u.name as created_by_name 
    FROM supplier_receipts sr
    JOIN suppliers s ON s.id = sr.supplier_id
    JOIN users u ON u.id = sr.created_by
    WHERE sr.business_id = ?
    ORDER BY sr.created_at DESC LIMIT ? OFFSET ?
  `).bind(businessId, limit, offset).all();
  const totalRes = await c2.env.DB.prepare("SELECT COUNT(*) as total FROM supplier_receipts WHERE business_id = ?").bind(businessId).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
receiptRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["supplier_id", "receipt_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item penerimaan tidak boleh kosong" }, 400);
  const receiptId = crypto.randomUUID();
  const receiptNumber = generateNumber("RCV");
  const location = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
  if (!location) return c2.json({ success: false, message: "Lokasi gudang utama belum disetup. Silahkan setup di master data lokasi." }, 400);
  const locationId = location.id;
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO supplier_receipts (id, business_id, supplier_id, receipt_number, receipt_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(receiptId, businessId, body.supplier_id, receiptNumber, body.receipt_date, "completed", body.notes || null, user.userId)
  );
  for (const item of items) {
    const itemId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const batchNumber = item.batch_number || generateNumber("BCH-S");
    statements.push(
      c2.env.DB.prepare(`
         INSERT INTO product_batches 
         (id, business_id, product_id, variant_id, batch_number, source_type, supplier_id, production_date, expired_date, quantity_initial, quantity_available, production_cost) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(
        batchId,
        businessId,
        item.product_id,
        item.variant_id,
        batchNumber,
        "supplier",
        body.supplier_id,
        body.receipt_date,
        item.expired_date || "2099-12-31",
        item.quantity,
        item.quantity,
        item.cost || 0
      )
    );
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO supplier_receipt_items (id, receipt_id, product_id, variant_id, batch_id, quantity, cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, receiptId, item.product_id, item.variant_id, batchId, item.quantity, item.cost || 0)
    );
    const movementId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
         INSERT INTO stock_movements 
         (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `).bind(movementId, businessId, item.product_id, item.variant_id, batchId, locationId, item.quantity, "supplier_receipt", "supplier_receipts", receiptId, user.userId)
    );
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(location_id, product_id, variant_id, batch_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
      `).bind(crypto.randomUUID(), businessId, locationId, item.product_id, item.variant_id, batchId, item.quantity)
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Penerimaan berhasil dicatat", data: { id: receiptId } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal mencatat penerimaan", error: error.message }, 500);
  }
});

// src/routes/agents.ts
var agentRoutes = new Hono3();
agentRoutes.use("/*", authMiddleware, tenantMiddleware);
agentRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM agents WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND (name LIKE ? OR code LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM agents WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND (name LIKE ? OR code LIKE ? OR email LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
agentRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const code = body.code || generateNumber("AGN");
  await c2.env.DB.prepare(
    "INSERT INTO agents (id, business_id, code, name, contact_person, phone, email, address, city, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    businessId,
    code,
    body.name,
    body.contact_person || null,
    body.phone || null,
    body.email || null,
    body.address || null,
    body.city || null,
    body.status || "active",
    body.notes || null
  ).run();
  return c2.json({ success: true, data: { id, code, ...body } }, 201);
});
agentRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM agents WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Agen tidak ditemukan" }, 404);
  const rule = await c2.env.DB.prepare('SELECT * FROM agent_rules WHERE agent_id = ? AND business_id = ? AND status = "active"').bind(id, businessId).first();
  return c2.json({ success: true, data: { ...result, rule } });
});
agentRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE agents SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, city = ?, status = ?, notes = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(
    body.name,
    body.contact_person || null,
    body.phone || null,
    body.email || null,
    body.address || null,
    body.city || null,
    body.status || "active",
    body.notes || null,
    id,
    businessId
  ).run();
  return c2.json({ success: true, message: "Agen diperbarui" });
});
agentRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const orders = await c2.env.DB.prepare("SELECT id FROM agent_orders WHERE agent_id = ? AND business_id = ? LIMIT 1").bind(id, businessId).first();
  if (orders) return c2.json({ success: false, message: "Gagal dihapus: Agen sudah memiliki riwayat pesanan" }, 400);
  await c2.env.DB.batch([
    c2.env.DB.prepare("DELETE FROM agent_rules WHERE agent_id = ? AND business_id = ?").bind(id, businessId),
    c2.env.DB.prepare("DELETE FROM agents WHERE id = ? AND business_id = ?").bind(id, businessId)
  ]);
  return c2.json({ success: true, message: "Agen dihapus" });
});
agentRoutes.post("/:id/rules", async (c2) => {
  const businessId = c2.get("businessId");
  const agentId = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare('UPDATE agent_rules SET status = "inactive" WHERE agent_id = ? AND business_id = ?').bind(agentId, businessId).run();
  const ruleId = crypto.randomUUID();
  await c2.env.DB.prepare(
    "INSERT INTO agent_rules (id, business_id, agent_id, minimum_order, price_type, custom_discount_percent, return_policy, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    ruleId,
    businessId,
    agentId,
    body.minimum_order || 0,
    body.price_type || "agent",
    body.custom_discount_percent || null,
    body.return_policy || null,
    "active"
  ).run();
  return c2.json({ success: true, message: "Ketentuan agen berhasil diperbarui", data: { id: ruleId } }, 201);
});

// src/routes/agent_orders.ts
var agentOrderRoutes = new Hono3();
agentOrderRoutes.use("/*", authMiddleware, tenantMiddleware);
agentOrderRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const status = c2.req.query("status");
  let query = `
    SELECT ao.*, a.name as agent_name, u.name as created_by_name 
    FROM agent_orders ao
    JOIN agents a ON a.id = ao.agent_id
    LEFT JOIN users u ON u.id = ao.created_by
    WHERE ao.business_id = ?
  `;
  const params = [businessId];
  if (status) {
    query += " AND ao.status = ?";
    params.push(status);
  }
  query += " ORDER BY ao.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM agent_orders WHERE business_id = ?";
  const countParams = [businessId];
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
agentOrderRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["agent_id", "order_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item pesanan tidak boleh kosong" }, 400);
  const rule = await c2.env.DB.prepare('SELECT minimum_order FROM agent_rules WHERE agent_id = ? AND business_id = ? AND status = "active"').bind(body.agent_id, businessId).first();
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  if (rule && rule.minimum_order > 0 && totalQty < rule.minimum_order) {
    return c2.json({ success: false, message: `Minimum order agen ini adalah ${rule.minimum_order} item, saat ini total ${totalQty} item` }, 400);
  }
  const orderId = crypto.randomUUID();
  const orderNumber = generateNumber("AGN-ORD");
  let total = 0;
  items.forEach((item) => {
    total += item.quantity * item.price;
  });
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO agent_orders (id, business_id, agent_id, order_number, order_date, status, total, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, businessId, body.agent_id, orderNumber, body.order_date, "pending", total, body.notes || null, user.userId)
  );
  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO agent_order_items (id, order_id, product_id, variant_id, batch_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, orderId, item.product_id, item.variant_id, item.batch_id || null, item.quantity, item.price, item.quantity * item.price)
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Pesanan agen berhasil dibuat", data: { id: orderId } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal membuat pesanan", error: error.message }, 500);
  }
});
agentOrderRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const order2 = await c2.env.DB.prepare(`
    SELECT ao.*, a.name as agent_name 
    FROM agent_orders ao
    JOIN agents a ON a.id = ao.agent_id
    WHERE ao.id = ? AND ao.business_id = ?
  `).bind(id, businessId).first();
  if (!order2) return c2.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  const { results: items } = await c2.env.DB.prepare(`
    SELECT aoi.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM agent_order_items aoi
    JOIN products p ON p.id = aoi.product_id
    JOIN product_variants v ON v.id = aoi.variant_id
    LEFT JOIN product_batches b ON b.id = aoi.batch_id
    WHERE aoi.order_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...order2, items } });
});
agentOrderRoutes.put("/:id/status", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const newStatus = body.status;
  if (!["pending", "approved", "preparing", "shipped", "completed", "cancelled"].includes(newStatus)) {
    return c2.json({ success: false, message: "Status tidak valid" }, 400);
  }
  const order2 = await c2.env.DB.prepare("SELECT status FROM agent_orders WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!order2) return c2.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  const currentStatus = order2.status;
  if (newStatus === "shipped" && currentStatus !== "shipped" && currentStatus !== "completed") {
    const location = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
    if (!location) return c2.json({ success: false, message: "Lokasi gudang utama belum disetup." }, 400);
    const locationId = location.id;
    const { results: items } = await c2.env.DB.prepare("SELECT * FROM agent_order_items WHERE order_id = ?").bind(id).all();
    const statements = [];
    statements.push(
      c2.env.DB.prepare('UPDATE agent_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id)
    );
    for (const item of items) {
      const movementId = crypto.randomUUID();
      statements.push(
        c2.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementId, businessId, item.product_id, item.variant_id, item.batch_id || null, locationId, item.quantity, "agent_distribution", "agent_orders", id, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE business_id = ? AND location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(item.quantity, businessId, locationId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
      );
    }
    try {
      await c2.env.DB.batch(statements);
      return c2.json({ success: true, message: "Status pesanan diperbarui dan stok berhasil didistribusikan" });
    } catch (error) {
      return c2.json({ success: false, message: "Gagal mendistribusikan stok", error: error.message }, 500);
    }
  } else {
    await c2.env.DB.prepare('UPDATE agent_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id).run();
    return c2.json({ success: true, message: `Status pesanan diperbarui menjadi ${newStatus}` });
  }
});

// src/routes/sales.ts
var salesRoutes = new Hono3();
salesRoutes.use("/*", authMiddleware, tenantMiddleware);
salesRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT s.*, u.name as user_name FROM sales s LEFT JOIN users u ON u.id = s.user_id WHERE s.business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND (s.name LIKE ? OR s.sales_code LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM sales WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND (name LIKE ? OR sales_code LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
salesRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const salesCode = body.sales_code || generateNumber("SLS");
  const statements = [];
  statements.push(
    c2.env.DB.prepare(
      "INSERT INTO sales (id, business_id, user_id, sales_code, name, phone, status, area, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      businessId,
      body.user_id || null,
      salesCode,
      body.name,
      body.phone || null,
      body.status || "active",
      body.area || null,
      body.notes || null
    )
  );
  const locationId = crypto.randomUUID();
  statements.push(
    c2.env.DB.prepare(
      "INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)"
    ).bind(locationId, businessId, "sales", id, `Mobil/Motor Sales: ${body.name}`)
  );
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, data: { id, sales_code: salesCode, ...body } }, 201);
});
salesRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT s.*, u.name as user_name FROM sales s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Sales tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});
salesRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const statements = [];
  statements.push(
    c2.env.DB.prepare(
      'UPDATE sales SET user_id = ?, name = ?, phone = ?, status = ?, area = ?, notes = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
    ).bind(
      body.user_id || null,
      body.name,
      body.phone || null,
      body.status || "active",
      body.area || null,
      body.notes || null,
      id,
      businessId
    )
  );
  statements.push(
    c2.env.DB.prepare(
      'UPDATE stock_locations SET name = ?, updated_at = datetime("now") WHERE reference_id = ? AND type = "sales" AND business_id = ?'
    ).bind(`Mobil/Motor Sales: ${body.name}`, id, businessId)
  );
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Sales diperbarui" });
});
salesRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const visits = await c2.env.DB.prepare("SELECT id FROM sales_visits WHERE sales_id = ? AND business_id = ? LIMIT 1").bind(id, businessId).first();
  if (visits) return c2.json({ success: false, message: "Gagal dihapus: Sales memiliki riwayat kunjungan" }, 400);
  const statements = [
    c2.env.DB.prepare('DELETE FROM stock_locations WHERE reference_id = ? AND type = "sales" AND business_id = ?').bind(id, businessId),
    c2.env.DB.prepare("DELETE FROM sales WHERE id = ? AND business_id = ?").bind(id, businessId)
  ];
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Sales dihapus" });
});

// src/routes/stores.ts
var storeRoutes = new Hono3();
storeRoutes.use("/*", authMiddleware, tenantMiddleware);
storeRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM stores WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND (name LIKE ? OR store_code LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM stores WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND (name LIKE ? OR store_code LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
storeRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const storeCode = body.store_code || generateNumber("TOK");
  const statements = [];
  statements.push(
    c2.env.DB.prepare(
      `INSERT INTO stores 
      (id, business_id, store_code, name, owner_name, phone, address, district, city, latitude, longitude, type, status, notes, registered_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      businessId,
      storeCode,
      body.name,
      body.owner_name || null,
      body.phone || null,
      body.address || null,
      body.district || null,
      body.city || null,
      body.latitude || null,
      body.longitude || null,
      body.type || "retail",
      body.status || "active",
      body.notes || null,
      user.userId
    )
  );
  const locationId = crypto.randomUUID();
  statements.push(
    c2.env.DB.prepare(
      "INSERT INTO stock_locations (id, business_id, type, reference_id, name) VALUES (?, ?, ?, ?, ?)"
    ).bind(locationId, businessId, "store", id, `Toko: ${body.name}`)
  );
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, data: { id, store_code: storeCode, ...body } }, 201);
});
storeRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare("SELECT * FROM stores WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Toko tidak ditemukan" }, 404);
  return c2.json({ success: true, data: result });
});
storeRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const statements = [];
  statements.push(
    c2.env.DB.prepare(
      `UPDATE stores SET 
        name = ?, owner_name = ?, phone = ?, address = ?, district = ?, city = ?, 
        latitude = ?, longitude = ?, type = ?, status = ?, notes = ?, updated_at = datetime("now") 
      WHERE id = ? AND business_id = ?`
    ).bind(
      body.name,
      body.owner_name || null,
      body.phone || null,
      body.address || null,
      body.district || null,
      body.city || null,
      body.latitude || null,
      body.longitude || null,
      body.type || "retail",
      body.status || "active",
      body.notes || null,
      id,
      businessId
    )
  );
  statements.push(
    c2.env.DB.prepare(
      'UPDATE stock_locations SET name = ?, updated_at = datetime("now") WHERE reference_id = ? AND type = "store" AND business_id = ?'
    ).bind(`Toko: ${body.name}`, id, businessId)
  );
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Toko diperbarui" });
});
storeRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const visits = await c2.env.DB.prepare("SELECT id FROM sales_visits WHERE store_id = ? AND business_id = ? LIMIT 1").bind(id, businessId).first();
  if (visits) return c2.json({ success: false, message: "Gagal dihapus: Toko memiliki riwayat kunjungan" }, 400);
  const statements = [
    c2.env.DB.prepare('DELETE FROM stock_locations WHERE reference_id = ? AND type = "store" AND business_id = ?').bind(id, businessId),
    c2.env.DB.prepare("DELETE FROM stores WHERE id = ? AND business_id = ?").bind(id, businessId)
  ];
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Toko dihapus" });
});

// src/routes/distributions.ts
var distributionRoutes = new Hono3();
distributionRoutes.use("/*", authMiddleware, tenantMiddleware);
distributionRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const type = c2.req.query("type") || "sales";
  let query = `
    SELECT d.*, 
           CASE WHEN d.type = 'sales' THEN s.name ELSE a.name END as target_name
    FROM distributions d
    LEFT JOIN sales s ON s.id = d.target_id AND d.type = 'sales'
    LEFT JOIN agents a ON a.id = d.target_id AND d.type = 'agent'
    WHERE d.business_id = ? AND d.type = ?
    ORDER BY d.created_at DESC LIMIT ? OFFSET ?
  `;
  const params = [businessId, type, limit, offset];
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  const countQuery = "SELECT COUNT(*) as total FROM distributions WHERE business_id = ? AND type = ?";
  const totalRes = await c2.env.DB.prepare(countQuery).bind(businessId, type).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
distributionRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["target_id", "distribution_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item distribusi tidak boleh kosong" }, 400);
  const distributionId = crypto.randomUUID();
  const distributionNumber = generateNumber("DST");
  const type = body.type || "sales";
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO distributions (id, business_id, distribution_number, type, target_id, distribution_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(distributionId, businessId, distributionNumber, type, body.target_id, body.distribution_date, "draft", body.notes || null, user.userId)
  );
  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO distribution_items (id, distribution_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(itemId, distributionId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Distribusi berhasil dibuat", data: { id: distributionId } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal membuat distribusi", error: error.message }, 500);
  }
});
distributionRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const distribution = await c2.env.DB.prepare(`
    SELECT d.*, 
           CASE WHEN d.type = 'sales' THEN s.name ELSE a.name END as target_name
    FROM distributions d
    LEFT JOIN sales s ON s.id = d.target_id AND d.type = 'sales'
    LEFT JOIN agents a ON a.id = d.target_id AND d.type = 'agent'
    WHERE d.id = ? AND d.business_id = ?
  `).bind(id, businessId).first();
  if (!distribution) return c2.json({ success: false, message: "Distribusi tidak ditemukan" }, 404);
  const { results: items } = await c2.env.DB.prepare(`
    SELECT di.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM distribution_items di
    JOIN products p ON p.id = di.product_id
    JOIN product_variants v ON v.id = di.variant_id
    LEFT JOIN product_batches b ON b.id = di.batch_id
    WHERE di.distribution_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...distribution, items } });
});
distributionRoutes.put("/:id/status", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const newStatus = body.status;
  if (!["draft", "approved", "in_transit", "completed", "cancelled"].includes(newStatus)) {
    return c2.json({ success: false, message: "Status tidak valid" }, 400);
  }
  const distribution = await c2.env.DB.prepare("SELECT type, target_id, status FROM distributions WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!distribution) return c2.json({ success: false, message: "Distribusi tidak ditemukan" }, 404);
  const currentStatus = distribution.status;
  if ((newStatus === "in_transit" || newStatus === "completed") && (currentStatus === "draft" || currentStatus === "approved")) {
    const warehouse = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = 'warehouse' LIMIT 1").bind(businessId).first();
    if (!warehouse) return c2.json({ success: false, message: "Lokasi gudang utama belum disetup." }, 400);
    const targetLoc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE business_id = ? AND type = ? AND reference_id = ? LIMIT 1").bind(businessId, distribution.type, distribution.target_id).first();
    if (!targetLoc) return c2.json({ success: false, message: `Lokasi ${distribution.type} tidak ditemukan.` }, 400);
    const warehouseId = warehouse.id;
    const targetLocId = targetLoc.id;
    const { results: items } = await c2.env.DB.prepare("SELECT * FROM distribution_items WHERE distribution_id = ?").bind(id).all();
    const statements = [];
    statements.push(
      c2.env.DB.prepare('UPDATE distributions SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id)
    );
    for (const item of items) {
      const movementOutId = crypto.randomUUID();
      statements.push(
        c2.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementOutId, businessId, item.product_id, item.variant_id, item.batch_id || null, warehouseId, item.quantity, "transfer_out", "distributions", id, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE business_id = ? AND location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(item.quantity, businessId, warehouseId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
      );
      const movementInId = crypto.randomUUID();
      statements.push(
        c2.env.DB.prepare(`
           INSERT INTO stock_movements 
           (id, business_id, product_id, variant_id, batch_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `).bind(movementInId, businessId, item.product_id, item.variant_id, item.batch_id || null, targetLocId, item.quantity, "transfer_in", "distributions", id, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, targetLocId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
      );
    }
    try {
      await c2.env.DB.batch(statements);
      return c2.json({ success: true, message: "Distribusi diproses, stok berhasil dipindahkan" });
    } catch (error) {
      return c2.json({ success: false, message: "Gagal mendistribusikan stok", error: error.message }, 500);
    }
  } else {
    await c2.env.DB.prepare('UPDATE distributions SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(newStatus, id).run();
    return c2.json({ success: true, message: `Status distribusi diperbarui menjadi ${newStatus}` });
  }
});

// src/routes/sales_visits.ts
var salesVisitRoutes = new Hono3();
salesVisitRoutes.use("/*", authMiddleware, tenantMiddleware);
salesVisitRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const query = `
    SELECT sv.*, s.name as sales_name, st.name as store_name
    FROM sales_visits sv
    JOIN sales s ON s.id = sv.sales_id
    JOIN stores st ON st.id = sv.store_id
    WHERE sv.business_id = ?
    ORDER BY sv.visit_date DESC, sv.visit_time DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId, limit, offset).all();
  const countQuery = "SELECT COUNT(*) as total FROM sales_visits WHERE business_id = ?";
  const totalRes = await c2.env.DB.prepare(countQuery).bind(businessId).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
salesVisitRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["sales_id", "store_id", "visit_date"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const time2 = body.visit_time || (/* @__PURE__ */ new Date()).toISOString().split("T")[1].substring(0, 5);
  await c2.env.DB.prepare(
    "INSERT INTO sales_visits (id, business_id, sales_id, store_id, visit_date, visit_time, latitude, longitude, notes, photo_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    businessId,
    body.sales_id,
    body.store_id,
    body.visit_date,
    time2,
    body.latitude || null,
    body.longitude || null,
    body.notes || null,
    body.photo_url || null,
    "in_progress"
  ).run();
  return c2.json({ success: true, data: { id, ...body } }, 201);
});
salesVisitRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const visit = await c2.env.DB.prepare(`
    SELECT sv.*, s.name as sales_name, st.name as store_name
    FROM sales_visits sv
    JOIN sales s ON s.id = sv.sales_id
    JOIN stores st ON st.id = sv.store_id
    WHERE sv.id = ? AND sv.business_id = ?
  `).bind(id, businessId).first();
  if (!visit) return c2.json({ success: false, message: "Kunjungan tidak ditemukan" }, 404);
  const { results: items } = await c2.env.DB.prepare(`
    SELECT svi.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM sales_visit_items svi
    JOIN products p ON p.id = svi.product_id
    JOIN product_variants v ON v.id = svi.variant_id
    LEFT JOIN product_batches b ON b.id = svi.batch_id
    WHERE svi.visit_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...visit, items } });
});
salesVisitRoutes.post("/:id/items", async (c2) => {
  const businessId = c2.get("businessId");
  const visitId = c2.req.param("id");
  const body = await c2.req.json();
  const items = body.items;
  if (!items || !items.length) return c2.json({ success: false, message: "Items kosong" }, 400);
  const visit = await c2.env.DB.prepare("SELECT status FROM sales_visits WHERE id = ? AND business_id = ?").bind(visitId, businessId).first();
  if (!visit) return c2.json({ success: false, message: "Kunjungan tidak ditemukan" }, 404);
  if (visit.status !== "in_progress") return c2.json({ success: false, message: "Kunjungan sudah selesai/batal" }, 400);
  const statements = [
    c2.env.DB.prepare("DELETE FROM sales_visit_items WHERE visit_id = ?").bind(visitId)
  ];
  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO sales_visit_items 
        (id, visit_id, product_id, variant_id, batch_id, previous_quantity, sold_quantity, return_quantity, new_quantity, remaining_quantity, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId,
        visitId,
        item.product_id,
        item.variant_id,
        item.batch_id || null,
        item.previous_quantity || 0,
        item.sold_quantity || 0,
        item.return_quantity || 0,
        item.new_quantity || 0,
        item.remaining_quantity || 0,
        item.notes || null
      )
    );
  }
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Item kunjungan disimpan" });
});
salesVisitRoutes.post("/:id/complete", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const visitId = c2.req.param("id");
  const visit = await c2.env.DB.prepare("SELECT * FROM sales_visits WHERE id = ? AND business_id = ?").bind(visitId, businessId).first();
  if (!visit) return c2.json({ success: false, message: "Kunjungan tidak ditemukan" }, 404);
  if (visit.status !== "in_progress") return c2.json({ success: false, message: "Kunjungan sudah diproses sebelumnya" }, 400);
  const salesLoc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'sales' AND reference_id = ? AND business_id = ?").bind(visit.sales_id, businessId).first();
  const storeLoc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'store' AND reference_id = ? AND business_id = ?").bind(visit.store_id, businessId).first();
  if (!salesLoc || !storeLoc) return c2.json({ success: false, message: "Data lokasi stock sales/toko tidak valid" }, 400);
  const { results: items } = await c2.env.DB.prepare("SELECT * FROM sales_visit_items WHERE visit_id = ?").bind(visitId).all();
  const statements = [];
  statements.push(
    c2.env.DB.prepare('UPDATE sales_visits SET status = "completed", updated_at = datetime("now") WHERE id = ?').bind(visitId)
  );
  for (const item of items) {
    const { product_id, variant_id, batch_id, sold_quantity, return_quantity, new_quantity } = item;
    if (sold_quantity > 0) {
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'sale', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, storeLoc.id, sold_quantity, visitId, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(sold_quantity, storeLoc.id, product_id, variant_id, batch_id, batch_id)
      );
    }
    if (return_quantity > 0) {
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'return', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, storeLoc.id, salesLoc.id, return_quantity, visitId, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(return_quantity, storeLoc.id, product_id, variant_id, batch_id, batch_id)
      );
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, salesLoc.id, product_id, variant_id, batch_id || null, return_quantity)
      );
    }
    if (new_quantity > 0) {
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'transfer', 'sales_visits', ?, ?)
        `).bind(businessId, product_id, variant_id, batch_id || null, salesLoc.id, storeLoc.id, new_quantity, visitId, user.userId)
      );
      statements.push(
        c2.env.DB.prepare(`
          UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
        `).bind(new_quantity, salesLoc.id, product_id, variant_id, batch_id, batch_id)
      );
      statements.push(
        c2.env.DB.prepare(`
          INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(location_id, product_id, variant_id, batch_id) 
          DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
        `).bind(businessId, storeLoc.id, product_id, variant_id, batch_id || null, new_quantity)
      );
    }
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Kunjungan selesai dan stok diperbarui" });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal memproses kunjungan", error: error.message }, 500);
  }
});

// src/routes/consignments.ts
var consignmentRoutes = new Hono3();
consignmentRoutes.use("/*", authMiddleware, tenantMiddleware);
consignmentRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset } = parsePagination(c2);
  const query = `
    SELECT c.*, s.name as sales_name, st.name as store_name
    FROM consignments c
    JOIN sales s ON s.id = c.sales_id
    JOIN stores st ON st.id = c.store_id
    WHERE c.business_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId, limit, offset).all();
  const countQuery = "SELECT COUNT(*) as total FROM consignments WHERE business_id = ?";
  const totalRes = await c2.env.DB.prepare(countQuery).bind(businessId).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
consignmentRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["sales_id", "store_id", "consignment_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item konsinyasi tidak boleh kosong" }, 400);
  const id = crypto.randomUUID();
  const consignmentNumber = generateNumber("CNS");
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO consignments (id, business_id, sales_id, store_id, visit_id, consignment_number, consignment_date, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, businessId, body.sales_id, body.store_id, body.visit_id || null, consignmentNumber, body.consignment_date, "active", body.notes || null)
  );
  for (const item of items) {
    const itemId = crypto.randomUUID();
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO consignment_items (id, consignment_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(itemId, id, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Dokumen konsinyasi berhasil dibuat", data: { id, consignment_number: consignmentNumber } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal membuat konsinyasi", error: error.message }, 500);
  }
});
consignmentRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const consignment = await c2.env.DB.prepare(`
    SELECT c.*, s.name as sales_name, st.name as store_name
    FROM consignments c
    JOIN sales s ON s.id = c.sales_id
    JOIN stores st ON st.id = c.store_id
    WHERE c.id = ? AND c.business_id = ?
  `).bind(id, businessId).first();
  if (!consignment) return c2.json({ success: false, message: "Konsinyasi tidak ditemukan" }, 404);
  const { results: items } = await c2.env.DB.prepare(`
    SELECT ci.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM consignment_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN product_variants v ON v.id = ci.variant_id
    LEFT JOIN product_batches b ON b.id = ci.batch_id
    WHERE ci.consignment_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...consignment, items } });
});
consignmentRoutes.put("/:id/status", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const newStatus = body.status;
  if (!["active", "settled", "cancelled"].includes(newStatus)) {
    return c2.json({ success: false, message: "Status tidak valid" }, 400);
  }
  await c2.env.DB.prepare('UPDATE consignments SET status = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(newStatus, id, businessId).run();
  return c2.json({ success: true, message: `Status konsinyasi diperbarui menjadi ${newStatus}` });
});

// src/routes/displays.ts
var displayRoutes = new Hono3();
displayRoutes.use("/*", authMiddleware, tenantMiddleware);
displayRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = "SELECT * FROM displays WHERE business_id = ?";
  const params = [businessId];
  if (search) {
    query += " AND (name LIKE ? OR display_code LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM displays WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND (name LIKE ? OR display_code LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
displayRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const body = await c2.req.json();
  const err = validateRequired(body, ["name"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const id = crypto.randomUUID();
  const displayCode = body.display_code || generateNumber("DSP");
  await c2.env.DB.prepare(
    "INSERT INTO displays (id, business_id, display_code, name, type, capacity, condition, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    businessId,
    displayCode,
    body.name,
    body.type || null,
    body.capacity || null,
    body.condition || "good",
    body.status || "available",
    body.photo_url || null
  ).run();
  return c2.json({ success: true, data: { id, display_code: displayCode, ...body } }, 201);
});
displayRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const display = await c2.env.DB.prepare("SELECT * FROM displays WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!display) return c2.json({ success: false, message: "Display tidak ditemukan" }, 404);
  const assignment = await c2.env.DB.prepare(`
    SELECT da.*, s.name as sales_name, st.name as store_name
    FROM display_assignments da
    LEFT JOIN sales s ON s.id = da.sales_id
    LEFT JOIN stores st ON st.id = da.store_id
    WHERE da.display_id = ? AND da.status = 'active'
    ORDER BY da.assigned_at DESC LIMIT 1
  `).bind(id).first();
  const { results: items } = await c2.env.DB.prepare(`
    SELECT di.*, p.name as product_name, v.name as variant_name
    FROM display_items di
    JOIN products p ON p.id = di.product_id
    JOIN product_variants v ON v.id = di.variant_id
    WHERE di.display_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...display, active_assignment: assignment, items } });
});
displayRoutes.put("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  await c2.env.DB.prepare(
    'UPDATE displays SET name = ?, type = ?, capacity = ?, condition = ?, status = ?, photo_url = ?, updated_at = datetime("now") WHERE id = ? AND business_id = ?'
  ).bind(
    body.name,
    body.type || null,
    body.capacity || null,
    body.condition || "good",
    body.status || "available",
    body.photo_url || null,
    id,
    businessId
  ).run();
  return c2.json({ success: true, message: "Display diperbarui" });
});
displayRoutes.delete("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const check = await c2.env.DB.prepare("SELECT status FROM displays WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!check) return c2.json({ success: false, message: "Display tidak ditemukan" }, 404);
  if (check.status === "in_use") return c2.json({ success: false, message: "Display masih digunakan" }, 400);
  const statements = [
    c2.env.DB.prepare("DELETE FROM display_items WHERE display_id = ?").bind(id),
    c2.env.DB.prepare("DELETE FROM display_assignments WHERE display_id = ?").bind(id),
    c2.env.DB.prepare("DELETE FROM displays WHERE id = ? AND business_id = ?").bind(id, businessId)
  ];
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Display dihapus" });
});
displayRoutes.post("/:id/assign", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  if (!body.sales_id && !body.store_id) return c2.json({ success: false, message: "Pilih sales atau toko" }, 400);
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      UPDATE display_assignments 
      SET status = 'released', released_at = datetime('now'), updated_at = datetime('now') 
      WHERE display_id = ? AND status = 'active'
    `).bind(id)
  );
  const assignmentId = crypto.randomUUID();
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO display_assignments (id, business_id, display_id, sales_id, store_id, status, notes)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).bind(assignmentId, businessId, id, body.sales_id || null, body.store_id || null, body.notes || null)
  );
  statements.push(
    c2.env.DB.prepare('UPDATE displays SET status = "in_use", updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(id, businessId)
  );
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Display berhasil ditugaskan" });
});
displayRoutes.post("/:id/release", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const statements = [
    c2.env.DB.prepare(`
      UPDATE display_assignments 
      SET status = 'released', released_at = datetime('now'), updated_at = datetime('now') 
      WHERE display_id = ? AND status = 'active'
    `).bind(id),
    c2.env.DB.prepare('UPDATE displays SET status = "available", updated_at = datetime("now") WHERE id = ? AND business_id = ?').bind(id, businessId)
  ];
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Display ditarik kembali" });
});
displayRoutes.post("/:id/items", async (c2) => {
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const items = body.items;
  if (!items || !items.length) return c2.json({ success: false, message: "Items kosong" }, 400);
  const statements = [
    c2.env.DB.prepare("DELETE FROM display_items WHERE display_id = ?").bind(id)
  ];
  for (const item of items) {
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO display_items (id, display_id, product_id, variant_id, batch_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, item.product_id, item.variant_id, item.batch_id || null, item.quantity || 1)
    );
  }
  await c2.env.DB.batch(statements);
  return c2.json({ success: true, message: "Isi display diperbarui" });
});

// src/routes/returns.ts
var returnRoutes = new Hono3();
returnRoutes.use("/*", authMiddleware, tenantMiddleware);
returnRoutes.get("/", async (c2) => {
  const businessId = c2.get("businessId");
  const { limit, offset, search } = parsePagination(c2);
  let query = `
    SELECT r.*, u.name as created_by_name 
    FROM returns r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.business_id = ?
  `;
  const params = [businessId];
  if (search) {
    query += " AND r.return_number LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results } = await c2.env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM returns WHERE business_id = ?";
  const countParams = [businessId];
  if (search) {
    countQuery += " AND return_number LIKE ?";
    countParams.push(`%${search}%`);
  }
  const totalRes = await c2.env.DB.prepare(countQuery).bind(...countParams).first();
  return c2.json({ success: true, data: results, meta: { total: totalRes?.total || 0 } });
});
returnRoutes.post("/", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const body = await c2.req.json();
  const err = validateRequired(body, ["source_type", "return_type", "return_date", "items"]);
  if (err) return c2.json({ success: false, message: err }, 400);
  const items = body.items;
  if (!items || items.length === 0) return c2.json({ success: false, message: "Item retur tidak boleh kosong" }, 400);
  const id = crypto.randomUUID();
  const returnNumber = generateNumber("RTR");
  let destinationType = "warehouse";
  if (body.return_type === "production_defect") {
    destinationType = "supplier";
  }
  const statements = [];
  statements.push(
    c2.env.DB.prepare(`
      INSERT INTO returns (id, business_id, return_number, source_type, source_id, return_type, destination_type, destination_id, return_date, status, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      businessId,
      returnNumber,
      body.source_type,
      body.source_id || null,
      body.return_type,
      destinationType,
      body.destination_id || null,
      body.return_date,
      "pending",
      body.notes || null,
      user.userId
    )
  );
  for (const item of items) {
    statements.push(
      c2.env.DB.prepare(`
        INSERT INTO return_items (id, return_id, product_id, variant_id, batch_id, quantity, condition, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        id,
        item.product_id,
        item.variant_id,
        item.batch_id || null,
        item.quantity,
        item.condition || "damaged",
        item.notes || null
      )
    );
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: "Dokumen retur dibuat", data: { id, return_number: returnNumber } }, 201);
  } catch (error) {
    return c2.json({ success: false, message: "Gagal membuat retur", error: error.message }, 500);
  }
});
returnRoutes.get("/:id", async (c2) => {
  const businessId = c2.get("businessId");
  const id = c2.req.param("id");
  const result = await c2.env.DB.prepare(`
    SELECT r.*, u.name as created_by_name 
    FROM returns r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.id = ? AND r.business_id = ?
  `).bind(id, businessId).first();
  if (!result) return c2.json({ success: false, message: "Retur tidak ditemukan" }, 404);
  const { results: items } = await c2.env.DB.prepare(`
    SELECT ri.*, p.name as product_name, v.name as variant_name, b.batch_number
    FROM return_items ri
    JOIN products p ON p.id = ri.product_id
    JOIN product_variants v ON v.id = ri.variant_id
    LEFT JOIN product_batches b ON b.id = ri.batch_id
    WHERE ri.return_id = ?
  `).bind(id).all();
  return c2.json({ success: true, data: { ...result, items } });
});
returnRoutes.put("/:id/status", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const id = c2.req.param("id");
  const body = await c2.req.json();
  const newStatus = body.status;
  if (!["verified", "approved", "in_process", "completed", "rejected"].includes(newStatus)) {
    return c2.json({ success: false, message: "Status tidak valid" }, 400);
  }
  const ret = await c2.env.DB.prepare("SELECT status, source_type, source_id, destination_type FROM returns WHERE id = ? AND business_id = ?").bind(id, businessId).first();
  if (!ret) return c2.json({ success: false, message: "Retur tidak ditemukan" }, 404);
  const statements = [];
  let query = 'UPDATE returns SET status = ?, updated_at = datetime("now")';
  const params = [newStatus];
  if (newStatus === "verified" || newStatus === "approved") {
    query += ", verified_by = ?";
    params.push(user.userId);
  }
  query += " WHERE id = ?";
  params.push(id);
  statements.push(c2.env.DB.prepare(query).bind(...params));
  if (newStatus === "completed" && ret.status !== "completed") {
    let sourceLocId = null;
    if (ret.source_type === "store" || ret.source_type === "sales") {
      const loc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = ? AND reference_id = ? AND business_id = ? LIMIT 1").bind(ret.source_type, ret.source_id, businessId).first();
      sourceLocId = loc?.id;
    } else if (ret.source_type === "agent") {
      const loc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'agent' AND reference_id = ? AND business_id = ? LIMIT 1").bind(ret.source_id, businessId).first();
      sourceLocId = loc?.id;
    } else {
      const loc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
      sourceLocId = loc?.id;
    }
    let destLocId = null;
    if (ret.destination_type === "warehouse") {
      let loc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'return' AND business_id = ? LIMIT 1").bind(businessId).first();
      if (!loc) {
        loc = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
      }
      destLocId = loc?.id;
    }
    const { results: items } = await c2.env.DB.prepare("SELECT * FROM return_items WHERE return_id = ?").bind(id).all();
    for (const item of items) {
      if (sourceLocId) {
        statements.push(
          c2.env.DB.prepare(`
            UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
            WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
          `).bind(item.quantity, sourceLocId, item.product_id, item.variant_id, item.batch_id, item.batch_id)
        );
        statements.push(
          c2.env.DB.prepare(`
             INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, quantity, movement_type, reference_type, reference_id, created_by)
             VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'return', 'returns', ?, ?)
           `).bind(businessId, item.product_id, item.variant_id, item.batch_id || null, sourceLocId, item.quantity, id, user.userId)
        );
      }
      if (destLocId) {
        statements.push(
          c2.env.DB.prepare(`
            INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
            ON CONFLICT(location_id, product_id, variant_id, batch_id) 
            DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
          `).bind(businessId, destLocId, item.product_id, item.variant_id, item.batch_id || null, item.quantity)
        );
      }
      if (item.replacement_quantity > 0 && sourceLocId) {
        const mainWh = await c2.env.DB.prepare("SELECT id FROM stock_locations WHERE type = 'warehouse' AND business_id = ? LIMIT 1").bind(businessId).first();
        if (mainWh) {
          statements.push(
            c2.env.DB.prepare(`
              UPDATE stock_balances SET quantity = quantity - ?, updated_at = datetime('now')
              WHERE location_id = ? AND product_id = ? AND variant_id = ? AND (batch_id = ? OR (? IS NULL AND batch_id IS NULL))
            `).bind(item.replacement_quantity, mainWh.id, item.product_id, item.variant_id, item.batch_id, item.batch_id)
          );
          statements.push(
            c2.env.DB.prepare(`
              INSERT INTO stock_balances (id, business_id, location_id, product_id, variant_id, batch_id, quantity)
              VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
              ON CONFLICT(location_id, product_id, variant_id, batch_id) 
              DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = datetime('now')
            `).bind(businessId, sourceLocId, item.product_id, item.variant_id, item.batch_id || null, item.replacement_quantity)
          );
          statements.push(
            c2.env.DB.prepare(`
               INSERT INTO stock_movements (id, business_id, product_id, variant_id, batch_id, from_location_id, to_location_id, quantity, movement_type, reference_type, reference_id, created_by)
               VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, 'replacement', 'returns', ?, ?)
             `).bind(businessId, item.product_id, item.variant_id, item.batch_id || null, mainWh.id, sourceLocId, item.replacement_quantity, id, user.userId)
          );
        }
      }
    }
  }
  try {
    await c2.env.DB.batch(statements);
    return c2.json({ success: true, message: `Status retur diperbarui menjadi ${newStatus}` });
  } catch (error) {
    return c2.json({ success: false, message: "Gagal memperbarui status", error: error.message }, 500);
  }
});

// src/routes/dashboard.ts
var dashboardRoutes = new Hono3();
dashboardRoutes.use("/*", authMiddleware, tenantMiddleware);
dashboardRoutes.get("/overview", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const queries = {
    totalSales: c2.env.DB.prepare("SELECT COUNT(*) as count FROM sales WHERE business_id = ?").bind(businessId),
    totalStores: c2.env.DB.prepare("SELECT COUNT(*) as count FROM stores WHERE business_id = ?").bind(businessId),
    totalAgents: c2.env.DB.prepare("SELECT COUNT(*) as count FROM agents WHERE business_id = ?").bind(businessId),
    pendingReturns: c2.env.DB.prepare("SELECT COUNT(*) as count FROM returns WHERE business_id = ? AND status = 'pending'").bind(businessId),
    todayVisits: c2.env.DB.prepare("SELECT COUNT(*) as count FROM sales_visits WHERE business_id = ? AND date(visit_date) = date('now')").bind(businessId),
    activeConsignments: c2.env.DB.prepare("SELECT COUNT(*) as count FROM consignments WHERE business_id = ? AND status = 'active'").bind(businessId)
  };
  const results = await c2.env.DB.batch([
    queries.totalSales,
    queries.totalStores,
    queries.totalAgents,
    queries.pendingReturns,
    queries.todayVisits,
    queries.activeConsignments
  ]);
  return c2.json({
    success: true,
    data: {
      total_sales: results[0].results[0].count,
      total_stores: results[1].results[0].count,
      total_agents: results[2].results[0].count,
      pending_returns: results[3].results[0].count,
      today_visits: results[4].results[0].count,
      active_consignments: results[5].results[0].count
    }
  });
});
dashboardRoutes.get("/sales", async (c2) => {
  const businessId = c2.get("businessId");
  const user = c2.get("user");
  const salesId = c2.req.query("sales_id");
  if (!salesId) return c2.json({ success: false, message: "Sales ID diperlukan" }, 400);
  const myStock = await c2.env.DB.prepare(`
    SELECT p.name, sum(sb.quantity) as total_quantity
    FROM stock_balances sb
    JOIN stock_locations l ON l.id = sb.location_id
    JOIN products p ON p.id = sb.product_id
    WHERE l.type = 'sales' AND l.reference_id = ? AND l.business_id = ?
    GROUP BY p.id
  `).bind(salesId, businessId).all();
  const todayVisits = await c2.env.DB.prepare(`
    SELECT v.*, s.name as store_name
    FROM sales_visits v
    JOIN stores s ON s.id = v.store_id
    WHERE v.sales_id = ? AND date(v.visit_date) = date('now')
  `).bind(salesId).all();
  return c2.json({
    success: true,
    data: {
      my_stock: myStock.results,
      today_visits: todayVisits.results
    }
  });
});

// src/routes/reports.ts
var reportRoutes = new Hono3();
reportRoutes.use("/*", authMiddleware, tenantMiddleware);
reportRoutes.get("/products/expired", async (c2) => {
  const businessId = c2.get("businessId");
  const query = `
    SELECT p.name as product_name, v.name as variant_name, b.batch_number, b.expiry_date, 
           l.name as location_name, sb.quantity
    FROM stock_balances sb
    JOIN products p ON p.id = sb.product_id
    JOIN product_variants v ON v.id = sb.variant_id
    JOIN product_batches b ON b.id = sb.batch_id
    JOIN stock_locations l ON l.id = sb.location_id
    WHERE sb.business_id = ? AND sb.quantity > 0 
      AND date(b.expiry_date) <= date('now', '+30 days')
    ORDER BY b.expiry_date ASC
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId).all();
  return c2.json({ success: true, data: results });
});
reportRoutes.get("/stock-locations", async (c2) => {
  const businessId = c2.get("businessId");
  const query = `
    SELECT l.type as location_type, l.name as location_name, p.name as product_name, sum(sb.quantity) as total_quantity
    FROM stock_balances sb
    JOIN stock_locations l ON l.id = sb.location_id
    JOIN products p ON p.id = sb.product_id
    WHERE sb.business_id = ? AND sb.quantity > 0
    GROUP BY l.id, p.id
    ORDER BY l.type, l.name, p.name
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId).all();
  return c2.json({ success: true, data: results });
});
reportRoutes.get("/sales-performance", async (c2) => {
  const businessId = c2.get("businessId");
  const query = `
    SELECT s.name as sales_name, p.name as product_name, sum(svi.sold_quantity) as total_sold
    FROM sales_visit_items svi
    JOIN sales_visits sv ON sv.id = svi.visit_id
    JOIN sales s ON s.id = sv.sales_id
    JOIN products p ON p.id = svi.product_id
    WHERE sv.business_id = ? AND sv.status = 'completed'
    GROUP BY s.id, p.id
    ORDER BY total_sold DESC
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId).all();
  return c2.json({ success: true, data: results });
});
reportRoutes.get("/returns-summary", async (c2) => {
  const businessId = c2.get("businessId");
  const query = `
    SELECT r.return_type, p.name as product_name, sum(ri.quantity) as total_returned
    FROM return_items ri
    JOIN returns r ON r.id = ri.return_id
    JOIN products p ON p.id = ri.product_id
    WHERE r.business_id = ? AND r.status = 'completed'
    GROUP BY r.return_type, p.id
    ORDER BY total_returned DESC
  `;
  const { results } = await c2.env.DB.prepare(query).bind(businessId).all();
  return c2.json({ success: true, data: results });
});

// src/index.ts
var app = new Hono3();
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "/api/*",
  cors({
    origin: /* @__PURE__ */ __name((origin, c2) => {
      const allowed = c2.env.CORS_ORIGIN || "http://localhost:5173";
      return allowed;
    }, "origin"),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
);
app.get("/", (c2) => {
  return c2.json({
    success: true,
    message: "DistribusiApp API is running",
    version: "0.1.0"
  });
});
app.get("/api/health", (c2) => {
  return c2.json({
    success: true,
    message: "API is healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.route("/api/auth", authRoutes);
app.route("/api/businesses", businessRoutes);
app.route("/api/products", productRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/units", unitRoutes);
app.route("/api/suppliers", supplierRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/locations", locationRoutes);
app.route("/api/batches", batchRoutes);
app.route("/api/inventory", inventoryRoutes);
app.route("/api/production", productionRoutes);
app.route("/api/receipts", receiptRoutes);
app.route("/api/agents", agentRoutes);
app.route("/api/agent_orders", agentOrderRoutes);
app.route("/api/sales", salesRoutes);
app.route("/api/stores", storeRoutes);
app.route("/api/distributions", distributionRoutes);
app.route("/api/sales_visits", salesVisitRoutes);
app.route("/api/consignments", consignmentRoutes);
app.route("/api/displays", displayRoutes);
app.route("/api/returns", returnRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/reports", reportRoutes);
app.notFound((c2) => {
  return c2.json(
    {
      success: false,
      error: "Not Found",
      message: `Route ${c2.req.method} ${c2.req.path} not found`
    },
    404
  );
});
app.onError((err, c2) => {
  console.error("Unhandled error:", err);
  return c2.json(
    {
      success: false,
      error: "Internal Server Error",
      message: err.message
    },
    500
  );
});
var src_default = app;

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-RnnYsz/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-RnnYsz/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
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
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

bcrypt-ts/dist/browser.js:
  (*
  * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
  * Released under the Apache License, Version 2.0
  * see: https://github.com/dcodeIO/bcrypt.js for details
  *)
*/
//# sourceMappingURL=index.js.map
