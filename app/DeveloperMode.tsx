import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { getDeveloperNote } from "./developerNotes";

type Marker = {
  id: string;
  title: string;
  top: number;
  left: number;
};

const TOOL_SELECTOR = "[data-dev-tool]";

export function DeveloperMode() {
  const [enabled, setEnabled] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const pointerStartedInToolRef = useRef(false);

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

    const eventStartedInTool = (event: Event) =>
      event.composedPath().some((target) => target instanceof Element && target.matches(TOOL_SELECTOR));

    const blockPageAction = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
      ) {
        return;
      }
      if (
        event instanceof KeyboardEvent &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "c"
      ) {
        return;
      }
      if (event.type === "mousedown") {
        pointerStartedInToolRef.current = eventStartedInTool(event);
      }
      if (eventStartedInTool(event)) return;
      if (event.type === "click" && pointerStartedInToolRef.current) {
        pointerStartedInToolRef.current = false;
        return;
      }
      setActiveNoteId(null);
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
      const markerScope = getMarkerScope();
      const seen = new Set<string>();
      const nextMarkers = Array.from(markerScope.querySelectorAll<HTMLElement>("[data-dev-note]"))
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
            top: Math.max(12, rect.top - 10),
            left: Math.max(12, rect.left + rect.width - 12),
          };
        })
        .filter(Boolean) as Marker[];
      setMarkers(nextMarkers);
      setActiveNoteId((current) =>
        current && nextMarkers.some((marker) => marker.id === current) ? current : null,
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
  }, [enabled]);

  const activeNote = useMemo(
    () => (activeNoteId ? getDeveloperNote(activeNoteId) : null),
    [activeNoteId],
  );
  const activeMarker = markers.find((marker) => marker.id === activeNoteId);
  const popoverStyle =
    activeMarker && typeof window !== "undefined"
      ? getPopoverStyle(activeMarker)
      : undefined;

  return (
    <>
      {enabled && (
        <div className="dev-mode-root" data-dev-tool>
          <div className="dev-freeze-banner">
            开发模式已开启：页面操作已冻结，只能查看规则备注。快捷键 Ctrl/Cmd + Shift + D
          </div>

          {markers.map((marker, index) => (
            <button
              className={`dev-marker ${activeNote?.id === marker.id ? "active" : ""}`}
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

          {activeNote && activeMarker && (
            <aside className="dev-popover" data-dev-tool style={popoverStyle}>
              <span className="dev-popover-arrow" />
              <section className="dev-note-card">
                <span className="dev-note-category">{activeNote.category}</span>
                <h3>{activeNote.title}</h3>
                <p>{activeNote.summary}</p>
                <RuleList title="前置校验" items={activeNote.checks} />
                <RuleList title="内部影响" items={activeNote.effects} />
                <RuleList title="禁止条件" items={activeNote.blockedWhen} />
                <RuleList title="补充说明" items={activeNote.notes} />
              </section>
            </aside>
          )}
        </div>
      )}
    </>
  );
}

function getMarkerScope() {
  const modals = document.querySelectorAll<HTMLElement>(".modal");
  return modals[modals.length - 1] ?? document.body;
}

function getPopoverStyle(marker: Marker): CSSProperties {
  const width = 340;
  const estimatedHeight = 360;
  const gap = 18;
  const left =
    marker.left + gap + width > window.innerWidth
      ? Math.max(12, marker.left - width - gap)
      : marker.left + gap;
  const top =
    marker.top + estimatedHeight > window.innerHeight
      ? Math.max(52, window.innerHeight - estimatedHeight - 12)
      : Math.max(52, marker.top - 4);

  return { left, top, width };
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
