// Password strength calculator

interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, feedback: "Enter a password" };
  }

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasLower && hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  // Cap at 4
  score = Math.min(score, 4);

  // Generate feedback
  if (password.length < 10) {
    feedback.push("Add more characters");
  }
  if (!hasNumber) {
    feedback.push("Add a number");
  }
  if (!hasLower || !hasUpper) {
    feedback.push("Mix upper/lowercase");
  }
  if (!hasSpecial && score < 4) {
    feedback.push("Add special character");
  }

  return {
    score,
    feedback: feedback.length > 0 ? feedback[0] : "Great password!",
  };
}
