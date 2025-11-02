import fs from "fs";
import path from "path";

const allowedIgns = [
  "xMads",
  "SolarieL",
  "Fatee",
  "xShoo",
  "Eput1",
  "xLOGZ",
  "Venzo",
  "BoszJeff",
  "Fize",
  "06",
  "Spotter",
  "Cassie4",
  "Jibunメ",
  "Val258",
  "Avenged7Fold",
  "Nanahoshi",
  "dE",
  "Walangheal",
  "MatKage",
  "Feyt",
  "TESTEROSSAA",
  "Juollide",
  "Schneiz",
  "Spades",
  "Notwell",
  "Joe平",
  "Akosipiso",
  "Hachiiiii",
  "HorySheyt",
  "GREIIGH",
  "RMdSlayer",
  "RoseAnne",
  "NTrigger",
  "HadesX",
  "TAMPALPUKE69",
  "MiSSiiAH",
  "Pierced",
  "Ahuehue",
  "冬",
];

const canonicalMap = new Map(
  allowedIgns.map((name) => {
    const trimmed = name.trim();
    return [trimmed.toLowerCase(), trimmed];
  })
);

export const allowedIgnList = [...canonicalMap.values()];

export function normalizeIgn(ign) {
  return ign.trim().toLowerCase();
}

export function isIgnAllowed(ign) {
  return canonicalMap.has(normalizeIgn(ign));
}

export function getCanonicalIgn(ign) {
  return canonicalMap.get(normalizeIgn(ign)) ?? null;
}

const dataDir = path.resolve("./data");
const dataFile = path.join(dataDir, "registrations.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2), "utf8");
  }
}

function loadRegistrations() {
  ensureStore();

  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    if (!raw.trim()) {
      return {};
    }

    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null) {
      return data;
    }

    return {};
  } catch {
    return {};
  }
}

function saveRegistrations(registrations) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(registrations, null, 2), "utf8");
}

export function getRegistrationByIgn(ign) {
  const registrations = loadRegistrations();
  return registrations[normalizeIgn(ign)] ?? null;
}

export function isIgnAvailable(ign, userId) {
  const existing = getRegistrationByIgn(ign);
  return !existing || existing.userId === userId;
}

export function setRegistration(ign, { userId, className }) {
  const registrations = loadRegistrations();
  const normalized = normalizeIgn(ign);
  const canonicalIgn = getCanonicalIgn(ign) ?? ign.trim();

  registrations[normalized] = {
    ign: canonicalIgn,
    userId,
    className,
    updatedAt: new Date().toISOString(),
  };

  saveRegistrations(registrations);
  return registrations[normalized];
}

export function removeRegistration(ign) {
  const registrations = loadRegistrations();
  const normalized = normalizeIgn(ign);

  if (registrations[normalized]) {
    delete registrations[normalized];
    saveRegistrations(registrations);
    return true;
  }

  return false;
}

export function getAllRegistrations() {
  return Object.values(loadRegistrations());
}


