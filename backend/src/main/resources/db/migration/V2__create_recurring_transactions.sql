-- ---------------------------------------------------------------------------
-- V2: lançamentos fixos (ex.: aluguel, assinaturas, salário).
-- Cada linha é um modelo que gera um lançamento real por mês. O campo
-- generated_through guarda o último mês já gerado, para que cada mês seja
-- lançado uma única vez (e um lançamento excluído pelo usuário não volte).
-- ---------------------------------------------------------------------------

CREATE TABLE recurring_transactions (
    id                UUID           PRIMARY KEY,
    user_id           UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id       UUID           NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    type              VARCHAR(10)    NOT NULL,
    description       VARCHAR(140)   NOT NULL,
    amount            NUMERIC(14, 2) NOT NULL,
    day_of_month      INTEGER        NOT NULL,
    start_month       DATE           NOT NULL, -- sempre o 1º dia do mês
    generated_through DATE,                    -- 1º dia do último mês gerado (null = nenhum)
    notes             VARCHAR(500),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_recurring_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT ck_recurring_amount CHECK (amount > 0),
    CONSTRAINT ck_recurring_day CHECK (day_of_month BETWEEN 1 AND 31)
);

CREATE INDEX ix_recurring_user ON recurring_transactions (user_id);

-- Lançamentos gerados apontam para o modelo; excluir o modelo preserva o histórico.
ALTER TABLE transactions ADD COLUMN recurring_id UUID;
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_recurring
        FOREIGN KEY (recurring_id) REFERENCES recurring_transactions (id) ON DELETE SET NULL;
CREATE INDEX ix_transactions_recurring ON transactions (recurring_id);
