import type { EditorTool, JobState } from "../../types/editor";


type ToolbarProps = {
  activeTool: EditorTool;
  canSubmit: boolean;
  fileName: string;
  jobState: JobState;
  onClearMask: () => void;
  onOpenImage: () => void;
  onSubmit: () => void;
  onToolChange: (tool: EditorTool) => void;
};

const toolOptions: Array<{ value: EditorTool; label: string; hint: string }> = [
  { value: "rectangle", label: "矩形框选", hint: "适合角落和边缘的小面积水印" },
  { value: "brush", label: "画笔涂抹", hint: "适合不规则 Logo 或文字边缘" },
  { value: "pan", label: "拖拽浏览", hint: "配合滚轮缩放查看细节" },
];

function getActionLabel(jobState: JobState): string {
  if (jobState === "uploading") {
    return "正在上传图片...";
  }
  if (jobState === "processing") {
    return "云端处理中...";
  }
  return "开始去水印";
}

export function Toolbar(props: ToolbarProps) {
  const isBusy = props.jobState === "uploading" || props.jobState === "processing";

  return (
    <aside className="tool-panel">
      <div className="panel-card panel-card--accent">
        <p className="eyebrow">当前文件</p>
        <h2 className="panel-title">编辑水印区域</h2>
        <p className="panel-subtitle">{props.fileName}</p>
      </div>

      <div className="panel-card">
        <p className="eyebrow">标注工具</p>
        <div className="tool-grid">
          {toolOptions.map((tool) => (
            <button
              key={tool.value}
              className={`tool-chip ${props.activeTool === tool.value ? "tool-chip--active" : ""}`}
              onClick={() => props.onToolChange(tool.value)}
              type="button"
            >
              <span>{tool.label}</span>
              <small>{tool.hint}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <p className="eyebrow">操作</p>
        <div className="action-stack">
          <button className="button button--secondary" onClick={props.onOpenImage} type="button">
            重新选择图片
          </button>
          <button className="button button--ghost" onClick={props.onClearMask} type="button">
            清空选区
          </button>
          <button
            className="button button--primary"
            disabled={!props.canSubmit || isBusy}
            onClick={props.onSubmit}
            type="button"
          >
            {getActionLabel(props.jobState)}
          </button>
        </div>
      </div>
    </aside>
  );
}

