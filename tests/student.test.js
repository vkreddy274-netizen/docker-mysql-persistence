const test = require("node:test");
const assert = require("node:assert/strict");
const { validateStudent } = require("../student");

test("validates and normalizes student fields", () => {
  assert.deepEqual(validateStudent({
    name: "  Jamie Chen ",
    email: " JAMIE@example.edu ",
    course: "  Biology "
  }), {
    student: {
      name: "Jamie Chen",
      email: "jamie@example.edu",
      course: "Biology"
    }
  });
});

test("rejects missing and malformed student fields", () => {
  assert.match(validateStudent({ name: "", email: "not-an-email", course: "" }).error, /Name is required/);
  assert.match(validateStudent({ name: "Jamie", email: "not-an-email", course: "Biology" }).error, /valid email/);
  assert.match(validateStudent(null).error, /Enter a student/);
});

test("rejects values exceeding their database column sizes", () => {
  assert.match(validateStudent({
    name: "a".repeat(101),
    email: "jamie@example.edu",
    course: "Biology"
  }).error, /100 characters/);
});
