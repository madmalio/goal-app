// --- TYPES ---
export type SeverityLevel = "functional" | "foundational" | "grade-level";
export type GradeBand = "PK" | "K-2" | "3-5" | "6-8" | "9-12" | "All";
export type CanonicalSubject =
  | "reading"
  | "math"
  | "writing"
  | "behavior"
  | "social"
  | "speech"
  | "ot"
  | "pt"
  | "transition"
  | "life skills";

export interface GoalTemplate {
  text: string;
  tags: string[];
  category: string;
  severity: SeverityLevel;
  gradeBands: GradeBand[];
  subject?: CanonicalSubject;
}

// --- CONFIGURATION & HELPERS ---
function getGradeBand(grade: string): GradeBand {
  const g = grade.toUpperCase();
  if (["PK", "PRE-K", "ECSE"].includes(g)) return "PK";
  if (["K", "1", "2"].includes(g)) return "K-2";
  if (["3", "4", "5"].includes(g)) return "3-5";
  if (["6", "7", "8"].includes(g)) return "6-8";
  if (["9", "10", "11", "12", "TRANSITION"].includes(g)) return "9-12";
  return "All";
}

function getTargetSeverity(classType: string): SeverityLevel {
  if (classType === "SES3" || classType === "Life Skills") return "functional";
  if (classType === "SES2") return "foundational";
  return "grade-level"; // Gen Ed, Resource, SES1
}

// Map user input to canonical subjects
export const SUBJECT_SYNONYMS: Record<string, CanonicalSubject> = {
  ela: "reading",
  reading: "reading",
  phonics: "reading",
  flu: "reading",
  lit: "reading",
  math: "math",
  algebra: "math",
  geometry: "math",
  calc: "math",
  number: "math",
  writing: "writing",
  composition: "writing",
  handwriting: "writing",
  behavior: "behavior",
  executive: "behavior",
  study: "behavior",
  attention: "behavior",
  social: "social",
  sel: "social",
  friends: "social",
  speech: "speech",
  language: "speech",
  slp: "speech",
  articulation: "speech",
  ot: "ot",
  motor: "ot",
  fine: "ot",
  sensory: "ot",
  pt: "pt",
  physical: "pt",
  mobility: "pt",
  gross: "pt",
  transition: "transition",
  job: "transition",
  career: "transition",
  vocational: "transition",
  work: "transition",
  life: "life skills",
  hygiene: "life skills",
  cooking: "life skills",
  adaptive: "life skills",
};

function normalizeSubject(input?: string): CanonicalSubject | undefined {
  if (!input) return undefined;
  const key = input.toLowerCase().trim();
  if (SUBJECT_SYNONYMS[key]) return SUBJECT_SYNONYMS[key];
  for (const [syn, canonical] of Object.entries(SUBJECT_SYNONYMS)) {
    if (key.includes(syn)) return canonical;
  }
  return undefined;
}

// --- THE MASTER GOAL LIBRARY ---
const MASTER_LIBRARY: GoalTemplate[] = [
  // ==================================================================================
  // READING (PK-12)
  // ==================================================================================
  // Functional
  {
    severity: "functional",
    gradeBands: ["PK", "K-2"],
    tags: ["reading", "attention"],
    category: "Pre-Reading",
    text: "{{name}} will attend to a story read aloud for 3 minutes without leaving their seat.",
  },
  {
    severity: "functional",
    gradeBands: ["PK", "K-2"],
    tags: ["reading", "motor"],
    category: "Pre-Reading",
    text: "{{name}} will hold a book right-side up and turn pages individually.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["reading", "safety"],
    category: "Functional",
    text: "{{name}} will identify common safety signs (Exit, Stop, Restroom) in the school environment.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["reading"],
    category: "Functional",
    text: "{{name}} will identify their own first name in print from a field of 3 options.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["reading"],
    category: "Functional",
    text: "{{name}} will match identical pictures of common objects.",
  },
  {
    severity: "functional",
    gradeBands: ["6-8", "9-12"],
    tags: ["reading", "life skills"],
    category: "Functional",
    text: "{{name}} will locate specific information (price, item) on a menu.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["reading", "vocational"],
    category: "Functional",
    text: "{{name}} will read and follow a 3-step pictorial direction to complete a vocational task.",
  },

  // Foundational
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["reading", "phonics"],
    category: "Phonics",
    text: "{{name}} will identify all 26 uppercase and lowercase letters.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["reading", "phonics"],
    category: "Phonics",
    text: "{{name}} will produce the primary sound for each consonant letter.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["reading", "phonics"],
    category: "Phonics",
    text: "{{name}} will blend CVC sounds to decode simple words (e.g., c-a-t).",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["reading"],
    category: "Sight Words",
    text: "{{name}} will read 20 pre-primer sight words with automaticity.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5"],
    tags: ["reading"],
    category: "Decoding",
    text: "{{name}} will decode words with long vowel patterns (CVCe) with 80% accuracy.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5"],
    tags: ["reading"],
    category: "Fluency",
    text: "{{name}} will read a 2nd-grade level passage at 60 words per minute.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5", "6-8"],
    tags: ["reading"],
    category: "Comprehension",
    text: "{{name}} will answer literal 'who', 'what', and 'where' questions about a text.",
  },
  {
    severity: "foundational",
    gradeBands: ["6-8", "9-12"],
    tags: ["reading"],
    category: "Vocabulary",
    text: "{{name}} will use context clues to identify the meaning of an unknown word in a sentence.",
  },

  // Grade Level
  {
    severity: "grade-level",
    gradeBands: ["K-2"],
    tags: ["reading"],
    category: "Retell",
    text: "{{name}} will retell a story including the beginning, middle, and end.",
  },
  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["reading"],
    category: "Inference",
    text: "{{name}} will make inferences about a character's feelings based on text evidence.",
  },
  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["reading"],
    category: "Main Idea",
    text: "{{name}} will determine the main idea of an informational text and explain how it is supported by key details.",
  },
  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["reading"],
    category: "Fluency",
    text: "{{name}} will read grade-level text with sufficient accuracy and fluency to support comprehension.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8"],
    tags: ["reading"],
    category: "Analysis",
    text: "{{name}} will analyze how a particular sentence, chapter, or scene fits into the overall structure of a text.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8"],
    tags: ["reading"],
    category: "Comparison",
    text: "{{name}} will compare and contrast two texts on the same topic.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["reading"],
    category: "Analysis",
    text: "{{name}} will cite strong and thorough textual evidence to support an analysis of what the text says explicitly.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["reading"],
    category: "Argument",
    text: "{{name}} will delineate and evaluate the argument and specific claims in a text.",
  },

  // ==================================================================================
  // WRITING (PK-12)
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["PK", "K-2"],
    tags: ["writing", "motor"],
    category: "Pre-Writing",
    text: "{{name}} will use a pincer grasp to hold a writing utensil.",
  },
  {
    severity: "functional",
    gradeBands: ["PK", "K-2"],
    tags: ["writing", "motor"],
    category: "Pre-Writing",
    text: "{{name}} will trace vertical, horizontal, and diagonal lines within visual boundaries.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["writing"],
    category: "Functional",
    text: "{{name}} will sign their first and last name on a document.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["writing"],
    category: "Vocational",
    text: "{{name}} will fill out a personal information form (name, address, phone) legibly.",
  },

  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["writing"],
    category: "Mechanics",
    text: "{{name}} will write their first name legibly on lined paper.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2", "3-5"],
    tags: ["writing"],
    category: "Sentence",
    text: "{{name}} will write a complete simple sentence with a capital letter and period.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5", "6-8"],
    tags: ["writing"],
    category: "Grammar",
    text: "{{name}} will identify and correct errors in capitalization and end punctuation.",
  },
  {
    severity: "foundational",
    gradeBands: ["6-8", "9-12"],
    tags: ["writing"],
    category: "Composition",
    text: "{{name}} will write a 5-sentence paragraph with a clear topic sentence.",
  },

  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["writing"],
    category: "Narrative",
    text: "{{name}} will write a narrative with a clear sequence of events and descriptive details.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8"],
    tags: ["writing"],
    category: "Argument",
    text: "{{name}} will write an argument supporting a claim with clear reasons and relevant evidence.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["writing"],
    category: "Research",
    text: "{{name}} will gather relevant information from multiple authoritative print and digital sources.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["writing"],
    category: "Revision",
    text: "{{name}} will develop and strengthen writing by planning, revising, editing, and rewriting.",
  },

  // ==================================================================================
  // MATH (PK-12)
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["math"],
    category: "Sorting",
    text: "{{name}} will sort objects by a single attribute (color, shape, or size).",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["math"],
    category: "Counting",
    text: "{{name}} will count objects to 10 with 1:1 correspondence.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["math", "money"],
    category: "Money",
    text: "{{name}} will identify a penny, nickel, dime, and quarter.",
  },
  {
    severity: "functional",
    gradeBands: ["6-8", "9-12"],
    tags: ["math", "money"],
    category: "Money",
    text: "{{name}} will use the 'next dollar up' strategy to make a purchase.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["math", "life skills"],
    category: "Time",
    text: "{{name}} will identify the correct time to leave for a specific activity using a digital schedule.",
  },

  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["math"],
    category: "Operations",
    text: "{{name}} will solve single-digit addition problems with sums up to 10 using manipulatives.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["math"],
    category: "Patterns",
    text: "{{name}} will complete an ABAB pattern using objects or pictures.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5"],
    tags: ["math"],
    category: "Operations",
    text: "{{name}} will solve two-digit addition problems with regrouping.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5"],
    tags: ["math"],
    category: "Operations",
    text: "{{name}} will solve single-digit multiplication facts (0-9) with 80% accuracy.",
  },
  {
    severity: "foundational",
    gradeBands: ["3-5", "6-8"],
    tags: ["math"],
    category: "Time",
    text: "{{name}} will tell time to the nearest 5 minutes on an analog clock.",
  },
  {
    severity: "foundational",
    gradeBands: ["6-8"],
    tags: ["math"],
    category: "Money",
    text: "{{name}} will calculate the total cost of items from a menu using a calculator.",
  },
  {
    severity: "foundational",
    gradeBands: ["9-12"],
    tags: ["math"],
    category: "Measurement",
    text: "{{name}} will measure objects to the nearest 1/4 inch using a ruler.",
  },
  {
    severity: "foundational",
    gradeBands: ["9-12"],
    tags: ["math"],
    category: "Budgeting",
    text: "{{name}} will maintain a checkbook register by adding deposits and subtracting withdrawals.",
  },

  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["math"],
    category: "Fractions",
    text: "{{name}} will compare two fractions with different numerators and different denominators.",
  },
  {
    severity: "grade-level",
    gradeBands: ["3-5"],
    tags: ["math"],
    category: "Word Problems",
    text: "{{name}} will solve multi-step word problems involving the four operations.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8"],
    tags: ["math"],
    category: "Algebra",
    text: "{{name}} will solve one-step linear equations.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8"],
    tags: ["math"],
    category: "Ratios",
    text: "{{name}} will use ratio and rate reasoning to solve real-world and mathematical problems.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["math"],
    category: "Geometry",
    text: "{{name}} will use geometric formulas to calculate volume and surface area.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["math"],
    category: "Statistics",
    text: "{{name}} will interpret data presented in charts, graphs, and tables.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["math"],
    category: "Algebra",
    text: "{{name}} will solve systems of linear equations.",
  },

  // ==================================================================================
  // BEHAVIOR & EXECUTIVE FUNCTION (All Ages)
  // ==================================================================================
  // SES3 / Severe
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior", "safety"],
    category: "Safety",
    text: "{{name}} will stop at a curb or boundary when given a verbal prompt.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior", "safety"],
    category: "Safety",
    text: "{{name}} will remain within the designated classroom area for 15 minutes.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Elopement",
    text: "{{name}} will ask for permission before leaving the room.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Regulation",
    text: "{{name}} will maintain a safe body (no hitting/kicking) when frustrated.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Compliance",
    text: "{{name}} will follow a 1-step direction within 10 seconds of the prompt.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Transitions",
    text: "{{name}} will transition from a preferred to non-preferred activity with physical prompts only.",
  },

  // SES2 / Moderate
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Task Initiation",
    text: "{{name}} will begin a task within 2 minutes of the initial directive.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Attention",
    text: "{{name}} will attend to a non-preferred task for 10 minutes with fewer than 2 prompts.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Refusal",
    text: "{{name}} will accept a 'no' answer or a correction without yelling or leaving the area.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Transitions",
    text: "{{name}} will transition between activities within 2 minutes without verbal outbursts.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Social",
    text: "{{name}} will keep hands and feet to self in line.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Regulation",
    text: "{{name}} will identify their emotion (happy, sad, mad) using a visual chart.",
  },

  // SES1 / Mild
  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Organization",
    text: "{{name}} will record homework assignments in a planner daily.",
  },
  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Organization",
    text: "{{name}} will bring necessary materials (pencil, notebook) to class.",
  },
  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Self-Advocacy",
    text: "{{name}} will ask for help or clarification when they do not understand a direction.",
  },
  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["behavior"],
    category: "Coping",
    text: "{{name}} will identify when they are becoming frustrated and use a coping strategy (e.g. deep breathing) independently.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8", "9-12"],
    tags: ["behavior"],
    category: "Completion",
    text: "{{name}} will turn in completed homework assignments on time 90% of the week.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8", "9-12"],
    tags: ["behavior"],
    category: "Self-Monitoring",
    text: "{{name}} will accurate rate their own on-task behavior at the end of a period.",
  },

  // ==================================================================================
  // SOCIAL SKILLS
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["K-2", "3-5"],
    tags: ["social"],
    category: "Play",
    text: "{{name}} will engage in parallel play near a peer for 5 minutes.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Interaction",
    text: "{{name}} will make eye contact when their name is called.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Greetings",
    text: "{{name}} will respond to a greeting from a peer or adult.",
  },

  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Turn Taking",
    text: "{{name}} will take turns during a structured game/activity with a peer.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Conversation",
    text: "{{name}} will maintain a conversation on a preferred topic for 3 exchanges.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Boundaries",
    text: "{{name}} will maintain appropriate personal space (arm's length) when talking.",
  },

  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Conversation",
    text: "{{name}} will ask a peer a follow-up question to maintain a conversation.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8", "9-12"],
    tags: ["social"],
    category: "Conflict",
    text: "{{name}} will use 'I statements' to resolve conflicts with peers without adult intervention.",
  },
  {
    severity: "grade-level",
    gradeBands: ["All"],
    tags: ["social"],
    category: "Perspective",
    text: "{{name}} will identify how a specific behavior might make others feel.",
  },

  // ==================================================================================
  // LIFE SKILLS & ADL
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Hygiene",
    text: "{{name}} will wash and dry hands following a visual task analysis.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Hygiene",
    text: "{{name}} will use a tissue to wipe nose and throw it away.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Toileting",
    text: "{{name}} will indicate the need for the restroom using a sign or picture.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Feeding",
    text: "{{name}} will use a utensil to feed self with minimal spillage.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Feeding",
    text: "{{name}} will open lunch containers independently.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["life skills"],
    category: "Dressing",
    text: "{{name}} will put on and zip/button a coat.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["life skills"],
    category: "Cooking",
    text: "{{name}} will follow a simple picture recipe to prepare a snack.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["life skills"],
    category: "Laundry",
    text: "{{name}} will sort laundry by color and temperature setting.",
  },

  // ==================================================================================
  // TRANSITION & VOCATIONAL (9-12)
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["transition", "vocational"],
    category: "Vocational",
    text: "{{name}} will complete a multi-step assembly task using a visual guide.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["transition", "life skills"],
    category: "Vocational",
    text: "{{name}} will sort recycling items into correct bins with 90% accuracy.",
  },
  {
    severity: "functional",
    gradeBands: ["9-12"],
    tags: ["transition", "life skills"],
    category: "Vocational",
    text: "{{name}} will wipe down tables in the cafeteria following a checklist.",
  },

  {
    severity: "foundational",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Employment",
    text: "{{name}} will identify 3 jobs of interest and list one requirement for each.",
  },
  {
    severity: "foundational",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Employment",
    text: "{{name}} will fill out a mock job application with personal information.",
  },
  {
    severity: "foundational",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Community",
    text: "{{name}} will identify the correct bus to take to a desired location.",
  },

  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Post-Secondary",
    text: "{{name}} will research 3 colleges or trade schools and list admission requirements.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Employment",
    text: "{{name}} will create a resume highlighting skills, education, and experience.",
  },
  {
    severity: "grade-level",
    gradeBands: ["9-12"],
    tags: ["transition"],
    category: "Interviewing",
    text: "{{name}} will answer common interview questions clearly and professionally.",
  },

  // ==================================================================================
  // SPEECH & LANGUAGE (SLP)
  // ==================================================================================
  {
    severity: "foundational",
    gradeBands: ["K-2", "3-5"],
    tags: ["speech", "language"],
    category: "Articulation",
    text: "{{name}} will produce the /r/ sound in all positions of words with 80% accuracy.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2", "3-5"],
    tags: ["speech", "language"],
    category: "Articulation",
    text: "{{name}} will produce the /s/ sound in sentences with 80% accuracy.",
  },
  {
    severity: "foundational",
    gradeBands: ["All"],
    tags: ["speech", "language"],
    category: "Language",
    text: "{{name}} will follow 2-step directions containing spatial concepts (under, next to).",
  },
  {
    severity: "grade-level",
    gradeBands: ["3-5", "6-8"],
    tags: ["speech", "language"],
    category: "Pragmatics",
    text: "{{name}} will stay on topic during a 3-minute conversation with a peer.",
  },
  {
    severity: "grade-level",
    gradeBands: ["6-8", "9-12"],
    tags: ["speech", "language"],
    category: "Pragmatics",
    text: "{{name}} will interpret non-verbal cues (facial expressions, body language) of others.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["speech", "aac"],
    category: "AAC",
    text: "{{name}} will use their device to request a desired item in 4 out of 5 opportunities.",
  },

  // ==================================================================================
  // OCCUPATIONAL THERAPY (OT) & PHYSICAL THERAPY (PT)
  // ==================================================================================
  {
    severity: "functional",
    gradeBands: ["PK", "K-2"],
    tags: ["ot", "motor"],
    category: "Fine Motor",
    text: "{{name}} will cut along a curved line with scissors with 1/4 inch accuracy.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["ot", "sensory"],
    category: "Sensory",
    text: "{{name}} will request a sensory break using a visual card before becoming dysregulated.",
  },
  {
    severity: "foundational",
    gradeBands: ["K-2"],
    tags: ["ot", "handwriting"],
    category: "Handwriting",
    text: "{{name}} will write letters with correct formation and alignment on the line.",
  },
  {
    severity: "functional",
    gradeBands: ["All"],
    tags: ["pt", "motor"],
    category: "Gross Motor",
    text: "{{name}} will navigate the school environment safely, including stairs, without assistance.",
  },
  {
    severity: "functional",
    gradeBands: ["K-2"],
    tags: ["pt", "motor"],
    category: "Gross Motor",
    text: "{{name}} will catch a large ball thrown from 5 feet away.",
  },
];

// --- V2 SEARCH ALGORITHM (Now Supports Custom Goals) ---
export function findSmartGoalsV2(
  subject: string,
  classType: string,
  grade: string,
  studentName: string,
  // Allow passing custom templates to the search engine
  customTemplates: { text: string; subject: string }[] = [],
  options: { limit?: number } = {}
): GoalTemplate[] {
  const cleanSubject = (subject || "").toLowerCase();
  const canonicalSubject = normalizeSubject(cleanSubject);
  const firstName = studentName.split(" ")[0] || "The student";

  const targetSeverity = getTargetSeverity(classType);
  const targetBand = getGradeBand(grade);
  const limit = options.limit || 100;

  // 1. NORMALIZE CUSTOM GOALS
  const normalizedCustom: GoalTemplate[] = customTemplates.map((c) => ({
    text: c.text,
    tags: [c.subject.toLowerCase(), "custom"],
    category: "My Library",
    severity: "grade-level", // Default
    gradeBands: ["All"],
    subject: normalizeSubject(c.subject),
  }));

  // 2. MERGE LIBRARIES
  const FULL_LIBRARY = [...normalizedCustom, ...MASTER_LIBRARY];

  // 3. FILTER LOGIC
  let matches = FULL_LIBRARY.filter((g) => {
    // A. Custom goals for this subject always match
    if (g.tags.includes("custom") && g.tags[0].includes(cleanSubject))
      return true;

    // B. Subject Match
    // Check canonical (e.g. "Algebra" -> "math") OR raw tags
    const tagMatch = g.tags.some((t) => cleanSubject.includes(t));
    const catMatch = g.category.toLowerCase().includes(cleanSubject);
    const canonicalMatch = canonicalSubject
      ? g.tags.includes(canonicalSubject)
      : false;

    // Special handling for "Behavior" which often overlaps with "Social"
    const behaviorOverlap =
      (cleanSubject.includes("behavior") && g.tags.includes("social")) ||
      (cleanSubject.includes("social") && g.tags.includes("behavior"));

    const isSubjectMatch =
      tagMatch || catMatch || canonicalMatch || behaviorOverlap;

    // C. Grade Band Match
    const isBandMatch =
      g.gradeBands.includes(targetBand) || g.gradeBands.includes("All");

    // D. Overrides
    // Functional Override: High Schoolers in SES3 need access to K-2/Functional goals
    const isFunctionalOverride =
      targetSeverity === "functional" && g.severity === "functional";

    // Transition Override: High Schoolers searching for "job" need Transition goals regardless of severity
    const isTransitionSearch =
      cleanSubject.includes("job") ||
      cleanSubject.includes("work") ||
      cleanSubject.includes("college") ||
      cleanSubject.includes("transit");
    const isTransitionOverride =
      targetBand === "9-12" &&
      isTransitionSearch &&
      g.tags.includes("transition");

    return (
      isSubjectMatch &&
      (isBandMatch || isFunctionalOverride || isTransitionOverride)
    );
  });

  // 4. FALLBACK (If no matches found)
  if (matches.length === 0) {
    if (targetSeverity === "functional") {
      matches = MASTER_LIBRARY.filter(
        (g) =>
          g.severity === "functional" &&
          (g.tags.includes("life skills") || g.tags.includes("behavior"))
      );
    } else {
      matches = MASTER_LIBRARY.filter(
        (g) => g.tags.includes("behavior") || g.tags.includes("study skills")
      );
    }
  }

  // 5. RANKING & FORMATTING
  return matches
    .map((g) => ({
      ...g,
      text: g.text.replace(/{{name}}/g, firstName),
    }))
    .sort((a, b) => {
      // Priority 1: User's Custom Goals
      const isCustomA = a.category === "My Library" ? 1 : 0;
      const isCustomB = b.category === "My Library" ? 1 : 0;
      if (isCustomA !== isCustomB) return isCustomB - isCustomA;

      // Priority 2: Exact Severity Match
      const scoreA = a.severity === targetSeverity ? 0 : 1;
      const scoreB = b.severity === targetSeverity ? 0 : 1;
      if (scoreA !== scoreB) return scoreA - scoreB;

      // Priority 3: Randomize slightly to rotate options
      return Math.random() - 0.5;
    })
    .slice(0, limit);
}

// Legacy wrapper
export function findSmartGoals(
  subject: string,
  classType: string,
  grade: string,
  studentName: string,
  customTemplates: any[] = []
) {
  return findSmartGoalsV2(
    subject,
    classType,
    grade,
    studentName,
    customTemplates
  );
}
