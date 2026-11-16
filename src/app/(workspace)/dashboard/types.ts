export type CreateSnippetFormState = {
  success: boolean;
  message?: string;
  errors?: {
    title?: string[];
    description?: string[];
    code?: string[];
    language?: string[];
    status?: string[];
    form?: string[];
  };
};

export const initialCreateSnippetFormState: CreateSnippetFormState = {
  success: false,
};

export type UpdateSnippetFormState = {
  success: boolean;
  message?: string;
  errors?: {
    id?: string[];
    title?: string[];
    description?: string[];
    code?: string[];
    language?: string[];
    status?: string[];
    form?: string[];
  };
};

export const initialUpdateSnippetFormState: UpdateSnippetFormState = {
  success: false,
};

export type DeleteSnippetFormState = {
  success: boolean;
  message?: string;
  errors?: {
    id?: string[];
    form?: string[];
  };
};

export const initialDeleteSnippetFormState: DeleteSnippetFormState = {
  success: false,
};
