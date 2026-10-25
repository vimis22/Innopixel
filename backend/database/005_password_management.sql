-- =============================================================================
-- Innopixel - migration 005: password management (temporary passwords, reset links, sessions)
--
-- Run after 004_time_registration.sql:
--   psql -h localhost -U innopixel -d innopixel -f database/005_password_management.sql
--
-- Only adds columns and one table; nothing existing is removed or changed in meaning.
-- =============================================================================

BEGIN;

-- must_change_password: the password was set by someone else (a new account or an administrator's temporary
--   password); the employee has to choose their own before using the platform.
-- last_login_at: the latest successful login, shown to administrators.
-- security_stamp: part of every login cookie. A new stamp (after a password change or reset) ends all
--   existing sessions of the employee, because their cookies no longer match.
ALTER TABLE employee
    ADD COLUMN must_change_password BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN last_login_at        TIMESTAMPTZ,
    ADD COLUMN security_stamp       UUID        NOT NULL DEFAULT gen_random_uuid();

-- Single-use links for "Glemt adgangskode" (RESET) and account invitations (INVITE).
-- Only the SHA-256 hash of the token is stored; the token itself exists only in the e-mail.
CREATE TABLE password_reset_token (
    id           SERIAL      PRIMARY KEY,
    employee_id  INTEGER     NOT NULL REFERENCES employee (id) ON DELETE CASCADE,
    token_hash   BYTEA       NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
    purpose      VARCHAR(10) NOT NULL CHECK (purpose IN ('RESET', 'INVITE')),
    created_at   TIMESTAMPTZ NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    requested_by INTEGER     REFERENCES employee (id) ON DELETE SET NULL,
    CHECK (expires_at > created_at)
);

-- Counting recent requests per employee (throttling) and invalidating outstanding links.
CREATE INDEX password_reset_token_employee_idx ON password_reset_token (employee_id, created_at);

COMMIT;
