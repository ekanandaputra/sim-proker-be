# SIM PROKER Backend

**Program Kerja Information System** — A production-ready NestJS 11 microservice for managing work programs, activities, outputs, progress monitoring, evidence management, and approval workflows.

Part of the **Academic Information System** microservice ecosystem.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11.x | Backend framework |
| TypeScript | 5.x | Language (strict mode) |
| Node.js | 22 LTS | Runtime |
| Prisma | 5.x | ORM |
| PostgreSQL | 16 | Database |
| Zod | 3.x | Validation |
| Swagger | - | API Documentation |
| Pino | - | Structured logging |
| Vitest | 3.x | Testing |
| pnpm | 9.x | Package manager |

## Architecture

- **Clean Architecture** with Domain-Driven Design principles
- **Repository Pattern** — decouples business logic from persistence
- **Service Layer** — all business logic lives in services
- **CQRS-ready** structure (without CQRS implementation)
- **Modular Architecture** — each domain is a self-contained NestJS module

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Generate Prisma client
pnpm prisma:generate

# 4. Run database migrations
pnpm prisma:migrate

# 5. Seed the database
pnpm prisma:seed

# 6. Start development server
pnpm start:dev
```

### URLs

| URL | Description |
|---|---|
| `http://localhost:3000/api/v1` | API Base URL |
| `http://localhost:3000/api/docs` | Swagger Documentation |

## Project Structure

```
src/
├── common/                 # Cross-cutting concerns
│   ├── config/             # Zod-validated app configuration
│   ├── constants/          # Enums & constants
│   ├── decorators/         # @Roles(), @CurrentUser(), @ApiPaginatedResponse()
│   ├── dto/                # Shared DTOs (pagination, API response)
│   ├── exceptions/         # Business exceptions
│   ├── filters/            # Global exception filter
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── interceptors/       # Response wrapper, logging
│   ├── logger/             # Pino logger module
│   ├── middleware/          # Correlation ID middleware
│   ├── pipes/              # ZodValidationPipe
│   ├── storage/            # Abstract storage (local/S3/MinIO)
│   └── utils/              # Pagination helpers
├── database/
│   └── prisma/             # PrismaService, PrismaModule
├── integrations/           # SIM IKU integration APIs
│   ├── controllers/
│   ├── services/
│   └── dto/
├── modules/
│   ├── program/            # Program Kerja CRUD
│   ├── activity/           # Activity management
│   ├── output/             # Output/deliverable tracking
│   ├── progress/           # Progress logging (append-only)
│   ├── evidence/           # File upload/management
│   ├── approval/           # Approval workflow
│   └── dashboard/          # Aggregated statistics
├── app.module.ts
└── main.ts
```

## API Endpoints

### Programs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/programs` | List programs (paginated, searchable, filterable) |
| POST | `/api/v1/programs` | Create program |
| GET | `/api/v1/programs/:id` | Get program by ID |
| PATCH | `/api/v1/programs/:id` | Update program |
| DELETE | `/api/v1/programs/:id` | Delete program |

### Activities
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/programs/:id/activities` | List activities for a program |
| POST | `/api/v1/programs/:id/activities` | Create activity |
| PATCH | `/api/v1/activities/:id` | Update activity |
| DELETE | `/api/v1/activities/:id` | Delete activity |

### Outputs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/activities/:id/outputs` | List outputs |
| POST | `/api/v1/activities/:id/outputs` | Create output |
| PATCH | `/api/v1/outputs/:id` | Update output |
| DELETE | `/api/v1/outputs/:id` | Delete output |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/activities/:id/progress` | List progress history |
| POST | `/api/v1/activities/:id/progress` | Log progress (append-only) |

### Evidences
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/activities/:id/evidences` | List evidences |
| POST | `/api/v1/activities/:id/evidences` | Upload evidence (multipart) |
| DELETE | `/api/v1/evidences/:id` | Delete evidence |

### Approval
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/programs/:id/submit` | Submit for approval |
| POST | `/api/v1/approvals/:id/approve` | Approve |
| POST | `/api/v1/approvals/:id/reject` | Reject |
| POST | `/api/v1/approvals/:id/revision` | Request revision |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | Aggregated statistics |

### Integration (for SIM IKU)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/integration/programs` | List programs |
| GET | `/api/v1/integration/programs/:id` | Program detail |
| GET | `/api/v1/integration/programs/:id/outputs` | Program outputs |
| GET | `/api/v1/integration/programs/:id/progress` | Program progress |
| POST | `/api/v1/integration/outputs/query` | Batch query outputs |

## Authentication

JWT-based authentication delegated to Auth Service. This service only **validates** JWT tokens.

JWT Payload:
```json
{
  "userId": "uuid",
  "unitId": "uuid",
  "roles": ["Admin", "PIC"],
  "name": "User Name"
}
```

### Roles (RBAC)
- **Admin** — Full access
- **Unit Admin** — Unit-level management
- **PIC** — Program in charge
- **Reviewer** — Approval reviewer
- **Leader** — Leadership approval

## API Response Format

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {}
}
```

## Scripts

```bash
pnpm start:dev       # Development server
pnpm build           # Build for production
pnpm start:prod      # Run production build
pnpm test            # Run unit tests
pnpm test:e2e        # Run E2E tests
pnpm lint            # Lint code
pnpm format          # Format code
pnpm prisma:studio   # Open Prisma Studio
pnpm docker:up       # Start Docker services
pnpm docker:down     # Stop Docker services
```

## Environment Variables

See [.env.example](.env.example) for all configuration options.

## License

MIT
