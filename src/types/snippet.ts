export type ProgrammingLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "go"
  | "php"
  | "sql";

export type SnippetStatus =
  | "draft"
  | "published"
  | "archived";

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  language: ProgrammingLanguage;
  code: string;
  status: SnippetStatus;
  createdAt: string;
  updatedAt: string;
}
