export function buildIntroFromMemory(coreMemory = "", longTermMemory = "") {
  const bullets = [];

  // --- Extract from core memory
  const name = coreMemory.match(/Name:\s*(.*)/)?.[1]?.trim();
  const likes = coreMemory.match(/Likes:\s*(.*)/)?.[1]?.trim();
  const mood = coreMemory.match(/Current Mood\/Emotion:\s*(.*)/)?.[1]?.trim();

  if (name) bullets.push(`Hello again, ${name}.`);
  if (likes) bullets.push(`I remember you enjoy ${likes.toLowerCase()}.`);
  if (mood && mood.toLowerCase() !== "not provided") {
    bullets.push(`You've recently been feeling ${mood.toLowerCase()}.`);
  }

  // --- Extract from long-term memory
  const reflectionsMatch = longTermMemory.match(/Important Reflections \((bullet points)?\):([\s\S]+?)(\n\n|$)/);
  if (reflectionsMatch && reflectionsMatch[2]) {
    const reflectionItems = reflectionsMatch[2]
      .trim()
      .split(/\n|- /)
      .filter(line => line && line.trim().length > 0)
      .slice(0, 2);

    if (reflectionItems.length > 0) {
      bullets.push(`You've been reflecting on things like ${reflectionItems.join(" and ")}.`);
    }
  }

  if (bullets.length === 0) return "";

  return `Welcome back. ${bullets.join(" ")} Would you like to continue where we left off, or explore something new today?`;
}
