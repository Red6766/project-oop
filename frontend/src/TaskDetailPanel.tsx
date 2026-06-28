import { useState, useRef, useEffect } from "react";
import { aiGenerateSubtasks, aiImproveDescription, taskApi } from "./api";
import type { TaskRes, UserRes } from "./api";
import { columns, priorityLabels, userName } from "./taskConstants";

export function TaskDetailModal({ task, users, onClose, projectId, userId }: { task: TaskRes; users: UserRes[]; onClose: () => void; projectId: number; userId: number }) {
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showSubtask, setShowSubtask] = useState(false);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtaskItems, setSubtaskItems] = useState<{ id: number; title: string; checked: boolean }[]>([]);
  const [editTitle, setEditTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (editTitle && titleRef.current) {
      const range = document.createRange();
      range.selectNodeContents(titleRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editTitle]);

  const handleSaveTitle = async () => {
    const text = titleRef.current?.textContent?.trim() || titleText.trim();
    if (!text) return;
    try {
      const updated = await taskApi.updateTitle(task.id, titleText);
      Object.assign(task, updated);
      setEditTitle(false);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to update title");
    }
  };

  const handleSubtask = async () => {
    setSubtasksLoading(true);
    setAiError("");
    try {
      const result = await aiGenerateSubtasks(task.title, task.description);
      const items = result
        .split("\n")
        .map(line => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
        .map((title, i) => ({ id: i, title, checked: true }));
      setSubtaskItems(items);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to generate subtasks");
    } finally {
      setSubtasksLoading(false);
    }
  };

  const toggleSubtask = (id: number) => {
    setSubtaskItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const updateSubtaskTitle = (id: number, title: string) => {
    setSubtaskItems(prev => prev.map(item => item.id === id ? { ...item, title } : item));
  };

  const addSelectedSubtasks = async () => {
    setAiError("");
    const selected = subtaskItems.filter(item => item.checked);
    try {
      for (const item of selected) {
        await taskApi.create({ title: item.title, description: "", projectId, createdById: userId, priority: 2 });
      }
      setSubtaskItems([]);
      setShowSubtask(false);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to create subtasks");
    }
  };

  const handleGenerate = async () => {
    if (!feedback.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const result = await aiImproveDescription(task.title, feedback || task.description);
      setAiText(result);
      setFeedback("");
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "AI error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApply = async () => {
    setApplyLoading(true);
    try {
      const updated = await taskApi.updateDescription(task.id, aiText);
      Object.assign(task, updated);
      setShowAi(false);
      setAiText("");
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
          <h2
            ref={titleRef}
            contentEditable={editTitle}
            suppressContentEditableWarning
            onInput={e => setTitleText(e.currentTarget.textContent || "")}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSaveTitle(); } }}
            style={{
              margin: 0,
              flex: 1,
              outline: editTitle ? "1px solid #666" : "none",
              outlineOffset: editTitle ? 7 : 0,
              padding: 0,
              borderRadius: 0,
              cursor: editTitle ? "text" : "default",
            }}
          >{task.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
        </div>
        <p style={{ color: "#666", marginBottom: 16, lineHeight: 1.5 }}>{task.description || "No description"}</p>
        <div style={{ display: "flex", gap: 12, fontSize: 14, color: "#888", marginBottom: 16 }}>
          <span>Priority: <strong>{priorityLabels[task.priority] || "?"}</strong></span>
          <span>Status: <strong>{columns.find(c => c.key === task.status)?.title || "?"}</strong></span>
          <span>Assignee: <strong>{userName(users, task.assigneeId)}</strong></span>
        </div>

        {/* Title edit / Description edit / Subtasks */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {editTitle ? (
            <>
              <button onClick={handleSaveTitle} className="keycap-btn keycap-btn-solid" style={{ fontSize: 12, padding: "6px 12px" }}>Save</button>
              <button onClick={() => { setEditTitle(false); }} className="keycap-btn keycap-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => { setEditTitle(true); setTitleText(task.title); }} className="keycap-btn keycap-btn-outline" style={{ fontSize: 12, padding: "6px 12px" }}>Edit title</button>
          )}
          <button onClick={() => { setShowAi(!showAi); if (!showAi) setAiText(task.description || ""); }} className="keycap-btn keycap-btn-outline" style={{ fontSize: 12, padding: "6px 12px" }}>
            {showAi ? "Cancel" : "Edit description"}
          </button>
          <button onClick={() => { setShowSubtask(!showSubtask); if (!showSubtask) setSubtaskItems([]); }} className="keycap-btn keycap-btn-outline" style={{ fontSize: 12, padding: "6px 12px" }}>
            {showSubtask ? "Cancel" : "Subtasks"}
          </button>
        </div>

        {aiError && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{aiError}</p>}

        {showAi && (
          <div>
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              rows={4}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", resize: "vertical", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleApply} disabled={applyLoading} className="keycap-btn keycap-btn-solid" style={{ fontSize: 12, padding: "6px 14px" }}>
                {applyLoading ? "..." : "Save"}
              </button>
              <input
                placeholder="AI prompt (optional — make shorter, more detailed...)"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }}
              />
              <button onClick={handleGenerate} disabled={aiLoading || !feedback.trim()} className="keycap-btn keycap-btn-outline" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {aiLoading ? "..." : "AI"}
              </button>
            </div>
          </div>
        )}

        {showSubtask && (
          <div style={{ padding: 12, background: "#fafafa", border: "1px solid #eee", marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
              AI will split this task into 3-5 smaller subtasks. Select which ones to add to the project.
            </p>
            <button onClick={handleSubtask} disabled={subtasksLoading} className="keycap-btn keycap-btn-solid" style={{ fontSize: 12, padding: "6px 14px" }}>
              {subtasksLoading ? "Generating..." : "Generate with AI"}
            </button>
            {subtaskItems.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {subtaskItems.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleSubtask(item.id)} style={{ accentColor: "#222" }} />
                    <input
                      value={item.title}
                      onChange={e => updateSubtaskTitle(item.id, e.target.value)}
                      style={{ flex: 1, padding: "6px 8px", border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <button onClick={addSelectedSubtasks} className="keycap-btn keycap-btn-solid" style={{ fontSize: 12, padding: "6px 14px", marginTop: 8 }}>
                  Add selected ({subtaskItems.filter(i => i.checked).length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
