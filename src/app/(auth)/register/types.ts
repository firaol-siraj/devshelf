export type RegisterFormState = {
  success: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    passwordConfirmation?: string[];
    form?: string[];
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
};

export const initialRegisterFormState: RegisterFormState = {
  success: false,
};
