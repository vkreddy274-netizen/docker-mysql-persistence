const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStudent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Enter a student name, email, and course." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const course = typeof input.course === "string" ? input.course.trim() : "";

  if (!name || name.length > 100) {
    return { error: "Name is required and must be 100 characters or fewer." };
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { error: "Enter a valid email address (254 characters or fewer)." };
  }
  if (!course || course.length > 120) {
    return { error: "Course is required and must be 120 characters or fewer." };
  }

  return { student: { name, email, course } };
}

module.exports = { validateStudent };
