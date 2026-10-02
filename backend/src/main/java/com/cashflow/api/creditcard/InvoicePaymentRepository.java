package com.cashflow.api.creditcard;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface InvoicePaymentRepository extends JpaRepository<InvoicePayment, UUID> {

    Optional<InvoicePayment> findByCreditCardIdAndInvoiceMonth(UUID creditCardId, LocalDate invoiceMonth);
}
