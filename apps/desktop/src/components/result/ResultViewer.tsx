import { useState } from "react";

import type { ImportedImage, ResultImage } from "../../types/editor";


type ResultViewerProps = {
  importedImage: ImportedImage;
  onBackToEdit: () => void;
  onSave: () => void;
  resultImage: ResultImage;
};

export function ResultViewer(props: ResultViewerProps) {
  const [previewMode, setPreviewMode] = useState<"result" | "original">("result");
  const activeImage = previewMode === "result" ? props.resultImage.objectUrl : props.importedImage.objectUrl;

  return (
    <section className="result-layout">
      <div className="panel-card panel-card--accent">
        <p className="eyebrow">处理结果</p>
        <h2 className="panel-title">处理结果</h2>
        <p className="panel-subtitle">请求号：{props.resultImage.requestId}</p>
      </div>

      <div className="result-preview">
        <div className="result-toolbar">
          <div className="toggle-group">
            <button
              className={`toggle-button ${previewMode === "result" ? "toggle-button--active" : ""}`}
              onClick={() => setPreviewMode("result")}
              type="button"
            >
              查看结果
            </button>
            <button
              className={`toggle-button ${previewMode === "original" ? "toggle-button--active" : ""}`}
              onClick={() => setPreviewMode("original")}
              type="button"
            >
              查看原图
            </button>
          </div>
          <span className="result-time">处理耗时 {props.resultImage.processTimeMs} ms</span>
        </div>
        <div className="result-image-frame">
          <img alt="处理结果" className="result-image" src={activeImage} />
        </div>
      </div>

      <div className="panel-card">
        <p className="eyebrow">下一步</p>
        <div className="action-stack">
          <button className="button button--primary" onClick={props.onSave} type="button">
            保存结果图片
          </button>
          <button className="button button--secondary" onClick={props.onBackToEdit} type="button">
            返回继续编辑
          </button>
        </div>
      </div>
    </section>
  );
}

