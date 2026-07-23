import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";

function GlobalMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return (
    <>
      <div className="absolute top-4 right-4 z-40">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 rounded-lg transition-all p-2"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border rounded-xl p-2 shadow-xl">
              <button
                onClick={() => {
                  navigate("/requests");
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-text-primary hover:bg-bg-secondary rounded-lg transition-all font-medium"
              >
                Requests
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-text-primary hover:bg-bg-secondary rounded-lg transition-all font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default GlobalMenu;
