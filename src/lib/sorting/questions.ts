export type Category =
  | "personal"
  | "recovery"
  | "bjj"
  | "work"
  | "coding"
  | "writing"
  | "old_friends"
  | "new_friends"
  | "business"
  | "health"
  | "music_art"
  | "philosophy";

export type Floor = {
  number: number | "B";
  name: string;
  category: Category;
  tier: "open" | "gated" | "locked";
};

export const FLOORS: Floor[] = [
  { number: 0, name: "THE LOBBY", category: "personal", tier: "open" },
  { number: 1, name: "THE LIVING ROOM", category: "personal", tier: "gated" },
  { number: 2, name: "THE HOLLOW", category: "recovery", tier: "locked" },
  { number: 3, name: "THE DOJO", category: "bjj", tier: "open" },
  { number: 4, name: "THE OFFICE", category: "work", tier: "gated" },
  { number: 5, name: "THE TERMINAL", category: "coding", tier: "open" },
  { number: 6, name: "THE STUDY", category: "writing", tier: "gated" },
  { number: 7, name: "THE OLD WING", category: "old_friends", tier: "locked" },
  { number: 8, name: "THE NEW WING", category: "new_friends", tier: "open" },
  { number: 9, name: "THE FRONT DESK", category: "business", tier: "open" },
  { number: 10, name: "THE GYM", category: "health", tier: "gated" },
  { number: 11, name: "THE GALLERY", category: "music_art", tier: "open" },
  { number: 12, name: "THE CHAPEL", category: "philosophy", tier: "gated" },
  { number: "B", name: "THE BASEMENT", category: "personal", tier: "locked" },
];

export type Answer = {
  id: string;
  text: string;
  scores: Partial<Record<Category, number>>;
};

export type Question = {
  id: number;
  prompt: string;
  subtext?: string;
  style: "standard" | "binary" | "scattered" | "terminal" | "flashlight";
  answers: Answer[];
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "It's 2 AM. You can't sleep. You pick up your phone.\nWhat do you open?",
    style: "standard",
    answers: [
      {
        id: "notes",
        text: "A notes app. You need to write something down before it disappears.",
        scores: { writing: 3, philosophy: 2 },
      },
      {
        id: "group_chat",
        text: "A group chat. Someone is probably still awake.",
        scores: { personal: 2, old_friends: 2, new_friends: 1 },
      },
      {
        id: "training_vid",
        text: "A training video. Might as well study.",
        scores: { bjj: 3, health: 1 },
      },
      {
        id: "email",
        text: "Your email. You're behind on something.",
        scores: { work: 3, business: 1 },
      },
      {
        id: "nothing",
        text: "Nothing. You put the phone down and sit with it.",
        scores: { philosophy: 3, recovery: 2 },
      },
      {
        id: "rather_not",
        text: "Something you'd rather not say.",
        scores: { recovery: 2, philosophy: 1 },
      },
    ],
  },
  {
    id: 2,
    prompt: "You're carrying two things.\nOne you chose. One chose you.\nWhich is heavier?",
    style: "binary",
    answers: [
      {
        id: "promise",
        text: "The one I chose. A promise I kept that cost me something.",
        scores: { recovery: 2, personal: 2, philosophy: 1 },
      },
      {
        id: "truth",
        text: "The one that chose me. A truth I've never told anyone.",
        scores: { writing: 2, recovery: 2, philosophy: 2 },
      },
    ],
  },
  {
    id: 3,
    prompt: "You walk into a room and realize everyone is watching you.\nWhat do you do?",
    style: "scattered",
    answers: [
      {
        id: "perform",
        text: "Perform.",
        scores: { music_art: 3, writing: 1 },
      },
      {
        id: "disappear",
        text: "Disappear.",
        scores: { philosophy: 2, personal: 1 },
      },
      {
        id: "introduce",
        text: "Introduce yourself to the nearest person.",
        scores: { new_friends: 3, personal: 1 },
      },
      {
        id: "find_charge",
        text: "Find the person in charge.",
        scores: { work: 2, business: 2 },
      },
      {
        id: "fight",
        text: "Start a fight.",
        scores: { bjj: 4, health: 1 },
      },
      {
        id: "watch",
        text: "Watch them back.",
        scores: { philosophy: 2, coding: 1 },
      },
    ],
  },
  {
    id: 4,
    prompt: "You are given 24 uninterrupted hours.\nNo obligations. No one is watching.\nWhat do you build?",
    style: "terminal",
    answers: [
      {
        id: "unasked",
        text: "Something no one asked for but you can't stop thinking about",
        scores: { coding: 2, writing: 2, music_art: 2 },
      },
      {
        id: "fix",
        text: "Something that fixes a problem you've been ignoring",
        scores: { coding: 3, work: 1 },
      },
      {
        id: "bridge",
        text: "A bridge to someone you've lost touch with",
        scores: { old_friends: 3, recovery: 2 },
      },
      {
        id: "body",
        text: "A better version of your body",
        scores: { health: 3, bjj: 2 },
      },
      {
        id: "rest",
        text: "Nothing. You rest. Building is not the only way to exist.",
        scores: { philosophy: 3, recovery: 2 },
      },
    ],
  },
  {
    id: 5,
    prompt: "In any conflict — physical, intellectual, emotional —\nwhat is your first instinct?",
    subtext: "Everyone fights something.",
    style: "standard",
    answers: [
      {
        id: "control",
        text: "Control position before anything else.",
        scores: { bjj: 3, work: 2 },
      },
      {
        id: "submit",
        text: "Find the submission. End it.",
        scores: { bjj: 2, business: 2 },
      },
      {
        id: "survive",
        text: "Survive. Outlast. Wait for the mistake.",
        scores: { recovery: 3, philosophy: 2 },
      },
      {
        id: "leave",
        text: "I don't fight. I leave.",
        scores: { philosophy: 2, personal: 1 },
      },
      {
        id: "talk",
        text: "I talk. Most conflicts are misunderstandings.",
        scores: { writing: 2, new_friends: 2, recovery: 1 },
      },
    ],
  },
  {
    id: 6,
    prompt: "How do you prefer to be known?",
    subtext: "Tune the frequency.",
    style: "standard",
    answers: [
      {
        id: "small_deep",
        text: "By a small number of people who know me deeply.",
        scores: { old_friends: 3, recovery: 2 },
      },
      {
        id: "many_specific",
        text: "By many people who know one specific thing about me.",
        scores: { work: 2, bjj: 2, business: 1 },
      },
      {
        id: "strangers",
        text: "By strangers who feel like they already know me.",
        scores: { writing: 3, music_art: 2 },
      },
      {
        id: "unknown",
        text: "I'd prefer to be unknown.",
        scores: { philosophy: 3, coding: 1 },
      },
      {
        id: "undecided",
        text: "I haven't decided yet.",
        scores: { new_friends: 2, personal: 2 },
      },
    ],
  },
  {
    id: 7,
    prompt: "Last question. Be honest.\nWhy are you here?",
    style: "flashlight",
    answers: [
      {
        id: "know_bret",
        text: "I know Bret and I want to be part of his world.",
        scores: { personal: 3, old_friends: 3 },
      },
      {
        id: "accident",
        text: "I found this by accident and I'm curious.",
        scores: { new_friends: 3, music_art: 1 },
      },
      {
        id: "looking",
        text: "I'm looking for something and I'm not sure what.",
        scores: { recovery: 2, philosophy: 3, writing: 1 },
      },
      {
        id: "professional",
        text: "Professional reasons.",
        scores: { business: 4, work: 2 },
      },
      {
        id: "real",
        text: "I want to see if this is real.",
        scores: { philosophy: 2, coding: 2, writing: 1 },
      },
    ],
  },
];
