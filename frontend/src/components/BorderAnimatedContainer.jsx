function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full [background:var(--bg-elevated)_padding-box,conic-gradient(from_var(--border-angle),var(--border)_80%,_var(--accent-primary)_88%,_var(--accent-secondary)_92%,_var(--accent-primary)_96%,_var(--border))_border-box] rounded-[24px] border border-transparent animate-border flex overflow-hidden shadow-[0_8px_32px_var(--glow)] backdrop-blur-[16px]">
      {children}
    </div>
  );
}
export default BorderAnimatedContainer;
