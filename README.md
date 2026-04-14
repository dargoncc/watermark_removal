# watermark_removal

基于 `Tauri + React + TypeScript` 的桌面端，以及基于 `FastAPI + Python + OpenCV` 的云端去水印服务。

## 仓库结构

- `apps/desktop`：macOS / Windows 桌面端
- `services/inpaint-api`：去水印 API 服务
- `docs/superpowers/specs`：产品设计与接口约定
- `docs/superpowers/plans`：实施计划与执行记录

## 环境要求

- Node.js 20.19+（推荐 22.x）
- pnpm 10+
- Rust stable
- Python 3.11
- uv

## 环境变量

仓库根目录提供了 [`.env.example`](.env.example) 作为部署示例。

- 桌面端：
  - `VITE_API_BASE_URL`，默认值为 `http://localhost:8000`
- 服务端：
  - `MAX_IMAGE_BYTES`
  - `MAX_IMAGE_WIDTH`
  - `MAX_IMAGE_HEIGHT`
  - `REQUEST_TIMEOUT_SECONDS`
  - `INPAINT_RADIUS`
  - `OUTPUT_FORMAT`

## 本地启动

```bash
pnpm install
uv sync --directory services/inpaint-api
pnpm dev:api
pnpm dev:desktop
```

默认情况下，桌面端会连接 `http://localhost:8000`。如果需要切到其他环境，请在启动桌面端前通过 shell 或 `apps/desktop/.env` 提供 `VITE_API_BASE_URL`。

## 测试

```bash
pnpm test:desktop
pnpm test:api
pnpm --filter @watermark-removal/desktop build
```

## 打包

```bash
pnpm build:desktop
```

说明：

- 在 macOS 上执行会产出 `dmg`
- 在 Windows 上执行会产出 `msi`
- 首版不包含自动更新、自动签名与 CI/CD

## 服务端部署

```bash
docker build -t watermark-removal-api ./services/inpaint-api
docker run --rm -p 8000:8000 --env-file .env.example watermark-removal-api
```

部署建议：

- 服务端仅输出 stdout 日志
- 生产环境请通过反向代理或网关暴露 HTTPS
- 日志中保留 `request_id`、错误码、处理耗时，不记录原图与 Base64 内容

## 手工验收

- 选择本地图片后进入编辑页
- 手动框选或涂抹水印区域
- 成功提交并返回去水印结果
- 结果图片可本地保存
- 非法输入和服务异常有清晰错误提示
- 超过 `10MB` 的图片会被拒绝
- 超过 `4096x4096` 的图片会被拒绝
