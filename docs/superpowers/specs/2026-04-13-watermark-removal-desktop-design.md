# Watermark Removal Desktop 1.0 Design

**Status:** Approved for planning

**Date:** 2026-04-13

**Goal:** Build a macOS and Windows desktop application, without Electron, that lets users import an image, manually mark a watermark region, send the image and mask to a cloud service for removal, and receive the processed image back for local saving.

## 1. Product Scope

### In Scope

- Cross-platform desktop app for macOS and Windows
- No Electron
- Local image import for `png`, `jpg`, `jpeg`
- Manual watermark selection using rectangle selection and brush masking
- Cloud-based watermark removal
- Processed image returned to the client
- Local save of processed image
- No login required
- Single-image processing only
- Support for common small-area text and logo watermarks

### Out of Scope for 1.0

- Automatic watermark detection
- Batch processing
- Account system
- Billing or quota system
- Cloud history storage
- Long-term file storage
- Database-backed job records
- Mobile application
- Video watermark removal

## 2. Recommended Technical Direction

### Selected Approach

Use `Tauri + React + TypeScript` for the desktop client and `FastAPI + Python + OpenCV` for the cloud service.

### Why This Approach

- Tauri satisfies the "not Electron" requirement while still supporting macOS and Windows packaging.
- A web canvas stack is the fastest path to implement image masking interactions such as zoom, pan, rectangle selection, and brush painting.
- Python is the most practical runtime for image-processing pipelines and leaves room for later model upgrades.
- OpenCV inpainting is sufficient for the 1.0 target scenario: user-guided removal of small text or logo watermarks.

### Alternatives Considered

#### Flutter Desktop + Python Service

- Pros: one client stack across platforms
- Cons: image masking tools are slower to build and iterate for 1.0

#### Qt/PySide Desktop + Python Service

- Pros: mostly Python stack
- Cons: desktop UX, packaging, and maintainability are weaker for this product target

## 3. High-Level Architecture

The system is split into three layers:

1. `Tauri Desktop Shell`
2. `React/TypeScript UI`
3. `FastAPI/Python Image Service`

### 3.1 Tauri Desktop Shell

Responsibilities:

- Launch the application on macOS and Windows
- Bridge local file selection and local file saving
- Host the React UI in the native WebView
- Package the application for both desktop platforms

This layer does not perform watermark removal.

### 3.2 React/TypeScript UI

Responsibilities:

- Render the image editor
- Support zoom, pan, fit-to-screen preview
- Support rectangle selection and brush masking
- Export a full-size binary mask image
- Submit requests to the server
- Render success and error states
- Allow saving the returned result locally

### 3.3 FastAPI/Python Image Service

Responsibilities:

- Validate request payloads
- Decode the image and mask
- Normalize orientation, channels, and dimensions
- Run the inpainting engine
- Encode the result as Base64 and return a unified JSON response
- Record structured logs and clear temporary resources

## 4. Functional Design

## 4.1 User Journey

1. User opens the desktop app.
2. User selects a local image.
3. App loads the image and enters edit mode.
4. User marks watermark regions using rectangle selection and brush masking.
5. User starts watermark removal.
6. App uploads the original image and generated mask to the cloud service.
7. Service validates inputs, performs inpainting, and returns the processed image in Base64 form.
8. App shows the processed image.
9. User toggles between original and processed versions or saves the processed image locally.
10. If the result is unsatisfactory, the user returns to edit mode and resubmits with a revised mask.

## 4.2 Client-Side Modules

### `image-import`

Responsibilities:

- Read a selected local file
- Validate extension and MIME type before upload
- Decode image dimensions
- Normalize EXIF orientation for preview and mask alignment

### `mask-editor`

Responsibilities:

- Render editing canvas
- Provide rectangle tool
- Provide brush tool
- Allow zoom and pan
- Generate an output mask that exactly matches the original image dimensions

Mask rules:

- White area means "remove and inpaint this region"
- Black area means "preserve this region"

### `job-client`

Responsibilities:

- Build multipart request payload
- Attach `image`, `mask`, and `request_id`
- Handle unified JSON responses
- Decode successful Base64 data into a previewable result

### `result-viewer`

Responsibilities:

- Show processed image
- Allow before/after comparison
- Allow local save
- Preserve the previous editing state when the server returns an error

### `tauri-shell`

Responsibilities:

- Open file dialog
- Save file dialog
- Native app menu and packaging integration

## 4.3 Server-Side Modules

### `request-validator`

Responsibilities:

- Validate file presence
- Validate supported formats
- Validate file size
- Validate image dimensions
- Validate that mask size matches the original image

### `image-preprocessor`

Responsibilities:

- Load source image and mask
- Normalize color channels
- Normalize image orientation
- Convert mask into the binary format required by the engine

### `inpaint-engine`

Responsibilities:

- Receive a normalized image and mask
- Run OpenCV inpainting for the marked region only
- Return the processed image buffer

The engine must be hidden behind an interface so it can be replaced later by stronger models without changing the API contract.

### `response-builder`

Responsibilities:

- Encode result image to PNG or JPEG
- Convert encoded bytes to Base64
- Build unified JSON response

### `cleanup-logger`

Responsibilities:

- Log `request_id`, input size, processing time, and error code
- Avoid logging image content or Base64 payloads
- Remove any temporary files created during processing

## 5. API Contract

## 5.1 Endpoint

`POST /api/v1/inpaint`

Content type:

`multipart/form-data`

## 5.2 Request Fields

- `image`: original image file
- `mask`: generated mask image file
- `output_format`: `png` or `jpeg`
- `request_id`: client-generated unique request id

## 5.3 Unified Response Shape

All responses, both success and failure, use the same JSON structure:

```json
{
  "code": 200,
  "data": {},
  "message": "操作成功"
}
```

## 5.4 Success Response Example

```json
{
  "code": 200,
  "data": {
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "mime_type": "image/png",
    "request_id": "req_20260413_001",
    "process_time_ms": 842
  },
  "message": "操作成功"
}
```

## 5.5 Failure Response Example

```json
{
  "code": 4005,
  "data": null,
  "message": "Mask 尺寸必须与原图一致"
}
```

## 5.6 Error Codes

### Success

- `200`: 操作成功

### Client/Input Errors

- `4001`: 不支持的图片格式
- `4002`: 图片体积超限
- `4003`: 图片尺寸超限
- `4004`: 缺少 mask
- `4005`: mask 尺寸不匹配

### Processing Errors

- `5001`: 图像预处理失败
- `5002`: 去水印处理失败
- `5003`: 结果编码失败

### System Errors

- `6001`: 请求处理超时
- `6002`: 系统内部异常

## 6. Non-Functional Requirements

### 6.1 Performance Limits

- Maximum file size: `10MB`
- Maximum image size: `4096 x 4096`
- Maximum processing timeout: `20 seconds`

### 6.2 Reliability

- The client must remain responsive during upload and processing.
- The client must preserve the current image and mask when a request fails.
- A single failed request must not degrade subsequent requests.
- Error responses must be stable and mapped to the documented error codes.

### 6.3 Security

- Only accept `png`, `jpg`, and `jpeg`.
- Validate file content, not only the file extension.
- Never interpolate file names into filesystem paths.
- Use isolated temporary paths if disk buffering is needed.
- Do not store user images after request completion.
- Do not log raw image bytes or Base64 data.

### 6.4 Evolvability

- The inpainting algorithm must be exposed through a replaceable interface.
- Client-server API shape must remain stable if the underlying model changes.

## 7. UX Requirements

- Editing must begin immediately after image import.
- The user must always be able to see the current selection result before submission.
- Success and error states must be explicit.
- The user must be able to retry without re-importing the image.
- The user must be able to save the processed image locally after a successful response.

## 8. Testing Strategy

### 8.1 Server Unit Tests

Cover:

- format validation
- file size and dimension validation
- mask dimension validation
- error-code mapping
- success response formatting
- Base64 payload generation

### 8.2 Server Integration Tests

Cover:

- `POST /api/v1/inpaint` success path
- `POST /api/v1/inpaint` invalid format path
- `POST /api/v1/inpaint` invalid mask size path
- successful response contains valid Base64 image data

### 8.3 Client Core Flow Tests

Cover:

- local image selection
- editor mask generation
- request submission
- success result rendering
- error rendering and retry flow

### 8.4 Manual Acceptance Tests

Cover:

- install and run on macOS
- install and run on Windows
- remove a common small watermark from a test image
- save the result locally
- fail gracefully when mask size is invalid or the service is unavailable

## 9. Delivery Boundaries for 1.0

The 1.0 release is complete when the following are true:

- The desktop app runs on macOS and Windows without Electron.
- A user can import one image, mark a watermark manually, submit it, and receive a processed result.
- The cloud service returns unified JSON with `code`, `data`, and `message`.
- Successful responses include `data.image_base64`.
- Failed responses include a non-200 `code`, `data: null`, and a human-readable message.
- The processed image can be saved locally.
- The documented limits and error cases are enforced.

## 10. Deferred Items

These are intentionally deferred beyond 1.0:

- stronger AI inpainting models
- automatic watermark detection
- batch jobs
- login and usage history
- billing and quota
- cloud persistence
