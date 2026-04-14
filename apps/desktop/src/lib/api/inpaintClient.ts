import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

import type {
  ApiResponse,
  InpaintResultData,
  RequestInpaintOptions,
  RequestInpaintResult,
} from "../../types/api";


const REQUEST_TIMEOUT_MS = 20_000;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const normalized = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? bytes
    : bytes.slice();
  return normalized.buffer as ArrayBuffer;
}

function inferMimeType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "image/png";
}

function base64ToBlob(base64Value: string, mimeType: string): Blob {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function createTimeoutSignal(timeoutMs: number): { controller: AbortController; timeoutId: number } {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

export async function requestInpaint(
  options: RequestInpaintOptions,
): Promise<RequestInpaintResult> {
  const requestId = crypto.randomUUID();
  const formData = new FormData();
  formData.append(
    "image",
    new File([toArrayBuffer(options.imageBytes)], options.imageName, {
      type: inferMimeType(options.imageName),
    }),
  );
  formData.append(
    "mask",
    new File([toArrayBuffer(options.maskBytes)], "mask.png", {
      type: "image/png",
    }),
  );
  formData.append("output_format", options.outputFormat ?? "png");
  formData.append("request_id", requestId);

  const { controller, timeoutId } = createTimeoutSignal(options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await tauriFetch(`${options.apiBaseUrl}/api/v1/inpaint`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (response.status !== 200) {
      return {
        ok: false,
        code: 9001,
        message: "服务暂时不可用，请稍后重试",
      };
    }

    const payload = (await response.json()) as ApiResponse<InpaintResultData>;
    if (payload.code !== 200 || payload.data === null) {
      return {
        ok: false,
        code: payload.code as RequestInpaintResult extends { ok: false; code: infer T } ? T : never,
        message: payload.message,
      };
    }

    const blob = base64ToBlob(payload.data.image_base64, payload.data.mime_type);
    const objectUrl = URL.createObjectURL(blob);

    return {
      ok: true,
      response: payload as ApiResponse<InpaintResultData> & { data: InpaintResultData },
      blob,
      objectUrl,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        code: 9002,
        message: "请求处理超时",
      };
    }

    return {
      ok: false,
      code: 9001,
      message: "服务暂时不可用，请稍后重试",
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
