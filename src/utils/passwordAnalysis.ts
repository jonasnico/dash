import type { PasswordStrengthResult } from "@/types/password";

const SYMBOL_REGEX = /[^a-zA-Z0-9]/;
const KEYBOARD_PATTERNS = ["qwerty", "asdfgh", "zxcvbn", "123456", "654321", "abcdef"];

function charsetSize(password: string): number {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);
  return (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSymbol ? 32 : 0);
}

function hasRepeatedChars(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i + 1] === password[i + 2]) return true;
  }
  return false;
}

function hasKeyboardPattern(lower: string): boolean {
  return KEYBOARD_PATTERNS.some((p) => lower.includes(p));
}

export function analyzePasswordJS(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0, max_score: 100, strength_level: "Very Weak",
      feedback: "Enter a password to analyze", entropy: 0, time_to_crack: "Instantly",
    };
  }

  const lower = password.toLowerCase();
  const cs = charsetSize(password);
  const entropy = cs > 0 ? password.length * Math.log2(cs) : 0;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);
  const hasRepeat = hasRepeatedChars(password);
  const hasKeyboard = hasKeyboardPattern(lower);
  const hasPassword = lower.includes("password");
  const has123 = password.includes("123") || password.includes("1234");

  const entropyScore = Math.min(80, entropy * 0.8);
  const varietyBonus = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length * 5;
  let penalties = 0;
  if (hasPassword) penalties += 20;
  if (has123)      penalties += 10;
  if (hasKeyboard) penalties += 10;
  if (hasRepeat)   penalties += 10;

  const score = Math.max(0, Math.min(100, Math.round(entropyScore + varietyBonus - penalties)));

  const strength_level =
    score < 30 ? "Very Weak" :
    score < 50 ? "Weak" :
    score < 70 ? "Fair" :
    score < 85 ? "Strong" : "Very Strong";

  const combinations = cs > 0 ? Math.pow(cs, password.length) : 0;
  const seconds = combinations / (2 * 1_000_000_000);
  const time_to_crack =
    seconds < 1       ? "Instantly" :
    seconds < 60      ? `${seconds.toFixed(1)} seconds` :
    seconds < 3600    ? `${(seconds / 60).toFixed(1)} minutes` :
    seconds < 86400   ? `${(seconds / 3600).toFixed(1)} hours` :
    seconds < 31_536_000           ? `${(seconds / 86400).toFixed(1)} days` :
    seconds < 31_536_000 * 1000   ? `${(seconds / 31_536_000).toFixed(1)} years` :
    "Centuries";

  const feedbackParts: string[] = [];
  if (hasPassword) feedbackParts.push("Avoid the word 'password'");
  if (has123)      feedbackParts.push("Avoid sequential numbers");
  if (hasKeyboard) feedbackParts.push("Avoid keyboard patterns (qwerty, asdf)");
  if (hasRepeat)   feedbackParts.push("Avoid repeating characters");
  if (password.length < 8) feedbackParts.push("Use at least 8 characters");
  if (!hasLower)   feedbackParts.push("Add lowercase letters");
  if (!hasUpper)   feedbackParts.push("Add uppercase letters");
  if (!hasDigit)   feedbackParts.push("Add numbers");
  if (!hasSymbol)  feedbackParts.push("Add special characters");

  const feedback =
    feedbackParts.length === 0
      ? (score >= 85 ? "Excellent password!" : "Good password — consider making it longer for extra security")
      : feedbackParts.join(". ");

  return { score, max_score: 100, strength_level, feedback, entropy, time_to_crack };
}

