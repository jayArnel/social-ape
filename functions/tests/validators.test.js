const validators = require("../util/validators");

describe("Test signup validator", () => {
  test("valid signup data", () => {
    const validUserData = {
      email: "user@example.com",
      password: "password",
      confirmPassword: "password",
      handle: "user",
    };
    const validation = validators.validateSignupData(validUserData);
    expect(validation).toEqual({ errors: {}, valid: true });
  });

  test("empty email", () => {
    const validUserData = {
      email: "",
      password: "password",
      confirmPassword: "password",
      handle: "user",
    };
    const validation = validators.validateSignupData(validUserData);
    expect(validation).toEqual({
      errors: { email: "Must not be empty." },
      valid: false,
    });
  });
  test("invalid email", () => {
    const validUserData = {
      email: "user@e",
      password: "password",
      confirmPassword: "password",
      handle: "user",
    };
    const validation = validators.validateSignupData(validUserData);
    expect(validation).toEqual({
      errors: { email: "Must be a valid email address." },
      valid: false,
    });
  });

  test("empty password", () => {
    const validUserData = {
      email: "user@email.com",
      password: "",
      confirmPassword: "password",
      handle: "user",
    };
    const validation = validators.validateSignupData(validUserData);
    expect(validation).toEqual({
      errors: {
        password: "Must not be empty.",
        confirmPassword: "Passwords must match",
      },
      valid: false,
    });
  });
});
