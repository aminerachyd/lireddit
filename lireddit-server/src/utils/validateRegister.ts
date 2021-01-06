import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 2) {
    return [{ field: "username", message: "Username must be greater than 2" }];
  }
  if (options.username.includes("@")) {
    return [{ field: "username", message: "Cannot include an @ sign" }];
  }
  if (!options.email.includes("@")) {
    return [{ field: "email", message: "Invalid email" }];
  }
  if (options.password.length <= 2) {
    return [{ field: "password", message: "Password must be greater than 2" }];
  }

  return null;
};
