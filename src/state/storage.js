export const STORAGE_KEYS = {
  state: 'acm-map-state',
  notes: 'acm-map-notes',
  quizzes: 'acm-map-quizzes',
  accounts: 'acm-map-accounts'
};

export function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function sanitizeQuizzes(quizzes) {
  Object.keys(quizzes).forEach(id => {
    if (!quizzes[id]?.problems?.every(problem => /^P\d+$/.test(problem.id))) delete quizzes[id];
  });
  return quizzes;
}

export function loadProgressData() {
  return {
    states: readJson(STORAGE_KEYS.state, {}),
    notes: readJson(STORAGE_KEYS.notes, {}),
    quizzes: sanitizeQuizzes(readJson(STORAGE_KEYS.quizzes, {})),
    accounts: { luogu: String(readJson(STORAGE_KEYS.accounts, { luogu: '' }).luogu || '') }
  };
}

export function saveProgressData({ states, notes, quizzes }) {
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(states));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  localStorage.setItem(STORAGE_KEYS.quizzes, JSON.stringify(quizzes));
}

export function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}
