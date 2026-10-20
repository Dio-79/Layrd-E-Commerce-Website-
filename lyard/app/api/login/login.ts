// loginapi.ts
import { login } from "@/lib/Auth";

export interface LoginValues {
  email: string;
  password: string;
}

export async function LoginForms(values: LoginValues) {
  const user = await login(values.email, values.password);
  return { token: "", user }; // the page reads response.token, so keep the field
}