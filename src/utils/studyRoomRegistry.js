const STORAGE_KEY = 'acad_study_rooms_v1';

export const DEFAULT_ROOM_SETTINGS = {
  focusMinutes: 25,
  breakMinutes: 5,
  enableChat: true,
  enableWhiteboard: true,
  showPomodoro: true,
  blockNotifications: true,
};

function loadRooms() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveRooms(rooms) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    /* ignore */
  }
}

export function genRoomCode() {
  const rooms = loadRooms();
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts += 1;
  } while (rooms[code] && attempts < 50);
  return code;
}

export function registerRoom({ code, mode, friendIds = [], settings = DEFAULT_ROOM_SETTINGS }) {
  const rooms = loadRooms();
  rooms[code] = {
    code,
    mode,
    friendIds,
    settings: { ...DEFAULT_ROOM_SETTINGS, ...settings },
    createdAt: Date.now(),
    host: true,
  };
  saveRooms(rooms);
  return rooms[code];
}

export function getRoom(code) {
  if (!code || code.length !== 6) return null;
  const rooms = loadRooms();
  return rooms[code] || null;
}

export function validateRoomCode(code) {
  return Boolean(getRoom(code));
}

export function unregisterRoom(code) {
  const rooms = loadRooms();
  delete rooms[code];
  saveRooms(rooms);
}

export function clearAllRooms() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
