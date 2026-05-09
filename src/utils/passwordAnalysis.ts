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

function computeScore(password: string): number {
  if (!password) return 0;

  const lower = password.toLowerCase();
  const cs = charsetSize(password);
  const entropy = cs > 0 ? password.length * Math.log2(cs) : 0;
  const entropyScore = Math.min(80, entropy * 0.8);

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);
  const varietyBonus = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length * 5;

  let penalties = 0;
  if (lower.includes("password")) penalties += 20;
  if (password.includes("123") || password.includes("1234")) penalties += 10;
  if (hasKeyboardPattern(lower)) penalties += 10;
  if (hasRepeatedChars(password)) penalties += 10;

  return Math.max(0, Math.min(100, Math.round(entropyScore + varietyBonus - penalties)));
}

function strengthLevel(score: number): string {
  if (score < 30) return "Very Weak";
  if (score < 50) return "Weak";
  if (score < 70) return "Fair";
  if (score < 85) return "Strong";
  return "Very Strong";
}

function timeToCrack(password: string): string {
  const cs = charsetSize(password);
  if (cs === 0) return "Instantly";
  const combinations = Math.pow(cs, password.length);
  const seconds = combinations / (2 * 1_000_000_000);
  if (seconds < 1) return "Instantly";
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 31_536_000) return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds < 31_536_000 * 1000) return `${(seconds / 31_536_000).toFixed(1)} years`;
  return "Centuries";
}

function buildFeedback(password: string, score: number): string {
  const lower = password.toLowerCase();
  const parts: string[] = [];

  if (lower.includes("password")) parts.push("Avoid the word 'password'");
  if (password.includes("123")) parts.push("Avoid sequential numbers");
  if (hasKeyboardPattern(lower)) parts.push("Avoid keyboard patterns (qwerty, asdf)");
  if (hasRepeatedChars(password)) parts.push("Avoid repeating characters");
  if (password.length < 8) parts.push("Use at least 8 characters");
  if (!/[a-z]/.test(password)) parts.push("Add lowercase letters");
  if (!/[A-Z]/.test(password)) parts.push("Add uppercase letters");
  if (!/[0-9]/.test(password)) parts.push("Add numbers");
  if (!SYMBOL_REGEX.test(password)) parts.push("Add special characters");

  if (parts.length === 0) {
    return score >= 85 ? "Excellent password!" : "Good password — consider making it longer for extra security";
  }
  return parts.join(". ");
}

export function analyzePasswordJS(password: string): PasswordStrengthResult {
  const score = computeScore(password);
  const cs = charsetSize(password);
  const entropy = cs > 0 ? password.length * Math.log2(cs) : 0;

  return {
    score,
    max_score: 100,
    strength_level: strengthLevel(score),
    feedback: buildFeedback(password, score),
    entropy,
    time_to_crack: timeToCrack(password),
  };
}

