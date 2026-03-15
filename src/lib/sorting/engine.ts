import { Category, FLOORS, Floor } from "./questions";
import type { RelationshipType } from "./interview-prompt";
import { RELATIONSHIP_CONFIGS } from "./relationships";

export type Archetype = {
  name: string;
  description: string;
};

const ARCHETYPES: Record<string, Archetype> = {
  architect: {
    name: "The Architect",
    description: "You build things. Systems, solutions, structures. The terminal is your home.",
  },
  poet: {
    name: "The Poet",
    description: "You see patterns in the noise. Words are your weapons and your medicine.",
  },
  fighter: {
    name: "The Fighter",
    description: "You understand that the body keeps the score. The mat is where you make sense of things.",
  },
  wanderer: {
    name: "The Wanderer",
    description: "You're drawn to the unfamiliar. Every stranger is a door you haven't opened.",
  },
  keeper: {
    name: "The Keeper",
    description: "You hold the threads. The people who matter, the memories that stay.",
  },
  healer: {
    name: "The Healer",
    description: "You've walked through something. Now you walk with others.",
  },
  conductor: {
    name: "The Conductor",
    description: "You orchestrate. Sound, image, feeling — you arrange the world into something felt.",
  },
  ghost: {
    name: "The Ghost",
    description: "You're here but you're not here. Watching. Thinking. The building sees you anyway.",
  },
  operator: {
    name: "The Operator",
    description: "You get things done. Deals, connections, outcomes. The front desk knows your name.",
  },
  monk: {
    name: "The Monk",
    description: "You sit with the questions. Not all of them have answers. That's the point.",
  },
  signal: {
    name: "The Signal",
    description: "You came here looking for someone. The building noticed.",
  },
};

function getArchetype(topTwo: Category[]): Archetype {
  const key = `${topTwo[0]}_${topTwo[1]}`;

  const archetypeMap: Record<string, string> = {
    coding_work: "architect",
    coding_writing: "architect",
    work_coding: "architect",
    writing_philosophy: "poet",
    writing_recovery: "poet",
    writing_music_art: "poet",
    philosophy_writing: "poet",
    bjj_health: "fighter",
    health_bjj: "fighter",
    bjj_work: "fighter",
    bjj_coding: "fighter",
    new_friends_philosophy: "wanderer",
    new_friends_music_art: "wanderer",
    new_friends_personal: "wanderer",
    old_friends_personal: "keeper",
    personal_old_friends: "keeper",
    old_friends_recovery: "keeper",
    recovery_philosophy: "healer",
    recovery_personal: "healer",
    recovery_health: "healer",
    recovery_old_friends: "healer",
    music_art_writing: "conductor",
    music_art_philosophy: "conductor",
    music_art_new_friends: "conductor",
    philosophy_recovery: "monk",
    philosophy_coding: "ghost",
    philosophy_personal: "monk",
    philosophy_music_art: "monk",
    business_work: "operator",
    work_business: "operator",
    business_coding: "operator",
  };

  const archetypeKey = archetypeMap[key] || "ghost";
  return ARCHETYPES[archetypeKey];
}

export type SortingResult = {
  scores: Record<Category, number>;
  ranked: Category[];
  primaryFloors: Floor[];
  gatewayFloors: Floor[];
  archetype: Archetype;
};

export type RelationshipResult = {
  relationshipType: RelationshipType;
  archetype: Archetype;
  primaryFloorRoles: string[];
  autoApprovedFloorRoles: string[];
  gatewayFloorRoles: string[];
  scores: Record<Category, number>;
  ranked: Category[];
};

export function calculateResult(
  answers: Record<number, Partial<Record<Category, number>>>
): SortingResult {
  const scores: Record<Category, number> = {
    personal: 0,
    recovery: 0,
    bjj: 0,
    work: 0,
    coding: 0,
    writing: 0,
    old_friends: 0,
    new_friends: 0,
    business: 0,
    health: 0,
    music_art: 0,
    philosophy: 0,
  };

  // Sum all scores
  for (const answerScores of Object.values(answers)) {
    for (const [category, score] of Object.entries(answerScores)) {
      scores[category as Category] += score;
    }
  }

  // Rank categories
  const ranked = (Object.entries(scores) as [Category, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // Top 2-4 categories become primary floors (only OPEN tier auto-assigned)
  const topCategories = ranked.slice(0, 4);

  const primaryFloors = FLOORS.filter(
    (f) =>
      f.tier === "open" &&
      f.number !== 0 && // Lobby is always included
      topCategories.includes(f.category)
  );

  // Gated floors that match top categories (will require Bret's approval)
  const gatewayFloors = FLOORS.filter(
    (f) => f.tier === "gated" && topCategories.includes(f.category)
  );

  const archetype = getArchetype(ranked.slice(0, 2));

  return {
    scores,
    ranked,
    primaryFloors,
    gatewayFloors,
    archetype,
  };
}

// --- Floor number → role name mapping ---

const FLOOR_ROLE_MAP: Record<string, string> = {
  "0": "floor-0-lobby",
  "1": "floor-1-living-room",
  "2": "floor-2-hollow",
  "3": "floor-3-dojo",
  "4": "floor-4-office",
  "5": "floor-5-terminal",
  "6": "floor-6-study",
  "7": "floor-7-old-wing",
  "8": "floor-8-new-wing",
  "9": "floor-9-front-desk",
  "10": "floor-10-gym",
  "11": "floor-11-gallery",
  "12": "floor-12-chapel",
  "13": "floor-13-rooftop",
  B: "floor-b-basement",
};

function floorToRole(num: number | "B"): string {
  return FLOOR_ROLE_MAP[String(num)] || "";
}

/**
 * Calculate sorting result using the relationship-based system.
 * Relationship type sets access boundaries, targeted question scores determine archetype.
 */
export function calculateRelationshipResult(
  relationshipType: RelationshipType,
  answers: Record<number, Partial<Record<Category, number>>>
): RelationshipResult {
  const config = RELATIONSHIP_CONFIGS[relationshipType];

  // If fixed archetype (ex-partner, recruiter), skip scoring
  if (config.fixedArchetype) {
    const archetype = ARCHETYPES[config.fixedArchetype] || ARCHETYPES.ghost;
    return {
      relationshipType,
      archetype,
      primaryFloorRoles: config.autoOpenFloors.map(floorToRole).filter(Boolean),
      autoApprovedFloorRoles: config.autoGatedFloors.map(floorToRole).filter(Boolean),
      gatewayFloorRoles: [],
      scores: {} as Record<Category, number>,
      ranked: [],
    };
  }

  // Sum targeted question scores
  const scores: Record<Category, number> = {
    personal: 0,
    recovery: 0,
    bjj: 0,
    work: 0,
    coding: 0,
    writing: 0,
    old_friends: 0,
    new_friends: 0,
    business: 0,
    health: 0,
    music_art: 0,
    philosophy: 0,
  };

  for (const answerScores of Object.values(answers)) {
    for (const [category, score] of Object.entries(answerScores)) {
      scores[category as Category] += score;
    }
  }

  // Rank categories
  const ranked = (Object.entries(scores) as [Category, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // Determine archetype from top 2 categories
  const archetype = getArchetype(ranked.slice(0, 2));

  // Primary floors = auto-open from relationship config
  const primaryFloorRoles = config.autoOpenFloors
    .map(floorToRole)
    .filter(Boolean);

  // Auto-approved gated floors = from relationship config
  const autoApprovedFloorRoles = config.autoGatedFloors
    .map(floorToRole)
    .filter(Boolean);

  // Gateway (requestable) floors = filtered by top 4 scoring categories
  const topCategories = ranked.slice(0, 4);
  const gatewayFloorRoles = config.requestableFloors
    .filter((floorNum) => {
      const floor = FLOORS.find((f) => f.number === floorNum);
      return floor && topCategories.includes(floor.category);
    })
    .map(floorToRole)
    .filter(Boolean);

  return {
    relationshipType,
    archetype,
    primaryFloorRoles,
    autoApprovedFloorRoles,
    gatewayFloorRoles,
    scores,
    ranked,
  };
}
