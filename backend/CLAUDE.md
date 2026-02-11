# Backend — Non-Obvious Internals

## Flask Application Architecture

- Entry point is [main.py](../../../backend/src/main.py) — runs directly via `python main.py` for local dev (0.0.0.0:8080, debug=True) or via gunicorn in production
- `CORS(app)` enables unrestricted cross-origin requests — no domain whitelist, accepts all origins (necessary for Next.js frontend on different port/domain)
- `log_env_vars()` is called before `app.run()` — logs `FLASK_DEBUG`, `LOG_LEVEL`, `PORT` at startup; warns if any are unset (helps catch missing config in deployed environments)
- `LOG_LEVEL` defaults to `"DEBUG"` if `FLASK_DEBUG` is truthy, otherwise `"INFO"` — environment-driven verbosity control
- `static_url_path=""` makes static files available at root — `/` serves `index.html`, not `/static/index.html`
- `static_folder="static"` points to [backend/src/static/](../../../backend/src/static/) — contains standalone test UI for manual API testing without the frontend
- All route handlers are thin wrappers — call a single function from the imported API module, log request/response, and re-raise exceptions after logging with `exc_info=True`

## API Module Structure & Common Pattern

- Each processing function lives in `backend/src/api/<function_name>/main.py` as a standalone module — imported at top of `main.py` with alias matching function name
- **All endpoints expect `multipart/form-data`** — image as `request.files['file']`, numeric/string params as `request.form.get(...)`
- Image decoding pattern is universal: `np.frombuffer(file.read(), np.uint8)` → `cv2.imdecode(buffer, flags)`
- `cv2.imdecode` flags differ by API: `0` (grayscale) for CLAHE, `cv2.IMREAD_COLOR` for all others — this is the first color-space decision point
- Return type is `Union[Response, Tuple[str, int]]` — success returns `make_response(buffer.tobytes())` with `Content-Type: image/jpeg`, errors return `(message, status_code)` tuple
- **All images are encoded as JPG** (`.jpg`) via `cv2.imencode` — no format preservation; PNG input becomes JPG output, potentially losing transparency or introducing compression artifacts
- Error handling has two layers: parameter parsing errors return 400 with `ValueError` message, processing errors return 500 with exception string
- No input validation beyond parameter type coercion — malformed images cause `cv2.imdecode` to return `None`, which is checked and returns 400 "Could not decode image"

## Parameter Parsing & Validation

- Every API with parameters defines a frozen `@dataclass` (immutable after construction) — naming convention is `<FunctionName>Params`
- `_parse_params(request: Request)` is a private helper in each module — extracts values from `request.form`, coerces types, raises `ValueError` on failure
- `request.form.get(key, default)` provides fallback defaults — these are the runtime defaults, distinct from dataclass field defaults (which exist for type hints)
- Type coercion failures (e.g., `int("abc")`, `float("xyz")`) raise `ValueError` with generic message — client cannot distinguish which specific parameter failed
- **Grayscale threshold nullability**: `request.form.get("threshold")` returns `None` if key is absent, `""` if present but empty; both cases result in `GrayscaleParams(threshold=None)`, which skips thresholding
- Validation is minimal — no range checks (e.g., gamma could be negative, ksize could be enormous), relying on OpenCV to fail or clamp internally
- **GaussianBlur ksize enforcement happens in processing**, not parsing — even ksize values are corrected to odd after parsing completes

## Image Processing Implementations

### CLAHE (Create CLAHE)

- **Grayscale-only input**: `cv2.imdecode(file_bytes, 0)` flag forces grayscale decode — color images are converted at decode time, not explicitly via `cvtColor`
- `clipLimit` is a float (default 2.0) — controls histogram clipping threshold; higher values increase contrast more aggressively
- `tileGridSize` is a tuple `(tile_grid_x, tile_grid_y)` (default 8×8) — frontend sends `tileGridSizeX` and `tileGridSizeY` separately, backend constructs tuple
- `cv2.createCLAHE(...)` returns a CLAHE object, not the result — must call `.apply(img)` to process
- Output is grayscale (single channel) because input was decoded grayscale — no BGR/RGB channel concerns

### Grayscale

- Two-stage transformation: (1) `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)` — always executed, (2) optional thresholding if `params.threshold is not None`
- Threshold uses `cv2.THRESH_BINARY` — pixels above threshold → 255, below → 0; creates binary (black/white) image
- `cv2.threshold` returns `(ret, img)` tuple — `ret` is the computed threshold (unused), `img` is binarized result; underscore `_` discards `ret`
- **No threshold means grayscale-only output** — 256 gray levels preserved; threshold presence results in 2-level output (0 or 255)
- Input is decoded as color (`IMREAD_COLOR`) then converted to gray — this matches standard grayscale workflow, preserving color channel weights

### GaussianBlur

- Accepts four separate parameters: `ksizeX`, `ksizeY`, `sigmaX`, `sigmaY` — frontend adapter must split a single ksize into X/Y components
- **Odd ksize enforcement**: `ksize_x + (1 if ksize_x > 0 and ksize_x % 2 == 0 else 0)` — even values are incremented by 1, zero remains zero
- Zero ksize is valid — OpenCV computes kernel size from sigma; if both ksize and sigma are zero, no blur is applied (identity operation)
- `sigmaY` parameter is explicitly passed to `cv2.GaussianBlur(..., sigmaY=params.sigma_y)` — allows independent X/Y blur strength
- No validation of sigma values — negative sigma could cause OpenCV errors, but backend does not guard against it
- Blur is applied only if `params.ksize_x > 0 or params.ksize_y > 0 or params.sigma_x > 0` — if all three are zero, image passes through unchanged

### RemoveNoise

- **No parameters** — hardcoded configuration; simplest API in the collection
- Uses `cv2.medianBlur(img, 3)` exclusively — kernel size 3×3 is fixed, no customization possible
- Median filter is effective for salt-and-pepper (spike) noise — smooths noise while preserving edges better than Gaussian
- Always operates on color images (`IMREAD_COLOR`) — processes all three BGR channels independently

### RestoreContrast

- Implements **gamma correction** via lookup table (LUT) — precomputes all 256 possible pixel value transformations
- `safe_gamma` guards against division by zero: `params.gamma if params.gamma > 0 else 1.0` — gamma=0 becomes identity (gamma=1.0)
- `inv_gamma = 1.0 / safe_gamma` — actual correction uses reciprocal; frontend sends gamma=1.7, backend applies 1/1.7
- LUT construction: `[((i / 255.0) ** inv_gamma) * 255 for i in range(256)]` — normalizes to [0,1], applies power, scales back to [0,255]
- LUT array is cast to `uint8` — fractional results are truncated, not rounded; potential precision loss at low pixel values
- `cv2.LUT(img, table)` applies table to all channels — single LUT is broadcast across BGR, no per-channel correction

### RestoreBrightness

- **Subtraction-based darkening** — `img_f = img_f - beta` where `beta = params.value`; positive beta darkens, negative beta brightens (contrary to intuitive naming)
- Default `value=-30` means *increasing* brightness by 30 units — "restore brightness" assumes the image is too dark by default
- `img.astype(np.float32)` conversion before arithmetic — prevents uint8 underflow wrapping (e.g., 10 - 30 = 240 in uint8)
- `np.clip(img_f, 0, 255)` clamps results — values below 0 become 0, above 255 become 255; then cast back to `uint8`
- **No-op if `beta == 0`** — explicit check skips conversion and clipping; minor optimization that avoids float casting
- Brightness adjustment is uniform — same beta applied to all pixels and channels; no histogram-based adaptation

## Deployment & Runtime Configuration

- `Dockerfile` uses multi-stage structure implicitly — deps installed first (`COPY requirements.txt`, `RUN pip install`), source copied after for layer caching
- Base image `python:3.12-slim` minimizes container size — no unnecessary build tools or libraries
- **System dependencies**: `libglib2.0-0`, `libgl1`, `libxcb1` are required for `opencv-python-headless` — missing these causes `ImportError: libGL.so.1` at runtime
- `opencv-python-headless` omits GUI components — smaller footprint, no X11/display dependencies; cannot use `cv2.imshow` or `cv2.namedWindow`
- `apt-get rm -rf /var/lib/apt/lists/*` cleans package cache — reduces image size by ~100MB
- **Gunicorn config**: `--workers 1 --threads 8 --timeout 0` — single worker process (GIL-friendly for CPU-bound OpenCV), 8 threads handle concurrent requests, no timeout (Cloud Run manages lifecycle)
- `--bind :$PORT` uses `PORT` env var — Cloud Run injects this (8080 by default); Dockerfile sets `ENV PORT 8080` as fallback for local Docker runs
- `PYTHONUNBUFFERED True` forces unbuffered stdout/stderr — logs appear immediately in Cloud Run logs without waiting for buffer flush
- `WORKDIR` changes twice: `/app` for deps install, `/app/src` for runtime — `CMD exec gunicorn ... main:app` runs from `src/` where `main.py` lives
- `exec` in CMD replaces shell process with gunicorn — enables proper signal forwarding (SIGTERM for graceful shutdown)

## Logging Strategy

- `logging.basicConfig` configures root logger — format includes timestamp, module name, level, and message; all child loggers inherit this
- `LOG_LEVEL` env var is uppercased (`log_level.upper()`) — accepts "debug", "DEBUG", "Debug" equivalently
- `getattr(logging, log_level.upper(), logging.INFO)` provides safe fallback — invalid levels (e.g., "VERBOSE") default to `INFO` instead of crashing
- Each route handler logs `[<function_name>] Request received - form: {...}, files: [...]` before delegation — helps correlate requests when multiple APIs are called in a workflow
- `dict(request.form)` and `list(request.files.keys())` in log messages avoid leaking image binary data — only form keys and file field names are logged
- `logger.error(..., exc_info=True)` in exception handlers — includes full traceback in logs, critical for debugging 500 errors in production
- "Processing completed successfully" is logged *after* function returns — if response generation fails (e.g., `imencode` false), success is not logged
- `logger` instances are module-level (`__name__`) — each API module's logs are tagged with module path (e.g., `api.grayscale.main`)

## Static File Serving

- [backend/src/static/](../../../backend/src/static/) directory structure: `index.html`, `css/style.css`, `js/*.js` — self-contained test UI
- Static UI directly POSTs to `http://localhost:8080/api/<endpoint>` — no frontend framework, vanilla JS fetch calls
- `/favicon.ico` special route sends from `backend/src/imgs/` — separate from `static/`; favicon is not user-facing test UI, kept outside static folder
- `send_from_directory(..., mimetype="image/vnd.microsoft.icon")` explicitly sets ICO MIME type — prevents browser misinterpretation as octet-stream
- Static UI documented in [backend/src/static/README.md](../../../backend/src/static/README.md) — run `python -m http.server 8000` from `backend/test` to avoid Flask dependency
- Flask's `app.send_static_file("index.html")` is used in `/` route — alternative to `send_from_directory(static_folder, "index.html")`
- No authentication on static UI — purely for local dev/debugging; should not be exposed in production (Cloud Run should disable / route if frontend handles it)

## Small But Important Details

- **`createclahe` typo** is intentional — route is `/api/createclahe`, not `/api/create_clahe` or `/api/clahe`; frontend adapter hardcodes this exact path
- All responses are `Content-Type: image/jpeg` — even if input was PNG, output is always JPG; no content negotiation or format mirroring
- `cv2.imdecode` flag `0` is equivalent to `cv2.IMREAD_GRAYSCALE` — literal zero is used in CLAHE module instead of named constant
- `cv2.imencode` returns `(bool, ndarray)` — success flag is checked (`if not ret: return "Could not encode image", 500`), but encoding failures are rare (would require invalid image data structure)
- NumPy dtype conversions are critical: `img.astype(np.float32)` for arithmetic (brightness), `.astype("uint8")` for LUT and final encoding — missing these causes data corruption or OpenCV errors
- `frozen=True` on dataclasses prevents accidental mutation — immutability ensures parsed params cannot be changed mid-request by buggy code
- No CSRF protection — API assumes frontend is trusted; malicious sites could POST directly to backend if CORS were misconfigured to allow credentials
- `request.files['file'].filename` is checked for empty string, not `None` — browser sends `filename=""` for missing file input, not absent key
- Grayscale threshold is the *only* optional parameter across all image processing APIs — all others have defaults but are always present in dataclass
- `cv2.medianBlur` kernel size must be odd and >1 — hardcoded 3 is valid, but parameterization would require validation; current impl avoids this complexity by having no params
- Restore brightness's `beta` is subtracted, not added — OpenCV's `img + beta` idiom was not used; this module implements manual `img - beta` for darkening correction (semantic inversion)
- `GaussianBlur` only applies if at least one param is >0 — default params `(0, 0, 0.0, 0.0)` would skip blur entirely, returning original image; frontend must send non-zero values
