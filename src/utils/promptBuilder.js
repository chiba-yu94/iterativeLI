export function buildIntroFromMemory(coreMemory, longTermMemory) {
  if (!coreMemory && !longTermMemory) return "";

  const bullets = [];

  if (coreMemory?.includes("Name:")) {
    bullets.push("I remember some things you've shared with me before.");
  }

  const likes = coreMemory.match(/Likes:\s*(.*)/)?.[1]?.trim();
  if (likes) bullets.push(`You enjoy ${likes.toLowerCase()}.`);

  const mood = coreMemory.match(/Current Mood\/Emotion:\s*(.*)/)?.[1]?.trim();
  if (mood && mood !== "Not provided") {
    bullets.push(`You’ve recently felt ${mood.toLowerCase()}.`);
  }

  const reflections = longTermMemory?.match(/Important Reflections \((bullet points)?\):([\s\S]+?)(\n\n|$)/);
  if (reflections && reflections[2]) {
    const points = reflections[2].trim().split(/\n|- /).filter(Boolean).slice(0, 2);
    if (points.length > 0) {
      bullets.push(`You've been reflecting on things like ${points.join(" and ")}.`);
    }
  }

  if (bullets.length === 0) return "";

  return `Welcome back. ${bullets.join(" ")} Would you like to continue where we left off, or explore something new today?`;
}
