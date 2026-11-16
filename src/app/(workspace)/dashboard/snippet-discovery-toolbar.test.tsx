import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SnippetDiscoveryToolbar from "./snippet-discovery-toolbar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

describe("SnippetDiscoveryToolbar - Search, Filter, and Sort Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input, status options, language selector, and sort selector in default state", () => {
    const html = renderToStaticMarkup(
      <SnippetDiscoveryToolbar
        totalResults={12}
      />,
    );

    // Search input
    expect(html).toContain('role="searchbox"');
    expect(html).toContain('placeholder="Search by title, description, language, or code..."');
    expect(html).toContain('aria-label="Search snippets"');

    // Status options
    expect(html).toContain("All");
    expect(html).toContain("Published");
    expect(html).toContain("Draft");
    expect(html).toContain("Archived");
    // "All" should have aria-pressed="true" by default
    expect(html).toContain('aria-pressed="true"');

    // Language options
    expect(html).toContain("All Languages");
    expect(html).toContain("TypeScript");
    expect(html).toContain("JavaScript");
    expect(html).toContain("Python");
    expect(html).toContain("SQL");

    // Sort options
    expect(html).toContain("Newest first");
    expect(html).toContain("Oldest first");
    expect(html).toContain("Recently updated");
    expect(html).toContain("Alphabetical (A–Z)");
    expect(html).toContain("Alphabetical (Z–A)");

    // Result count
    expect(html).toContain("12 snippets");

    // No active filter badges in default state
    expect(html).not.toContain("Active filters:");
  });

  it("renders active filter badges and clear button when search, status, language, or sort is active", () => {
    const html = renderToStaticMarkup(
      <SnippetDiscoveryToolbar
        initialSearch="jwt token"
        initialStatus="published"
        initialLanguage="typescript"
        initialSort="updated"
        totalResults={3}
      />,
    );

    // Active filters banner is displayed
    expect(html).toContain("Active filters:");

    // Search chip
    expect(html).toContain("Search: “jwt token”");
    expect(html).toContain('aria-label="Remove search filter"');

    // Status chip
    expect(html).toContain("Status: published");
    expect(html).toContain('aria-label="Remove status filter"');

    // Language chip
    expect(html).toContain("Language: TypeScript");
    expect(html).toContain('aria-label="Remove language filter"');

    // Sort chip
    expect(html).toContain("Sort: Recently updated");
    expect(html).toContain('aria-label="Reset sort to newest"');

    // Clear all action
    expect(html).toContain("Reset all");
    expect(html).toContain('aria-label="Clear all active filters"');

    // Result count
    expect(html).toContain("3 snippets");
  });

  it("renders clear search 'X' button inside search input when search query is present", () => {
    const htmlWithSearch = renderToStaticMarkup(
      <SnippetDiscoveryToolbar
        initialSearch="async await"
        totalResults={1}
      />,
    );

    expect(htmlWithSearch).toContain('aria-label="Clear search text"');
  });

  it("handles singular vs plural snippet count display", () => {
    const singularHtml = renderToStaticMarkup(
      <SnippetDiscoveryToolbar
        totalResults={1}
      />,
    );
    expect(singularHtml).toContain("1 snippet");

    const pluralHtml = renderToStaticMarkup(
      <SnippetDiscoveryToolbar
        totalResults={5}
      />,
    );
    expect(pluralHtml).toContain("5 snippets");
  });
});
