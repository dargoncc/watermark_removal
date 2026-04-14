import { useMemo } from "react";

import { ResultViewer } from "./components/result/ResultViewer";
import { requestInpaint } from "./lib/api/inpaintClient";
import { exportMaskPng, hasMaskSelection } from "./lib/mask/exportMask";
import { openImageFromDialog, saveResultImage } from "./lib/tauri/fileBridge";
import { EditorPage } from "./pages/EditorPage";
import { createResultImage, useAppStore } from "./store/appStore";


const DEFAULT_API_BASE_URL = "http://localhost:8000";

function buildSuggestedFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0) {
    return `${fileName}-clean.png`;
  }

  return `${fileName.slice(0, lastDotIndex)}-clean.png`;
}

export default function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const {
    activeTool,
    addBrushStroke,
    addRectangle,
    clearMask,
    clearError,
    errorMessage,
    importedImage,
    jobState,
    maskState,
    resetToEditing,
    resultImage,
    setActiveTool,
    setError,
    setImportedImage,
    setJobState,
    setResult,
  } = useAppStore();

  const canSubmit = useMemo(
    () =>
      importedImage !== null &&
      hasMaskSelection(maskState.rectangles, maskState.brushStrokes) &&
      jobState !== "uploading" &&
      jobState !== "processing",
    [importedImage, jobState, maskState.brushStrokes, maskState.rectangles],
  );

  const handleOpenImage = async () => {
    const imported = await openImageFromDialog();
    if (imported === null) {
      return;
    }

    setImportedImage(imported);
  };

  const handleSubmit = async () => {
    if (!importedImage) {
      return;
    }

    clearError();
    setJobState("uploading");

    try {
      const maskBlob = await exportMaskPng({
        width: importedImage.width,
        height: importedImage.height,
        rectangles: maskState.rectangles,
        brushStrokes: maskState.brushStrokes,
      });
      const maskBytes = new Uint8Array(await maskBlob.arrayBuffer());
      setJobState("processing");

      const response = await requestInpaint({
        apiBaseUrl,
        imageName: importedImage.fileName,
        imageBytes: importedImage.bytes,
        maskBytes,
      });

      if (!response.ok) {
        setError(response.message, response.code);
        return;
      }

      setResult(
        createResultImage({
          blob: response.blob,
          objectUrl: response.objectUrl,
          processTimeMs: response.response.data.process_time_ms,
          requestId: response.response.data.request_id,
        }),
      );
    } catch {
      setError("遮罩导出失败，请稍后重试", 9001);
    }
  };

  const handleSave = async () => {
    if (!resultImage || !importedImage) {
      return;
    }

    try {
      await saveResultImage(resultImage, buildSuggestedFileName(importedImage.fileName));
    } catch {
      setError("结果保存失败", 9003);
      resetToEditing();
    }
  };

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="hero">
          <div>
            <p className="eyebrow">Desktop 1.0</p>
            <h1 className="hero-title">本地标注，云端修复，专注处理小面积文字与 Logo 水印。</h1>
            <p className="hero-copy">
              先选择图片，再用矩形或画笔标出要处理的区域。1.0 版本聚焦可靠闭环，不做自动识别与历史记录。
            </p>
          </div>
          {importedImage === null ? (
            <button className="button button--primary button--hero" onClick={handleOpenImage} type="button">
              选择图片
            </button>
          ) : null}
        </header>

        {importedImage === null ? (
          <section className="empty-state panel-card">
            <p className="eyebrow">准备开始</p>
            <h2 className="panel-title">先导入一张图片</h2>
            <p className="panel-subtitle">
              支持 PNG / JPG / JPEG。建议先从角落水印或边缘文字水印开始，首版对小面积区域效果最好。
            </p>
          </section>
        ) : resultImage && jobState === "success" ? (
          <ResultViewer
            importedImage={importedImage}
            onBackToEdit={resetToEditing}
            onSave={handleSave}
            resultImage={resultImage}
          />
        ) : (
          <EditorPage
            activeTool={activeTool}
            canSubmit={canSubmit}
            errorMessage={errorMessage}
            importedImage={importedImage}
            jobState={jobState}
            maskState={maskState}
            onAddBrushStroke={addBrushStroke}
            onAddRectangle={addRectangle}
            onClearMask={clearMask}
            onOpenImage={handleOpenImage}
            onSubmit={handleSubmit}
            onToolChange={setActiveTool}
          />
        )}
      </div>
    </main>
  );
}
