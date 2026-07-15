import { useEffect, useMemo, useState } from "react";
import { developerNotes, getDeveloperNote } from "./developerNotes";

type Marker = {
  id: string;
  title: string;
  top: number;
  left: number;
};

export type DeveloperContext = {
  view: string;
  page: string;
  studentPoints: number;
  productCount: number;
  activeProductCount: number;
  pendingOrderCount: number;
  completedOrderCount: number;
  cancelledOrderCount: number;
};

type DeveloperModeProps = {
  context: DeveloperContext;
};

const TOOL_SELECTOR = "[data-dev-tool]";

export function DeveloperMode({ context }: DeveloperModeProps) {
  const [enabled, setEnabled] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string>("student-mall-page");
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTyping) return;

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setEnabled((current) => !current);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const blockPageAction = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest(TOOL_SELECTOR)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("click", blockPageAction, true);
    document.addEventListener("mousedown", blockPageAction, true);
    document.addEventListener("submit", blockPageAction, true);
    document.addEventListener("keydown", blockPageAction, true);

    return () => {
      document.removeEventListener("click", blockPageAction, true);
      document.removeEventListener("mousedown", blockPageAction, true);
      document.removeEventListener("submit", blockPageAction, true);
      document.removeEventListener("keydown", blockPageAction, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setMarkers([]);
      return;
    }

    function collectMarkers() {
      const seen = new Set<string>();
      const nextMarkers = Array.from(document.querySelectorAll<HTMLElement>("[data-dev-note]"))
        .map((element) => {
          const id = element.dataset.devNote;
          if (!id || seen.has(id)) return null;
          const note = getDeveloperNote(id);
          if (!note) return null;
          const rect = element.getBoundingClientRect();
          seen.add(id);
          return {
            id,
            title: note.title,
            top: Math.max(12, rect.top + window.scrollY - 10),
            left: Math.max(12, rect.left + window.scrollX + rect.width - 12),
          };
        })
        .filter(Boolean) as Marker[];
      setMarkers(nextMarkers);
      setActiveNoteId((current) =>
        nextMarkers.some((marker) => marker.id === current) ? current : (nextMarkers[0]?.id ?? current),
      );
    }

    collectMarkers();
    window.addEventListener("scroll", collectMarkers, true);
    window.addEventListener("resize", collectMarkers);
    const observer = new MutationObserver(collectMarkers);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener("scroll", collectMarkers, true);
      window.removeEventListener("resize", collectMarkers);
      observer.disconnect();
    };
  }, [enabled, context.page, context.view]);

  const activeNote = useMemo(
    () => getDeveloperNote(activeNoteId) ?? developerNotes[0],
    [activeNoteId],
  );

  return (
    <>
      <button
        className={`dev-mode-toggle ${enabled ? "active" : ""}`}
        data-dev-tool
        type="button"
        onClick={() => setEnabled((current) => !current)}
        title="快捷键：Ctrl/Cmd + Shift + D"
      >
        {enabled ? "关闭开发模式" : "开发说明"}
      </button>

      {enabled && (
        <div className="dev-mode-root" data-dev-tool>
          <div className="dev-freeze-banner">
            开发模式已开启：页面操作已冻结，只能查看规则备注。快捷键 Ctrl/Cmd + Shift + D
          </div>

          {markers.map((marker, index) => (
            <button
              className={`dev-marker ${activeNote.id === marker.id ? "active" : ""}`}
              data-dev-tool
              key={marker.id}
              style={{ top: marker.top, left: marker.left }}
              type="button"
              onClick={() => setActiveNoteId(marker.id)}
              title={marker.title}
            >
              {index + 1}
            </button>
          ))}

          <aside className="dev-panel" data-dev-tool>
            <div className="dev-panel-header">
              <div>
                <p>当前状态</p>
                <h2>{context.view} / {context.page}</h2>
              </div>
              <button type="button" onClick={() => setEnabled(false)} data-dev-tool>
                关闭
              </button>
            </div>

            <div className="dev-state-grid">
              <span>学生积分<strong>{context.studentPoints}</strong></span>
              <span>商品总数<strong>{context.productCount}</strong></span>
              <span>上架商品<strong>{context.activeProductCount}</strong></span>
              <span>待领取<strong>{context.pendingOrderCount}</strong></span>
              <span>已完成<strong>{context.completedOrderCount}</strong></span>
              <span>已取消<strong>{context.cancelledOrderCount}</strong></span>
            </div>

            <section className="dev-note-card">
              <span className="dev-note-category">{activeNote.category}</span>
              <h3>{activeNote.title}</h3>
              <p>{activeNote.summary}</p>
              <RuleList title="前置校验" items={activeNote.checks} />
              <RuleList title="内部影响" items={activeNote.effects} />
              <RuleList title="禁止条件" items={activeNote.blockedWhen} />
              <RuleList title="补充说明" items={activeNote.notes} />
            </section>

            <section className="dev-note-index">
              <h3>当前页面说明点</h3>
              {markers.length ? (
                markers.map((marker) => (
                  <button
                    className={activeNote.id === marker.id ? "active" : ""}
                    data-dev-tool
                    key={marker.id}
                    type="button"
                    onClick={() => setActiveNoteId(marker.id)}
                  >
                    {marker.title}
                  </button>
                ))
              ) : (
                <p>当前页面暂无说明点。</p>
              )}
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

function RuleList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="dev-rule-list">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
