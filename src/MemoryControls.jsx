import SaveReflectionButton from "./SaveReflectionButton";
import ReflectionLog from "./ReflectionLog";
import WeeklyReflectionButton from "./WeeklyReflectionButton";

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
      <ReflectionLog reloadFlag={reloadFlag} />
      <WeeklyReflectionButton onSaved={() => setReloadFlag(v => !v)} />
    </div>
  );
}
