// MemoryControls.jsx
import SaveReflectionButton from "./SaveReflectionButton";
// import ReflectionLog from "./ReflectionLog"; // Temporarily removed
// import WeeklyReflectionButton from "./WeeklyReflectionButton"; // Temporarily removed

export default function MemoryControls({
  messages,
  pending,
  reloadFlag,
  setReloadFlag,
}) {
  return (
    <div>
      <SaveReflectionButton
        messages={messages}
        pending={pending}
        onSaved={() => setReloadFlag(v => !v)}
      />
      {/* <ReflectionLog reloadFlag={reloadFlag} /> */}
      {/* <WeeklyReflectionButton onSaved={() => setReloadFlag(v => !v)} /> */}
    </div>
  );
}
