-- ---------------------------------------------------------------------------
-- V1: schema inicial do Cashflow
-- Todas as tabelas de domínio pertencem a um usuário (multi-tenant por linha).
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id            UUID         PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE categories (
    id         UUID        PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       VARCHAR(60) NOT NULL,
    type       VARCHAR(10) NOT NULL,
    color      VARCHAR(7)  NOT NULL,
    icon       VARCHAR(40) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_categories_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT uk_categories_user_name_type UNIQUE (user_id, name, type)
);

CREATE INDEX ix_categories_user ON categories (user_id);

CREATE TABLE transactions (
    id          UUID           PRIMARY KEY,
    user_id     UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id UUID           NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    type        VARCHAR(10)    NOT NULL,
    description VARCHAR(140)   NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL,
    occurred_on DATE           NOT NULL,
    notes       VARCHAR(500),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_transactions_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT ck_transactions_amount CHECK (amount > 0)
);

-- Consulta mais comum: lançamentos de um usuário dentro de um mês.
CREATE INDEX ix_transactions_user_date ON transactions (user_id, occurred_on);
CREATE INDEX ix_transactions_category ON transactions (category_id);

CREATE TABLE budgets (
    id              UUID           PRIMARY KEY,
    user_id         UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id     UUID           NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    reference_month DATE           NOT NULL, -- sempre o 1º dia do mês
    amount          NUMERIC(14, 2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_budgets_amount CHECK (amount > 0),
    CONSTRAINT uk_budgets_user_category_month UNIQUE (user_id, category_id, reference_month)
);

CREATE INDEX ix_budgets_user_month ON budgets (user_id, reference_month);
