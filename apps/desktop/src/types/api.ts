export type ServerErrorCode =
  | 200
  | 4001
  | 4002
  | 4003
  | 4004
  | 4005
  | 5001
  | 5002
  | 5003
  | 6001
  | 6002;

export type ClientErrorCode = 9001 | 9002 | 9003;

export type AppErrorCode = ServerErrorCode | ClientErrorCode;

export interface InpaintResultData {
  image_base64: string;
  mime_type: string;
  request_id: string;
  process_time_ms: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T | null;
  message: string;
}

export interface RequestInpaintOptions {
  apiBaseUrl: string;
  imageName: string;
  imageBytes: Uint8Array;
  maskBytes: Uint8Array;
  outputFormat?: "png" | "jpeg";
  timeoutMs?: number;
}

export interface RequestInpaintSuccess {
  ok: true;
  response: ApiResponse<InpaintResultData> & { data: InpaintResultData };
  blob: Blob;
  objectUrl: string;
}

export interface RequestInpaintFailure {
  ok: false;
  code: AppErrorCode;
  message: string;
}

export type RequestInpaintResult = RequestInpaintSuccess | RequestInpaintFailure;
