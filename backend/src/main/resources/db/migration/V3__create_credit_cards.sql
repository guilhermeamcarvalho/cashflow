-- ---------------------------------------------------------------------------
-- V3: forma de pagamento, cartões de crédito, faturas e parcelamento.
--
-- Cada compra no crédito guarda a fatura a que pertence (invoice_month = mês
-- de VENCIMENTO, sempre o 1º dia). Compras parceladas viram N lançamentos
-- ligados por installment_group_id, um em cada fatura.
-- ---------------------------------------------------------------------------

CREATE TABLE credit_cards (
    id           UUID           PRIMARY KEY,
    user_id      UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name         VARCHAR(60)    NOT NULL,
    color        VARCHAR(7)     NOT NULL,
    closing_day  INTEGER        NOT NULL,
    due_day      INTEGER        NOT NULL,
    credit_limit NUMERIC(14, 2),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_credit_cards_closing_day CHECK (closing_day BETWEEN 1 AND 31),
    CONSTRAINT ck_credit_cards_due_day CHECK (due_day BETWEEN 1 AND 31),
    CONSTRAINT ck_credit_cards_limit CHECK (credit_limit IS NULL OR credit_limit > 0),
    CONSTRAINT uk_credit_cards_user_name UNIQUE (user_id, name)
);

CREATE INDEX ix_credit_cards_user ON credit_cards (user_id);

-- Faturas marcadas como pagas (as demais são calculadas a partir das compras).
CREATE TABLE credit_card_invoice_payments (
    id             UUID PRIMARY KEY,
    credit_card_id UUID NOT NULL REFERENCES credit_cards (id) ON DELETE CASCADE,
    invoice_month  DATE NOT NULL, -- 1º dia do mês de vencimento
    paid_on        DATE NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_invoice_payments_card_month UNIQUE (credit_card_id, invoice_month)
);

-- Lançamentos ----------------------------------------------------------------
ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(10);
ALTER TABLE transactions ADD COLUMN credit_card_id UUID;
ALTER TABLE transactions ADD COLUMN invoice_month DATE;
ALTER TABLE transactions ADD COLUMN installment_group_id UUID;
ALTER TABLE transactions ADD COLUMN installment_number INTEGER;
ALTER TABLE transactions ADD COLUMN installment_count INTEGER;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_credit_card
        FOREIGN KEY (credit_card_id) REFERENCES credit_cards (id) ON DELETE RESTRICT;
ALTER TABLE transactions
    ADD CONSTRAINT ck_transactions_payment_method
        CHECK (payment_method IS NULL OR payment_method IN ('PIX', 'DEBIT', 'CREDIT', 'CASH', 'BOLETO'));
ALTER TABLE transactions
    ADD CONSTRAINT ck_transactions_credit_card
        CHECK ((credit_card_id IS NULL AND invoice_month IS NULL)
            OR (credit_card_id IS NOT NULL AND invoice_month IS NOT NULL AND payment_method = 'CREDIT'));

CREATE INDEX ix_transactions_card_invoice ON transactions (credit_card_id, invoice_month);
CREATE INDEX ix_transactions_installment_group ON transactions (installment_group_id);

-- Lançamentos fixos também podem ter forma de pagamento (ex.: assinatura no cartão)
ALTER TABLE recurring_transactions ADD COLUMN payment_method VARCHAR(10);
ALTER TABLE recurring_transactions ADD COLUMN credit_card_id UUID;
ALTER TABLE recurring_transactions
    ADD CONSTRAINT fk_recurring_credit_card
        FOREIGN KEY (credit_card_id) REFERENCES credit_cards (id) ON DELETE RESTRICT;
ALTER TABLE recurring_transactions
    ADD CONSTRAINT ck_recurring_payment_method
        CHECK (payment_method IS NULL OR payment_method IN ('PIX', 'DEBIT', 'CREDIT', 'CASH', 'BOLETO'));
