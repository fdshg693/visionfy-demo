# How to Add a New Backend API to the Frontend

## Overview

- When a new image-processing endpoint is added to the Flask backend, the frontend requires changes in **5 areas**: types, UI config, adapter, inspector, and node defaults
- The overall request flow is: **Browser → Next.js proxy route → BackendApiService → Adapter → Flask backend**
- The adapter layer converts JSON + base64 image into `multipart/form-data` that Flask expects (`request.files` + `request.form`)
- The Next.js proxy route ([frontend/app/api/process-node/route.ts](frontend/app/api/process-node/route.ts)) requires **no changes** — it dispatches generically via `BackendApiService`

## Step 1 — Define Types and Defaults

- Add a new params interface (e.g. `XxxParams`) in [frontend/types/node.ts](frontend/types/node.ts)
  - Each field represents a parameter the backend handler accepts via `request.form`
- Add a corresponding data interface (e.g. `XxxData`) extending `BaseProcessNodeData`
  - Must include a **literal** `functionName` string (this is the discriminant key)
  - Must include `params: XxxParams`
- Add `XxxData` to the `ProcessNodeData` discriminated union
- Add the function name → params mapping entry to `ProcessNodeParamsMap`
- Add a default params entry to the `DEFAULT_NODE_PARAMS` constant
- Add an icon entry to the `DEFAULT_NODE_ICONS` constant

## Step 2 — Add UI Parameter Config

- Add a new entry to `VISIONFY_FUNCTIONS_CONFIG` in [frontend/types/opencv.ts](frontend/types/opencv.ts)
  - Provide a `description` string and a `params` array of `OpencvParamDefinition` objects
  - Each param definition specifies `name`, `type` (`number` / `text` / `boolean` / `tuple` / `select`), and `defaultValue`
- **Important**: default values here must match those in `DEFAULT_NODE_PARAMS` — they are maintained separately

## Step 3 — Create the Backend Adapter

- Add a new adapter builder function (e.g. `buildXxxAdapter()`) in [frontend/lib/backendApiAdapters.ts](frontend/lib/backendApiAdapters.ts)
  - The adapter receives `RequestAdapterArgs` and returns `RequestAdapterResult` (`{ url, init }`)
  - Build a `FormData` containing `file` (image blob) and each parameter as a string field
  - The `base64ToBlob` converter is injected via `args` — use it to convert the input image
  - Return the target URL as `${baseUrl}/api/<backend_route_name>`
- Register the adapter in `createBackendAdapters()` with the key matching the new `functionName` literal
- **Note**: the `functionName` key and backend route path can differ (e.g. `gaussianblur` maps to `/api/gaussian_blur`)

## Step 4 — Add the Inspector UI

- Create a new inspector component under [frontend/app/components/inspectors/](frontend/app/components/inspectors/)
  - Use the `useProcessNodeParams` hook from [frontend/hooks/useProcessNodeParams.ts](frontend/hooks/useProcessNodeParams.ts) to read/write params
  - Render input controls matching the param definitions from Step 2
- Wire the new inspector into `ProcessNodeInspector` in [frontend/app/components/inspectors/ProcessNodeInspector.tsx](frontend/app/components/inspectors/ProcessNodeInspector.tsx)
  - Add a case to the `functionName` switch statement that renders the new component
- Alternatively, if the function uses only standard param types, the generic param rendering from `VISIONFY_FUNCTIONS_CONFIG` may suffice without a custom inspector

## Step 5 — Update Node Creation Defaults

- In [frontend/constants/flowConfig.ts](frontend/constants/flowConfig.ts), the `handleAddNode` function in `FlowCanvas` hardcodes `createclahe` as the default for new nodes
  - If the new function should be selectable when adding nodes, update the node-addition logic accordingly
- No changes are needed in [frontend/constants/index.ts](frontend/constants/index.ts) — it only defines node *kinds* (Start/Process/End), not function-level types

## Checklist Summary

- [ ] **Types** — new params interface, data interface, union member, params map, defaults, icon in [frontend/types/node.ts](frontend/types/node.ts)
- [ ] **UI Config** — new entry in `VISIONFY_FUNCTIONS_CONFIG` in [frontend/types/opencv.ts](frontend/types/opencv.ts)
- [ ] **Adapter** — new builder function + registration in [frontend/lib/backendApiAdapters.ts](frontend/lib/backendApiAdapters.ts)
- [ ] **Inspector** — new component or switch case in [frontend/app/components/inspectors/](frontend/app/components/inspectors/)
- [ ] **Verify** — confirm `functionName` key matches the discriminated union literal, adapter key, and inspector switch case

## Common Pitfalls

- **Missing adapter** — if `functionName` has no registered adapter, `BackendApiService` throws `ProcessingError` before any network call is made
- **Param name mismatch** — FormData field names must exactly match what the Flask handler reads from `request.form` (e.g. `ksizeX`, not `ksize_x`)
- **Default value drift** — defaults exist in three places: `DEFAULT_NODE_PARAMS`, `VISIONFY_FUNCTIONS_CONFIG`, and `initialNodes` in flowConfig — keep them in sync
- **No fallback adapter** — unlike some frameworks, there is no generic/default adapter; every function must be explicitly registered
- **Route name vs function name** — the adapter URL path and the `functionName` string are independent; always check the backend route path