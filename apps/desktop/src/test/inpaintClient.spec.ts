import { vi } from "vitest";

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: vi.fn(),
}));

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { requestInpaint } from "../lib/api/inpaintClient";


const fetchMock = vi.mocked(tauriFetch);


describe("requestInpaint", () => {
  it("returns decoded image data when server responds with code 200", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 200,
          data: {
            image_base64: btoa("png-bytes"),
            mime_type: "image/png",
            request_id: "req-1",
            process_time_ms: 123,
          },
          message: "操作成功",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await requestInpaint({
      apiBaseUrl: "http://localhost:8000",
      imageName: "demo.png",
      imageBytes: new Uint8Array([1, 2, 3]),
      maskBytes: new Uint8Array([4, 5, 6]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.response.data.request_id).toBe("req-1");
    expect(result.blob.type).toBe("image/png");
  });

  it("returns server business error when code is non-200", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 4005,
          data: null,
          message: "Mask 尺寸必须与原图一致",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await requestInpaint({
      apiBaseUrl: "http://localhost:8000",
      imageName: "demo.png",
      imageBytes: new Uint8Array([1, 2, 3]),
      maskBytes: new Uint8Array([4, 5, 6]),
    });

    expect(result).toEqual({
      ok: false,
      code: 4005,
      message: "Mask 尺寸必须与原图一致",
    });
  });

  it("maps transport errors to local client error code", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("network down"));

    const result = await requestInpaint({
      apiBaseUrl: "http://localhost:8000",
      imageName: "demo.png",
      imageBytes: new Uint8Array([1, 2, 3]),
      maskBytes: new Uint8Array([4, 5, 6]),
    });

    expect(result).toEqual({
      ok: false,
      code: 9001,
      message: "服务暂时不可用，请稍后重试",
    });
  });
});
