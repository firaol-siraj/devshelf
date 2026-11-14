# DevShelf

A personal developer workspace for organizing reusable code snippets, notes, tags, and collections.

## Technology Stack

- Next.js 16 — React framework
- React 19 — UI
- TypeScript — Static typing
- PostgreSQL — Relational database
- Prisma ORM 7 — Database access
- Zod 4 — Input and environment validation
- Tailwind CSS 4 — Styling
- Vitest 3 — Automated testing
- ESLint 9 — Code quality

## Architecture

DevShelf follows a layered application structure:

- **App Router:** Pages, layouts, API routes, and Server Actions.
- **Components:** Reusable interface components.
- **Schemas:** Input validation contracts.
- **Services:** Application business logic.
- **Repositories:** Database access.
- **Lib:** Shared infrastructure, errors, environment configuration, and utilities.
- **Types:** Shared TypeScript definitions.

### Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   ├── (marketing)/
│   ├── (workspace)/
│   └── api/
├── components/
│   ├── empty-states/
│   ├── forms/
│   ├── navigation/
│   ├── previews/
│   ├── skeletons/
│   └── ui/
├── lib/
│   ├── env/
│   ├── errors/
│   └── validations/
├── repositories/
├── schemas/
├── services/
└── types/

prisma/
scripts/
```

## Prerequisites

- Node.js compatible with the project dependencies
- npm
- PostgreSQL
- Git

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd devshelf
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure your PostgreSQL connection strings in `.env`.

Required variables:

| Variable | Purpose |
|---|---|
| DATABASE_URL | Application database |
| SHADOW_DATABASE_URL | Prisma migration shadow database |
| NODE_ENV | Application environment |

## Database Setup

Create the development database and the separate shadow database in PostgreSQL.

Validate the Prisma schema:

```bash
npx prisma validate
```

Apply migrations:

```bash
npx prisma migrate dev
```

Generate the Prisma client when required:

```bash
npx prisma generate
```

## Development

Start the development server:

```bash
npm run dev
```

Open:

http://localhost:3000

## Quality Checks

Run automated tests:

```bash
npm test
```

Watch tests during development:

```bash
npm run test:watch
```

Generate coverage:

```bash
npm run test:coverage
```

Type-check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Validate Prisma:

```bash
npx prisma validate
```

## Testing Strategy

- Unit tests validate Zod schemas and independent application logic.
- Tests should not depend on production data.
- Database integration tests must use a dedicated test database.
- Test fixtures should be deterministic.
- External services should be mocked when appropriate.

## Environment Security

- Never commit `.env`.
- Never commit database passwords or production secrets.
- Commit `.env.example` with placeholder values.
- Keep development, test, and production databases separate.

## Current Implementation Status

The current project includes:

- Marketing pages.
- Authentication interface.
- Workspace dashboard.
- Snippet validation Server Action.
- Snippet creation and update validation schemas.
- Initial service and repository layers.
- Prisma database models.
- API health endpoint.
- Standardized application errors.
- Environment validation.
- Automated unit tests.

**Note:** The current snippet validation Server Action demonstrates input validation only. It does not persist snippets to PostgreSQL.

## Engineering Standards

1. Validate external input using Zod.
2. Keep database access inside repositories.
3. Keep business logic inside services.
4. Keep secrets outside version control.
5. Run tests, type checking, and linting before committing.
6. Use descriptive commit messages.
7. Keep unit tests independent of external infrastructure.

## License

Add your chosen project license before public distribution.
