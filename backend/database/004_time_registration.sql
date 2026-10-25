-- =============================================================================
-- Innopixel - migration 004: time registration (Tidsregistrering)
--
-- Run after 003_seed_content.sql:
--   psql -h localhost -U innopixel -d innopixel -f database/004_time_registration.sql
--
-- Reuses the existing tables: one registration = one row in worklog + one row in workloglist
-- (worklog_id, user_id) that says whose it is. worklog.description is the optional remark, worklog.date the
-- Danish calendar date of the clock-in, and checkin/checkout are TIMESTAMPTZ (UTC). checkout IS NULL means the
-- employee is clocked in right now.
--
-- Only adds columns, constraints and one table; nothing existing is removed or changed in meaning.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- worklog: project, breaks and approval
-- -----------------------------------------------------------------------------

-- break_minutes: total break of a finished registration (live breaks are summed into it at clock-out;
-- a manual adjustment sets it directly). Worked time = checkout - checkin - break_minutes.
-- status: PENDING until an administrator approves or rejects it. Editing an approved registration is reserved
-- for administrators; when an employee edits their own, it goes back to PENDING.
ALTER TABLE worklog
    ADD COLUMN projects_id   INTEGER REFERENCES projects (id),
    ADD COLUMN break_minutes INTEGER     NOT NULL DEFAULT 0 CHECK (break_minutes BETWEEN 0 AND 1440),
    ADD COLUMN status        VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    ADD COLUMN approved_by   INTEGER REFERENCES employee (id),
    ADD COLUMN approved_at   TIMESTAMPTZ,
    ADD COLUMN created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- A finished registration lasts at most 24 hours and the break can never exceed the time between the stamps,
-- so worked time is never negative. Registrations across midnight are fine (checkout on the next day).
ALTER TABLE worklog ADD CONSTRAINT worklog_duration_check CHECK (
    checkout IS NULL
    OR (checkout <= checkin + INTERVAL '24 hours'
        AND EXTRACT(EPOCH FROM (checkout - checkin)) >= break_minutes * 60)
);

CREATE INDEX worklog_date_idx ON worklog ("date");
CREATE INDEX worklog_status_idx ON worklog (status) WHERE status = 'PENDING';
CREATE INDEX worklog_open_idx ON worklog (id) WHERE checkout IS NULL;

-- -----------------------------------------------------------------------------
-- worklogbreak: breaks taken while clocked in ("Hold pause")
-- -----------------------------------------------------------------------------

-- end_at IS NULL means the break is running. A registration has at most one running break.
CREATE TABLE worklogbreak (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    worklog_id INTEGER     NOT NULL REFERENCES worklog (id),
    start_at   TIMESTAMPTZ NOT NULL,
    end_at     TIMESTAMPTZ,
    CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE INDEX worklogbreak_worklog_id_idx ON worklogbreak (worklog_id);
CREATE UNIQUE INDEX worklogbreak_one_open_key ON worklogbreak (worklog_id) WHERE end_at IS NULL;

-- -----------------------------------------------------------------------------
-- employee: planned working hours
-- -----------------------------------------------------------------------------

-- Hours per week (Danish full time: 37). Spread evenly over Monday-Friday for "planlagte timer";
-- 0 means no planned hours (e.g. an hourly employee). Administrators change it on the Team page.
ALTER TABLE employee
    ADD COLUMN expected_weekly_hours NUMERIC(4, 1) NOT NULL DEFAULT 37 CHECK (expected_weekly_hours BETWEEN 0 AND 80);

COMMIT;
