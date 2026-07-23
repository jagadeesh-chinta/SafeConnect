import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2Icon, TrashIcon, PencilIcon } from "lucide-react";

function MessageContextMenu({ x, y, onClose, onDeleteForMe, onDeleteForEveryone, onEdit, canEditOrDeleteForEveryone = true }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();
    const handleContextMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Use setTimeout to avoid the same right-click event immediately closing the menu
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("scroll", handleScroll, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 160);

  const style = {
    position: "fixed",
    top: adjustedY,
    left: adjustedX,
    zIndex: 9999,
  };

  return createPortal(
    <div ref={menuRef} style={style} className="glass-card rounded-xl shadow-2xl py-1.5 min-w-[200px] border border-border animate-fade-in-up">
      <button
        onClick={() => { onDeleteForMe(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
      >
        <TrashIcon className="w-4 h-4 text-text-muted" />
        Delete for Me
      </button>
      {canEditOrDeleteForEveryone && (
        <>
          <button
            onClick={() => { onDeleteForEveryone(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-bg-secondary transition-colors"
          >
            <Trash2Icon className="w-4 h-4" />
            Delete for Everyone
          </button>
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
          >
            <PencilIcon className="w-4 h-4 text-text-muted" />
            Edit
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

export default MessageContextMenu;
