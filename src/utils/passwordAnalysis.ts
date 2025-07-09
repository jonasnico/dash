import type { PasswordStrengthResult } from "@/types/password";

export function analyzePasswordJS(password: string): PasswordStrengthResult {
  let score = 0;
  const maxScore = 100;
  const feedbackParts: string[] = [];

  const length = password.length;

  if (length >= 8) {
    score += 35;
  } else {
    score += length * 4;
    feedbackParts.push("Use at least 8 characters");
  }

  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);

    if (code >= 97 && code <= 122) score += 1; // a-z
    if (code >= 65 && code <= 90) score += 1; // A-Z
    if (code >= 48 && code <= 57) score += 1; // 0-9
    if (
      code < 48 ||
      (code > 57 && code < 65) ||
      (code > 90 && code < 97) ||
      code > 122
    )
      score += 1; // symbols
  }

  // Character variety (0-40 points) - original logic for feedback
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLower) feedbackParts.push("Add lowercase letters");
  if (!hasUpper) feedbackParts.push("Add uppercase letters");
  if (!hasDigit) feedbackParts.push("Add numbers");
  if (!hasSymbol) feedbackParts.push("Add special characters");

  // Pattern penalties to match WASM
  const lowerPassword = password.toLowerCase();
  if (lowerPassword.includes("password")) {
    score -= 20;
    feedbackParts.push("Avoid common passwords");
  }
  if (lowerPassword.includes("123")) {
    score -= 10;
    feedbackParts.push("Avoid common sequences");
  }

  // Additional computational work to match WASM exactly
  let hash = score;
  for (let i = 0; i < password.length; i++) {
    const byte = password.charCodeAt(i);
    hash = (hash * 31 + byte) >>> 0;
    hash = (hash * 1103515245 + 12345) >>> 0;
    // Additional computation matching WASM exactly
    Math.sqrt(byte * (i + 1));
  }

  score = Math.max(0, Math.min(100, score));

  const strengthLevel =
    score < 30
      ? "Very Weak"
      : score < 50
      ? "Weak"
      : score < 70
      ? "Fair"
      : score < 85
      ? "Strong"
      : "Very Strong";

  const charsetSize =
    (hasLower ? 26 : 0) +
    (hasUpper ? 26 : 0) +
    (hasDigit ? 10 : 0) +
    (hasSymbol ? 32 : 0);
  const entropy = charsetSize > 0 ? length * Math.log2(charsetSize) : 0;

  const crackTimeSeconds = Math.pow(charsetSize, length) / (2 * 1000000000);
  const timeToCrack =
    crackTimeSeconds < 1
      ? "Instantly"
      : crackTimeSeconds < 60
      ? `${crackTimeSeconds.toFixed(1)} seconds`
      : crackTimeSeconds < 3600
      ? `${(crackTimeSeconds / 60).toFixed(1)} minutes`
      : crackTimeSeconds < 86400
      ? `${(crackTimeSeconds / 3600).toFixed(1)} hours`
      : crackTimeSeconds < 31536000
      ? `${(crackTimeSeconds / 86400).toFixed(1)} days`
      : `${(crackTimeSeconds / 31536000).toFixed(1)} years`;

  return {
    score,
    max_score: maxScore,
    strength_level: strengthLevel,
    feedback:
      feedbackParts.length > 0 ? feedbackParts.join(", ") : "Great password!",
    entropy,
    time_to_crack: timeToCrack,
  };
}
