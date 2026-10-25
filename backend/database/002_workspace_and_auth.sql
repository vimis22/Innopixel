-- =============================================================================
-- Innopixel - migration 002: the internal platform (Innopixel Studio) and login
--
-- Run after 001_create_schema.sql:
--   psql -h localhost -U innopixel -d innopixel -f database/002_workspace_and_auth.sql
--
-- * Employees log in. Like admin and client, an employee IS a user (employee.id = "user".id).
--   ADMIN in the platform = an employee with a row in admin; EMPLOYEE = an employee without.
-- * Internal projects use the existing projects table. A project belongs to the platform when
--   it has a manager (manager_id); portfolio projects for the website have none.
--   currentstatus (Draft/Published) still decides what is shown on the website.
-- * The project's status history uses the existing progress table:
--   name = new status, comment = previous status, changedby = id of the user.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Users: staff do not need an address, a birth date or a phone number
-- -----------------------------------------------------------------------------

ALTER TABLE "user" ALTER COLUMN address_id DROP NOT NULL;
ALTER TABLE "user" ALTER COLUMN telephone_id DROP NOT NULL;
ALTER TABLE "user" ALTER COLUMN birth_id DROP NOT NULL;

-- password_hash is NULL until a password has been set (ASP.NET Core Identity PBKDF2 hash).
-- Deactivated employees (active = false) cannot log in.
CREATE TABLE employee (
    id            INTEGER      PRIMARY KEY REFERENCES "user" (id),
    title         VARCHAR(100) NOT NULL,
    department    VARCHAR(100),
    password_hash TEXT,
    active        BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Logins look employees up by email, case-insensitively.
CREATE INDEX user_email_lower_idx ON "user" (lower(email));

-- -----------------------------------------------------------------------------
-- Projects: fields used by the internal platform and the website
-- -----------------------------------------------------------------------------

ALTER TABLE projects ALTER COLUMN deadline TYPE DATE USING deadline::date;

ALTER TABLE projects
    ADD COLUMN client      VARCHAR(200),
    ADD COLUMN manager_id  INTEGER REFERENCES employee (id),
    ADD COLUMN workstatus  VARCHAR(20) CHECK (workstatus IN ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
    ADD COLUMN start_date  DATE,
    ADD COLUMN image_url   VARCHAR(500),
    ADD COLUMN archived    BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- A platform project (with a manager) always has a client, a status and a valid period.
ALTER TABLE projects ADD CONSTRAINT projects_platform_fields_check CHECK (
    manager_id IS NULL
    OR (client IS NOT NULL AND workstatus IS NOT NULL AND start_date IS NOT NULL
        AND deadline IS NOT NULL AND deadline >= start_date)
);

CREATE INDEX projects_manager_id_idx ON projects (manager_id);

-- Translated texts for a project on the website (title, tags, intro, body), like languagelist for services.
CREATE TABLE projectlanguagelist (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    projects_id  INTEGER NOT NULL REFERENCES projects (id),
    languages_id INTEGER NOT NULL REFERENCES languages (id),
    UNIQUE (projects_id, languages_id)
);

CREATE INDEX projectlanguagelist_languages_id_idx ON projectlanguagelist (languages_id);

-- The employees taking part in a project.
CREATE TABLE projectmember (
    projects_id INTEGER     NOT NULL REFERENCES projects (id),
    employee_id INTEGER     NOT NULL REFERENCES employee (id),
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (projects_id, employee_id)
);

CREATE INDEX projectmember_employee_id_idx ON projectmember (employee_id);

-- -----------------------------------------------------------------------------
-- Milestones, tasks, checklists and dependencies
-- -----------------------------------------------------------------------------

-- completedmanually is only used for milestones without tasks; otherwise completion follows the tasks.
CREATE TABLE milestone (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    projects_id       INTEGER      NOT NULL REFERENCES projects (id),
    title             VARCHAR(200) NOT NULL,
    description       VARCHAR(2000) NOT NULL DEFAULT '',
    due_date          DATE         NOT NULL,
    completedmanually BOOLEAN      NOT NULL DEFAULT false,
    completedat       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX milestone_projects_id_idx ON milestone (projects_id);

CREATE TABLE task (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    projects_id    INTEGER       NOT NULL REFERENCES projects (id),
    title          VARCHAR(200)  NOT NULL,
    description    VARCHAR(5000) NOT NULL DEFAULT '',
    status         VARCHAR(20)   NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
    priority       VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assignee_id    INTEGER REFERENCES employee (id),
    taskgroup      VARCHAR(100)  NOT NULL,
    start_date     DATE          NOT NULL,
    due_date       DATE          NOT NULL,
    progress       INTEGER       NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    estimate_hours NUMERIC(7, 2) CHECK (estimate_hours IS NULL OR estimate_hours > 0),
    milestone_id   INTEGER REFERENCES milestone (id),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CHECK (due_date >= start_date)
);

CREATE INDEX task_projects_id_idx ON task (projects_id);
CREATE INDEX task_assignee_id_idx ON task (assignee_id);
CREATE INDEX task_milestone_id_idx ON task (milestone_id);

CREATE TABLE checklistitem (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id   INTEGER      NOT NULL REFERENCES task (id),
    text      VARCHAR(500) NOT NULL,
    done      BOOLEAN      NOT NULL DEFAULT false,
    sortorder INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX checklistitem_task_id_idx ON checklistitem (task_id, sortorder);

-- Finish-to-start: the successor should not start before the predecessor is due.
CREATE TABLE taskdependency (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    predecessor_id INTEGER NOT NULL REFERENCES task (id),
    successor_id   INTEGER NOT NULL REFERENCES task (id),
    UNIQUE (predecessor_id, successor_id),
    CHECK (predecessor_id <> successor_id)
);

CREATE INDEX taskdependency_successor_id_idx ON taskdependency (successor_id);

-- -----------------------------------------------------------------------------
-- Activity feed of the platform
-- -----------------------------------------------------------------------------

-- task_id has no foreign key: the entry stays when the task is deleted.
CREATE TABLE activitylog (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type        VARCHAR(30)   NOT NULL CHECK (type IN (
                    'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_STATUS', 'PROJECT_ARCHIVED', 'PROJECT_RESTORED',
                    'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS', 'TASK_DELETED',
                    'MILESTONE_CREATED', 'MILESTONE_UPDATED', 'MILESTONE_COMPLETED', 'MILESTONE_DELETED',
                    'MEMBER_ADDED', 'MEMBER_REMOVED', 'USER_CREATED', 'USER_UPDATED')),
    actor_id    INTEGER       NOT NULL REFERENCES employee (id),
    projects_id INTEGER REFERENCES projects (id),
    task_id     INTEGER,
    message     VARCHAR(1000) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX activitylog_created_at_idx ON activitylog (created_at DESC);
CREATE INDEX activitylog_projects_id_idx ON activitylog (projects_id, created_at DESC);

COMMIT;
