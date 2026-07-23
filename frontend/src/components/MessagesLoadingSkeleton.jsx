function MessagesLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className={`chat ${index % 2 === 0 ? "chat-start" : "chat-end"} animate-pulse`}
        >
          <div className={`chat-bubble bg-bg-elevated border border-border w-48 h-12 rounded-2xl`}></div>
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;
