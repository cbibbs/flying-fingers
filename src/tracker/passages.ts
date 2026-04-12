/**
 * Built-in practice passages for the typing trainer.
 *
 * Each passage is a self-contained typing exercise designed to be completed
 * in a reasonable time (2–10 minutes at typical speeds). Passages cover
 * different typing challenges: short quotes, technical text, prose, etc.
 */

export interface Passage {
  /** Unique identifier for this passage. */
  id: string;

  /** Display name (shown in dropdown). */
  name: string;

  /** The text to be typed. */
  text: string;

  /** Difficulty level: "easy", "medium", or "hard". */
  difficulty: "easy" | "medium" | "hard";
}

/**
 * Built-in passages (at least 8, per plan.md acceptance criteria).
 */
export const PASSAGES: Passage[] = [
  {
    id: "passage-001",
    name: "Quick Brown Fox",
    difficulty: "easy",
    text: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet and is commonly used for typing practice and font displays.",
  },
  {
    id: "passage-002",
    name: "Learning to Code",
    difficulty: "medium",
    text: "Learning to code is an exciting journey. You start with the basics of programming logic, then gradually tackle more complex algorithms and data structures. Practice is essential for mastery.",
  },
  {
    id: "passage-003",
    name: "Morning Coffee",
    difficulty: "easy",
    text: "There is nothing quite like the aroma of fresh coffee brewing in the morning. The warm cup cradled in your hands, the first sip awakening your senses—it is a simple pleasure that many cherish.",
  },
  {
    id: "passage-004",
    name: "Web Development",
    difficulty: "hard",
    text: "Modern web development encompasses HTML semantics, CSS layout techniques, JavaScript interactivity, and progressive enhancement. Developers must balance accessibility, performance, and user experience while maintaining clean, testable code architecture.",
  },
  {
    id: "passage-005",
    name: "Mountain Adventure",
    difficulty: "medium",
    text: "The mountain trail wound upward through dense pine forests. After hours of climbing, the summit revealed vast vistas of rolling peaks and distant valleys. The effort was rewarded by breathtaking views.",
  },
  {
    id: "passage-006",
    name: "Technology Basics",
    difficulty: "easy",
    text: "Technology has transformed our daily lives. From smartphones to personal computers, digital tools enable communication, learning, and productivity. Understanding the fundamentals is increasingly important for everyone.",
  },
  {
    id: "passage-007",
    name: "Data Structures",
    difficulty: "hard",
    text: "Hash tables provide constant-time average lookup when collision resolution is handled efficiently. Binary search trees maintain sorted order while supporting logarithmic insertion and deletion. Understanding trade-offs between data structures is crucial for algorithm optimization.",
  },
  {
    id: "passage-008",
    name: "Sunset Reflections",
    difficulty: "medium",
    text: "As the sun descended toward the horizon, the sky transformed into shades of orange, pink, and purple. The ocean reflected the changing colors, creating a mirror of light on the water. It was a moment of perfect tranquility.",
  },
  {
    id: "passage-009",
    name: "Software Testing",
    difficulty: "hard",
    text: "Comprehensive test coverage requires unit tests for individual functions, integration tests for component interactions, and end-to-end tests for full workflows. Test-driven development encourages writing tests first, ensuring behavior is specified before implementation.",
  },
];

/**
 * Get a passage by its ID.
 */
export function getPassageById(id: string): Passage | undefined {
  return PASSAGES.find((p) => p.id === id);
}

/**
 * Get all passages for display in a dropdown.
 */
export function getAllPassages(): Passage[] {
  return PASSAGES;
}
