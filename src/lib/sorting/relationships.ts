import type { Category, Question } from "./questions";
import type { RelationshipType } from "./interview-prompt";

export type RelationshipConfig = {
  type: RelationshipType;
  label: string;
  description: string;
  autoOpenFloors: (number | "B")[];
  autoGatedFloors: (number | "B")[];
  requestableFloors: (number | "B")[];
  skipQuestions: boolean;
  fixedArchetype?: string; // key into ARCHETYPES
};

export const RELATIONSHIP_CONFIGS: Record<RelationshipType, RelationshipConfig> =
  {
    "inner-circle": {
      // Lobby, Gallery, Dojo + Living Room auto-approved = 4
      type: "inner-circle",
      label: "INNER CIRCLE",
      description: "the building knows your name.",
      autoOpenFloors: [0, 11, 3],
      autoGatedFloors: [1],
      requestableFloors: [4, 6, 10, 12, 7],
      skipQuestions: false,
    },
    "bjj-friend": {
      // Lobby, Dojo, Gallery + Gym auto-approved = 4
      type: "bjj-friend",
      label: "THE MAT",
      description: "you've bled on the same canvas.",
      autoOpenFloors: [0, 3, 11],
      autoGatedFloors: [10],
      requestableFloors: [1, 12],
      skipQuestions: false,
    },
    "recovery-friend": {
      // Lobby + Hollow auto-approved, Chapel auto-approved = 3
      type: "recovery-friend",
      label: "THE HOLLOW",
      description: "you walked through something together.",
      autoOpenFloors: [0],
      autoGatedFloors: [2, 12],
      requestableFloors: [1],
      skipQuestions: false,
    },
    "work-colleague": {
      // Lobby, Terminal, Front Desk + Office auto-approved = 4
      type: "work-colleague",
      label: "THE OFFICE",
      description: "you built something in the same room.",
      autoOpenFloors: [0, 5, 9],
      autoGatedFloors: [4],
      requestableFloors: [6, 10],
      skipQuestions: false,
    },
    "old-acquaintance": {
      // Lobby, New Wing, Gallery = 3
      type: "old-acquaintance",
      label: "THE OLD WING",
      description: "the building remembers you. faintly.",
      autoOpenFloors: [0, 8, 11],
      autoGatedFloors: [],
      requestableFloors: [1, 12],
      skipQuestions: false,
    },
    "ex-partner": {
      type: "ex-partner",
      label: "THE BLACK HOLE",
      description: "the building has a quiet place for you.",
      autoOpenFloors: [],
      autoGatedFloors: [],
      requestableFloors: [],
      skipQuestions: true,
      fixedArchetype: "ghost",
    },
    admirer: {
      // Lobby + New Wing = 2 (minimal access, Bret gets notified)
      type: "admirer",
      label: "THE QUIET FLOOR",
      description: "the building heard you. some signals travel further than others.",
      autoOpenFloors: [0, 8],
      autoGatedFloors: [],
      requestableFloors: [],
      skipQuestions: true,
      fixedArchetype: "signal",
    },
    fan: {
      // Lobby, New Wing, Gallery, Dojo = 4
      type: "fan",
      label: "THE GALLERY",
      description: "you followed the signal here.",
      autoOpenFloors: [0, 8, 11, 3],
      autoGatedFloors: [],
      requestableFloors: [10, 12],
      skipQuestions: false,
    },
    wanderer: {
      // Lobby, New Wing = 2 (strangers earn their way)
      type: "wanderer",
      label: "THE NEW WING",
      description: "you don't know what you're looking for yet.",
      autoOpenFloors: [0, 8],
      autoGatedFloors: [],
      requestableFloors: [],
      skipQuestions: false,
    },
    recruiter: {
      // Front Desk only = 1
      type: "recruiter",
      label: "THE FRONT DESK",
      description: "leave your card.",
      autoOpenFloors: [9],
      autoGatedFloors: [],
      requestableFloors: [],
      skipQuestions: true,
      fixedArchetype: "operator",
    },
    business: {
      // Lobby, Front Desk, Terminal = 3
      type: "business",
      label: "THE FRONT DESK",
      description: "the building is listening.",
      autoOpenFloors: [0, 9, 5],
      autoGatedFloors: [],
      requestableFloors: [4],
      skipQuestions: false,
    },
    "bjj-curious": {
      // Lobby, New Wing, Dojo = 3
      type: "bjj-curious",
      label: "THE DOJO",
      description: "the mat is waiting.",
      autoOpenFloors: [0, 8, 3],
      autoGatedFloors: [],
      requestableFloors: [10],
      skipQuestions: false,
    },
  };

// --- Targeted Questions Per Relationship ---

export const TARGETED_QUESTIONS: Record<RelationshipType, Question[]> = {
  "inner-circle": [
    {
      id: 101,
      prompt:
        "bret goes dark. no texts, no posts, nothing.\nthree days. you:",
      style: "standard",
      answers: [
        {
          id: "door",
          text: "Already at his door.",
          scores: { personal: 3, old_friends: 2 },
        },
        {
          id: "text",
          text: "Gave him one day. Then texted.",
          scores: { philosophy: 3 },
        },
        {
          id: "call",
          text: "Called someone who'd know.",
          scores: { recovery: 2, health: 2 },
        },
        {
          id: "didnt",
          text: "Didn't notice. We don't talk like that.",
          scores: { old_friends: 3 },
        },
      ],
    },
    {
      id: 102,
      prompt: "the thing about bret that nobody talks about:",
      style: "standard",
      answers: [
        {
          id: "cares",
          text: "He cares more than he'd ever admit.",
          scores: { recovery: 2, personal: 2 },
        },
        {
          id: "relentless",
          text: "He's relentless. Annoyingly so.",
          scores: { bjj: 2, coding: 2 },
        },
        {
          id: "funny",
          text: "He's funnier than people realize.",
          scores: { old_friends: 3 },
        },
        {
          id: "overthinks",
          text: "He overthinks everything.",
          scores: { philosophy: 2, writing: 2 },
        },
      ],
    },
    {
      id: 103,
      prompt:
        "the last time you two really talked \u2014\nnot texted, talked \u2014 what was it about?",
      style: "standard",
      answers: [
        {
          id: "stupid",
          text: "Something stupid. That's how we are.",
          scores: { old_friends: 3 },
        },
        {
          id: "heavy",
          text: "Something heavy. That's how we are.",
          scores: { recovery: 2, personal: 2 },
        },
        {
          id: "project",
          text: "A project. An idea. Something he was building.",
          scores: { coding: 2, work: 2 },
        },
        {
          id: "cant_remember",
          text: "Honestly? I can't remember.",
          scores: { philosophy: 3 },
        },
      ],
    },
  ],

  "bjj-friend": [
    {
      id: 201,
      prompt: "worst thing about jiu-jitsu. pick one.",
      style: "standard",
      answers: [
        { id: "ego", text: "The ego.", scores: { philosophy: 3 } },
        { id: "injuries", text: "The injuries.", scores: { health: 3 } },
        {
          id: "politics",
          text: "The politics.",
          scores: { business: 2, work: 2 },
        },
        {
          id: "nothing",
          text: "Nothing. I'd live on the mat if I could.",
          scores: { bjj: 4 },
        },
      ],
    },
    {
      id: 202,
      prompt: "why do you still train?",
      style: "standard",
      answers: [
        {
          id: "brain",
          text: "It's the only thing that shuts my brain off.",
          scores: { recovery: 2, philosophy: 2 },
        },
        {
          id: "better",
          text: "I'm not done getting better.",
          scores: { bjj: 3 },
        },
        {
          id: "people",
          text: "The people.",
          scores: { new_friends: 2, old_friends: 2 },
        },
        {
          id: "without",
          text: "I don't know what I'd do without it.",
          scores: { personal: 3 },
        },
      ],
    },
    {
      id: 203,
      prompt: "off the mat, what are you?",
      style: "standard",
      answers: [
        {
          id: "building",
          text: "Building something.",
          scores: { coding: 2, work: 2 },
        },
        {
          id: "recovering",
          text: "Recovering from something.",
          scores: { recovery: 3 },
        },
        {
          id: "writing",
          text: "Writing about something.",
          scores: { writing: 3 },
        },
        {
          id: "looking",
          text: "Looking for something.",
          scores: { philosophy: 2, new_friends: 2 },
        },
      ],
    },
  ],

  "recovery-friend": [
    {
      id: 301,
      prompt: "how long you been at this?",
      style: "standard",
      answers: [
        {
          id: "long",
          text: "Long enough to stop counting.",
          scores: { recovery: 3, philosophy: 1 },
        },
        {
          id: "not_long",
          text: "Not long enough.",
          scores: { recovery: 3 },
        },
        {
          id: "on_off",
          text: "On and off. Honest answer.",
          scores: { personal: 3 },
        },
        {
          id: "define",
          text: "Define 'this.'",
          scores: { philosophy: 3 },
        },
      ],
    },
    {
      id: 302,
      prompt:
        "the thing that keeps you coming back to the work.\nwhat is it?",
      style: "standard",
      answers: [
        {
          id: "someone",
          text: "Someone who needs me to.",
          scores: { personal: 2, old_friends: 2 },
        },
        {
          id: "spite",
          text: "Spite. I refuse to go back.",
          scores: { bjj: 3 },
        },
        {
          id: "becoming",
          text: "I actually like who I'm becoming.",
          scores: { recovery: 2, philosophy: 2 },
        },
        {
          id: "dunno",
          text: "I don't know yet. That's the honest answer.",
          scores: { philosophy: 3 },
        },
      ],
    },
    {
      id: 303,
      prompt: "what does this space need to be for you?",
      style: "standard",
      answers: [
        {
          id: "perform",
          text: "Somewhere I don't have to perform.",
          scores: { personal: 3 },
        },
        {
          id: "honest",
          text: "Somewhere I can be honest.",
          scores: { recovery: 3 },
        },
        {
          id: "people",
          text: "Somewhere with people who get it.",
          scores: { new_friends: 2, recovery: 2 },
        },
        {
          id: "disappear",
          text: "Somewhere I can disappear when I need to.",
          scores: { philosophy: 3 },
        },
      ],
    },
  ],

  "work-colleague": [
    {
      id: 401,
      prompt:
        "bret quit the job. you didn't.\nsays something. what does it say?",
      style: "standard",
      answers: [
        {
          id: "braver",
          text: "He's braver than me.",
          scores: { personal: 2, philosophy: 2 },
        },
        {
          id: "crazier",
          text: "He's crazier than me.",
          scores: { old_friends: 3 },
        },
        {
          id: "afford",
          text: "He could afford to.",
          scores: { business: 3 },
        },
        {
          id: "different",
          text: "We want different things.",
          scores: { work: 2, philosophy: 2 },
        },
      ],
    },
    {
      id: 402,
      prompt:
        "if you never had to work again,\nwhat would you do tomorrow?",
      style: "standard",
      answers: [
        {
          id: "same",
          text: "Same thing. I actually like it.",
          scores: { coding: 2, work: 2 },
        },
        { id: "train", text: "Train.", scores: { bjj: 2, health: 2 } },
        {
          id: "write",
          text: "Write. Make something.",
          scores: { writing: 2, music_art: 2 },
        },
        {
          id: "nothing",
          text: "Nothing. For a very long time.",
          scores: { recovery: 2, personal: 2 },
        },
        {
          id: "new",
          text: "Start something new.",
          scores: { business: 3 },
        },
      ],
    },
    {
      id: 403,
      prompt: "friday 5pm. work is over. where are you?",
      style: "standard",
      answers: [
        {
          id: "working",
          text: "Still working.",
          scores: { work: 3 },
        },
        { id: "gym", text: "Gym.", scores: { health: 2, bjj: 2 } },
        {
          id: "bar",
          text: "Bar. Honestly.",
          scores: { personal: 3 },
        },
        {
          id: "home",
          text: "Home. Finally.",
          scores: { personal: 2, recovery: 2 },
        },
        {
          id: "shouldnt",
          text: "Somewhere I shouldn't be.",
          scores: { philosophy: 3 },
        },
      ],
    },
  ],

  "old-acquaintance": [
    {
      id: 501,
      prompt: "why'd you lose touch? real answer.",
      style: "standard",
      answers: [
        {
          id: "life",
          text: "Life got in the way.",
          scores: { personal: 3 },
        },
        {
          id: "me",
          text: "I got in the way.",
          scores: { recovery: 2, personal: 2 },
        },
        {
          id: "him",
          text: "He got in the way.",
          scores: { personal: 3 },
        },
        {
          id: "drift",
          text: "Nobody's fault. People drift.",
          scores: { philosophy: 3 },
        },
      ],
    },
    {
      id: 502,
      prompt:
        "what do you think happened to him\nsince you last talked?",
      style: "standard",
      answers: [
        {
          id: "more",
          text: "More than I know.",
          scores: { philosophy: 3 },
        },
        {
          id: "expected",
          text: "Exactly what I expected.",
          scores: { old_friends: 3 },
        },
        {
          id: "online",
          text: "I saw some of it online.",
          scores: { music_art: 2, new_friends: 2 },
        },
        {
          id: "no_idea",
          text: "No idea. That's why I'm here.",
          scores: { new_friends: 3 },
        },
      ],
    },
    {
      id: 503,
      prompt: "if he doesn't remember you, what do you do?",
      style: "standard",
      answers: [
        {
          id: "leave",
          text: "Leave. Not gonna explain myself.",
          scores: { personal: 3 },
        },
        {
          id: "remind",
          text: "Remind him.",
          scores: { old_friends: 3 },
        },
        {
          id: "stay",
          text: "Stay anyway. This place is interesting.",
          scores: { new_friends: 2, philosophy: 2 },
        },
        {
          id: "fine",
          text: "That's fine. I barely remember me from back then either.",
          scores: { recovery: 3 },
        },
      ],
    },
  ],

  fan: [
    {
      id: 601,
      prompt: "what brought you here \u2014 the memes or the man?",
      style: "standard",
      answers: [
        {
          id: "memes",
          text: "The memes. Didn't know there was a man behind them.",
          scores: { music_art: 3 },
        },
        {
          id: "both",
          text: "Both. Content led me to the person.",
          scores: { personal: 2, philosophy: 2 },
        },
        {
          id: "link",
          text: "Followed a link and now I'm in whatever this is.",
          scores: { new_friends: 3 },
        },
        {
          id: "bjj",
          text: "The jiu-jitsu content specifically.",
          scores: { bjj: 3 },
        },
      ],
    },
    {
      id: 602,
      prompt:
        "what are you looking for here\nthat you can't get from the content?",
      style: "standard",
      answers: [
        {
          id: "community",
          text: "Community.",
          scores: { new_friends: 3 },
        },
        {
          id: "real",
          text: "Something real. Content is content.",
          scores: { personal: 2, philosophy: 2 },
        },
        {
          id: "bjj_talk",
          text: "More jiu-jitsu talk.",
          scores: { bjj: 3 },
        },
        {
          id: "dunno",
          text: "I don't know yet.",
          scores: { philosophy: 3 },
        },
      ],
    },
  ],

  wanderer: [
    {
      id: 701,
      prompt:
        "you don't know the owner. you don't know the building.\nyou're here anyway. why?",
      style: "standard",
      answers: [
        {
          id: "curiosity",
          text: "Curiosity.",
          scores: { philosophy: 3 },
        },
        {
          id: "told",
          text: "Someone told me about it.",
          scores: { new_friends: 3 },
        },
        {
          id: "aesthetic",
          text: "I liked the aesthetic.",
          scores: { music_art: 3 },
        },
        {
          id: "looking",
          text: "I was looking for something. Not sure this is it.",
          scores: { personal: 3 },
        },
      ],
    },
    {
      id: 702,
      prompt: "last thing you got obsessed with. go.",
      style: "standard",
      answers: [
        {
          id: "project",
          text: "A project I couldn't stop building.",
          scores: { coding: 3 },
        },
        {
          id: "question",
          text: "A question I couldn't stop asking.",
          scores: { philosophy: 3 },
        },
        {
          id: "person",
          text: "A person I couldn't stop thinking about.",
          scores: { personal: 3 },
        },
        {
          id: "physical",
          text: "Something physical \u2014 sport, training, the body.",
          scores: { bjj: 2, health: 2 },
        },
        {
          id: "art",
          text: "A sound, a film, an image.",
          scores: { music_art: 3 },
        },
      ],
    },
  ],

  business: [
    {
      id: 801,
      prompt: "what do you bring to the table? skip the pitch.",
      style: "standard",
      answers: [
        {
          id: "tech",
          text: "Technical skill.",
          scores: { coding: 3 },
        },
        {
          id: "money",
          text: "Money or connections.",
          scores: { business: 3 },
        },
        {
          id: "creative",
          text: "Creative vision.",
          scores: { writing: 2, music_art: 2 },
        },
        {
          id: "problem",
          text: "A problem worth solving.",
          scores: { work: 2, philosophy: 2 },
        },
      ],
    },
    {
      id: 802,
      prompt: "when a deal falls apart, what do you do?",
      style: "standard",
      answers: [
        {
          id: "build",
          text: "Build something else.",
          scores: { coding: 2, work: 2 },
        },
        {
          id: "another",
          text: "Find another deal.",
          scores: { business: 3 },
        },
        {
          id: "wrong",
          text: "Figure out what went wrong.",
          scores: { philosophy: 3 },
        },
        {
          id: "train",
          text: "Go train.",
          scores: { bjj: 2, health: 2 },
        },
      ],
    },
  ],

  "bjj-curious": [
    {
      id: 901,
      prompt:
        "what is it about getting choked by strangers\nthat appeals to you?",
      style: "standard",
      answers: [
        {
          id: "chess",
          text: "The chess match.",
          scores: { philosophy: 2, coding: 2 },
        },
        {
          id: "humility",
          text: "The humility.",
          scores: { recovery: 2, personal: 2 },
        },
        {
          id: "community",
          text: "The community.",
          scores: { new_friends: 3 },
        },
        {
          id: "dangerous",
          text: "I want to be dangerous.",
          scores: { bjj: 3 },
        },
      ],
    },
    {
      id: 902,
      prompt:
        "have you started yet, or are you still\nwatching from the door?",
      style: "standard",
      answers: [
        {
          id: "looking",
          text: "Haven't started. Looking for the right gym.",
          scores: { new_friends: 3 },
        },
        {
          id: "humbled",
          text: "Tried once. Got humbled. Thinking about going back.",
          scores: { bjj: 2, recovery: 2 },
        },
        {
          id: "watch",
          text: "I watch a lot of competition footage.",
          scores: { music_art: 3 },
        },
        {
          id: "add",
          text: "I do something else. Want to add this.",
          scores: { health: 2, bjj: 2 },
        },
      ],
    },
  ],

  // These skip questions — empty arrays
  "ex-partner": [],
  admirer: [],
  recruiter: [],
};
