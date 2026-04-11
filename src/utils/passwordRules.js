// Password strength requirements — applied anywhere the user creates a password
export const PASSWORD_RULES = [
  { key: 'lowercase', label: 'lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'uppercase', label: 'capital letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'special character', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(p) },
  { key: 'length', label: 'at least 8 characters', test: (p) => p.length >= 8 },
]

/**
 * Check a password against all rules.
 * Returns { valid, satisfied, missing } where satisfied/missing are rule key arrays.
 */
export const evaluatePassword = (password = '') => {
  const satisfied = []
  const missing = []
  for (const rule of PASSWORD_RULES) {
    if (rule.test(password)) satisfied.push(rule)
    else missing.push(rule)
  }
  return {
    valid: missing.length === 0,
    satisfied,
    missing,
  }
}
