export type LoginFormState = {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
    form?: string[];
  };
};

export const initialLoginFormState: LoginFormState = {
  success: false,
};
