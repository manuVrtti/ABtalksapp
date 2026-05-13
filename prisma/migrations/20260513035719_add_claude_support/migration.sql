-- Enum value must commit before other migrations can rely on it (Postgres transaction rules).
ALTER TYPE "Domain" ADD VALUE 'CLAUDE';
