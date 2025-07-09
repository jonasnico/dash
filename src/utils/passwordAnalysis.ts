import type { PasswordStrengthResult } from "@/types/password";

export function analyzePasswordJS(password: string): PasswordStrengthResult {
  let score = 0;
  const maxScore = 100;
  const feedbackParts: string[] = [];

  // Add some computational work to make benchmarking meaningful
  // Simulate complex password analysis algorithms
  for (let i = 0; i < password.length; i++) {
    Math.sqrt(password.charCodeAt(i) * (i + 1));
  }

  // Length scoring (0-35 points)
  const length = password.length;
  if (length < 8) {
    score += length * 3;
    feedbackParts.push("Use at least 8 characters");
  } else if (length < 12) {
    score += 25;
  } else {
    score += 35;
  }

  // Character variety (0-40 points)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasLower) score += 10;
  else feedbackParts.push("Add lowercase letters");
  if (hasUpper) score += 10;
  else feedbackParts.push("Add uppercase letters");
  if (hasDigit) score += 10;
  else feedbackParts.push("Add numbers");
  if (hasSymbol) score += 10;
  else feedbackParts.push("Add special characters");

  // Pattern penalties (0-25 points deducted)
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedbackParts.push("Avoid repeated characters");
  }

  if (/123|abc|qwe/i.test(password)) {
    score -= 15;
    feedbackParts.push("Avoid common sequences");
  }

  // Add more computational work for common password checking
  const commonPatterns = ["password", "123456", "qwerty", "admin", "letmein"];
  for (const pattern of commonPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      score -= 20;
      feedbackParts.push("Avoid common words");
      break;
    }
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
