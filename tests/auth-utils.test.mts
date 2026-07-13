import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedPath, isValidEmail, sanitizeReturnPath, validateUsername } from "../lib/auth-utils.ts";

test("sanitizeReturnPath accepts same-site relative paths", () => {
  assert.equal(sanitizeReturnPath("/dashboard?tab=next"), "/dashboard?tab=next");
  assert.equal(sanitizeReturnPath("/profile#settings"), "/profile#settings");
});

test("sanitizeReturnPath rejects external and protocol-relative targets", () => {
  assert.equal(sanitizeReturnPath("https://evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("//evil.example/login"), "/dashboard");
  assert.equal(sanitizeReturnPath("\\evil"), "/dashboard");
});

test("email validation accepts normal addresses and rejects malformed values", () => {
  assert.equal(isValidEmail("learner@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("username validation normalizes and blocks reserved names", () => {
  assert.deepEqual(validateUsername(" Good_Name "), { valid: true, normalized: "good_name" });
  assert.equal(validateUsername("admin").valid, false);
  assert.equal(validateUsername("bad-name").valid, false);
});

test("private account and onboarding routes are protected", () => {
  assert.equal(isProtectedPath("/dashboard"), true);
  assert.equal(isProtectedPath("/settings/privacy"), true);
  assert.equal(isProtectedPath("/onboarding"), true);
  assert.equal(isProtectedPath("/learn"), false);
});
