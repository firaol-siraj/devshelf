import {
  createSnippetSchema,
} from "../src/schemas/snippet.schema";

const validSnippet = {
  title: "My React Notes",
  description: "Learning React",
  code: "const app = 'DevShelf';",
  language: "typescript",
};

const invalidSnippet = {
  title: "",
  description: "Learning React",
  code: "",
  language: "invalid-language",
};

const validResult = createSnippetSchema.safeParse(validSnippet);

const invalidResult =
  createSnippetSchema.safeParse(invalidSnippet);

console.log("Valid input:", validResult.success);
console.log("Invalid input:", invalidResult.success);

if (!invalidResult.success) {
  console.log("Validation errors:");

  for (const issue of invalidResult.error.issues) {
    console.log(`- ${issue.path.join(".")}: ${issue.message}`);
  }
}
