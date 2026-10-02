package com.cashflow.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de ponta a ponta da API (HTTP → Controller → Service → Repository → banco H2
 * em modo PostgreSQL, com o schema criado pelas migrações Flyway).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CashflowApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void registerLoginAndRejectInvalidCredentials() throws Exception {
        String email = uniqueEmail();
        register(email);

        perform(post("/api/v1/auth/register"), null, """
                {"name":"Outra","email":"%s","password":"12345678"}""".formatted(email.toUpperCase()))
                .andExpect(status().isConflict());

        perform(post("/api/v1/auth/login"), null, """
                {"email":"%s","password":"senha-errada"}""".formatted(email))
                .andExpect(status().isUnauthorized());

        perform(post("/api/v1/auth/login"), null, """
                {"email":"%s","password":"12345678"}""".formatted(email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get("/api/v1/transactions")).andExpect(status().isUnauthorized());
    }

    @Test
    void monthlyFlowProducesConsistentSummaryAndBudgets() throws Exception {
        String token = register(uniqueEmail());
        String food = categoryId(token, "Alimentação");
        String salary = categoryId(token, "Salário");

        createTransaction(token, food, "Mercado", "150.00", "2026-10-05");
        createTransaction(token, food, "Restaurante", "50.00", "2026-10-06");
        createTransaction(token, salary, "Salário outubro", "5000.00", "2026-10-01");
        createTransaction(token, food, "Mercado setembro", "80.00", "2026-09-20");

        perform(put("/api/v1/budgets"), token, """
                {"categoryId":"%s","month":"2026-10","amount":400}""".formatted(food))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spent").value(200.0))
                .andExpect(jsonPath("$.percentUsed").value(50));

        perform(get("/api/v1/dashboard/summary").param("month", "2026-10"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value("2026-10"))
                .andExpect(jsonPath("$.current.income").value(5000.0))
                .andExpect(jsonPath("$.current.expenses").value(200.0))
                .andExpect(jsonPath("$.current.balance").value(4800.0))
                .andExpect(jsonPath("$.previous.expenses").value(80.0))
                .andExpect(jsonPath("$.budgeted").value(400.0))
                .andExpect(jsonPath("$.budgetSpent").value(200.0))
                .andExpect(jsonPath("$.expensesByCategory[0].name").value("Alimentação"))
                .andExpect(jsonPath("$.expensesByCategory[0].percent").value(100))
                .andExpect(jsonPath("$.recentTransactions.length()").value(3));

        perform(get("/api/v1/transactions").param("month", "2026-10").param("type", "EXPENSE"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].description").value("Restaurante"));

        perform(get("/api/v1/transactions").param("month", "2026-10").param("search", "MERC"), token, null)
                .andExpect(jsonPath("$.totalElements").value(1));

        perform(post("/api/v1/budgets/copy"), token, """
                {"fromMonth":"2026-10","toMonth":"2026-11"}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalSpent").value(0));
    }

    @Test
    void monthlyTotalsFillGapsAndFilterByCategory() throws Exception {
        String token = register(uniqueEmail());
        String food = categoryId(token, "Alimentação");
        String salary = categoryId(token, "Salário");

        createTransaction(token, food, "Mercado", "100.00", "2026-08-03");
        createTransaction(token, food, "Feira", "40.00", "2026-10-02");
        createTransaction(token, categoryId(token, "Lazer"), "Show", "60.00", "2026-10-09");
        createTransaction(token, salary, "Salário", "3000.00", "2026-10-05");

        perform(get("/api/v1/dashboard/monthly-totals").param("from", "2026-07").param("to", "2026-10"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.months.length()").value(4))
                .andExpect(jsonPath("$.months[0].month").value("2026-07"))
                .andExpect(jsonPath("$.months[0].expenses").value(0))
                .andExpect(jsonPath("$.months[1].expenses").value(100.0))
                .andExpect(jsonPath("$.months[2].expenses").value(0))
                .andExpect(jsonPath("$.months[3].expenses").value(100.0))
                .andExpect(jsonPath("$.months[3].income").value(3000.0))
                .andExpect(jsonPath("$.months[3].balance").value(2900.0));

        perform(get("/api/v1/dashboard/monthly-totals")
                .param("from", "2026-07").param("to", "2026-10").param("categoryId", food), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(food))
                .andExpect(jsonPath("$.months[3].expenses").value(40.0))
                .andExpect(jsonPath("$.months[3].income").value(0));

        perform(get("/api/v1/dashboard/monthly-totals").param("from", "2024-01").param("to", "2026-10"), token, null)
                .andExpect(status().isUnprocessableContent());
        perform(get("/api/v1/dashboard/monthly-totals").param("from", "2026-10").param("to", "2026-01"), token, null)
                .andExpect(status().isUnprocessableContent());

        String otherUser = register(uniqueEmail());
        perform(get("/api/v1/dashboard/monthly-totals").param("categoryId", food), otherUser, null)
                .andExpect(status().isNotFound());

        // série diária de um mês específico
        perform(get("/api/v1/dashboard/daily-totals").param("month", "2026-10"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value("2026-10"))
                .andExpect(jsonPath("$.days.length()").value(31))
                .andExpect(jsonPath("$.days[0].date").value("2026-10-01"))
                .andExpect(jsonPath("$.days[0].expenses").value(0))
                .andExpect(jsonPath("$.days[1].expenses").value(40.0))
                .andExpect(jsonPath("$.days[4].income").value(3000.0))
                .andExpect(jsonPath("$.days[8].expenses").value(60.0));

        perform(get("/api/v1/dashboard/daily-totals").param("month", "2026-10").param("categoryId", food), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days[8].expenses").value(0))
                .andExpect(jsonPath("$.days[1].expenses").value(40.0));

        perform(get("/api/v1/dashboard/daily-totals").param("month", "2026-02"), token, null)
                .andExpect(jsonPath("$.days.length()").value(28));
    }

    @Test
    void usersCannotSeeEachOthersData() throws Exception {
        String owner = register(uniqueEmail());
        String intruder = register(uniqueEmail());
        String transactionId = createTransaction(owner, categoryId(owner, "Lazer"), "Cinema", "40", "2026-10-10");

        perform(get("/api/v1/transactions/" + transactionId), intruder, null).andExpect(status().isNotFound());
        perform(delete("/api/v1/transactions/" + transactionId), intruder, null).andExpect(status().isNotFound());
        perform(get("/api/v1/transactions/" + transactionId), owner, null).andExpect(status().isOk());
    }

    @Test
    void validationAndBusinessRulesReturnProblemDetails() throws Exception {
        String token = register(uniqueEmail());
        String food = categoryId(token, "Alimentação");
        String salary = categoryId(token, "Salário");

        perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"","amount":-1,"date":"2026-10-01"}""".formatted(food))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount").exists())
                .andExpect(jsonPath("$.errors.description").exists());

        perform(put("/api/v1/budgets"), token, """
                {"categoryId":"%s","month":"2026-10","amount":100}""".formatted(salary))
                .andExpect(status().isUnprocessableContent());

        createTransaction(token, food, "Padaria", "12.50", "2026-10-02");
        perform(delete("/api/v1/categories/" + food), token, null).andExpect(status().isConflict());
    }

    @Test
    void recurringTransactionsGenerateOncePerMonthUpToCurrentMonth() throws Exception {
        String token = register(uniqueEmail());
        String housing = categoryId(token, "Moradia");
        YearMonth current = YearMonth.now();
        YearMonth start = current.minusMonths(2);

        // dia 31: em meses mais curtos o lançamento cai no último dia
        MvcResult created = perform(post("/api/v1/recurring-transactions"), token, """
                {"categoryId":"%s","description":"Aluguel","amount":1500,"dayOfMonth":31,"startMonth":"%s"}"""
                .formatted(housing, start))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.nextDate").value(current.plusMonths(1).atEndOfMonth().toString()))
                .andReturn();
        String recurringId = JsonPath.read(body(created), "$.id");

        for (YearMonth month = start; !month.isAfter(current); month = month.plusMonths(1)) {
            perform(get("/api/v1/transactions").param("month", month.toString()), token, null)
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].date").value(month.atEndOfMonth().toString()))
                    .andExpect(jsonPath("$.content[0].recurringId").value(recurringId));
        }
        perform(get("/api/v1/transactions").param("month", current.plusMonths(1).toString()), token, null)
                .andExpect(jsonPath("$.totalElements").value(0));

        // leituras repetidas não duplicam lançamentos
        perform(get("/api/v1/dashboard/summary").param("month", current.toString()), token, null)
                .andExpect(jsonPath("$.current.expenses").value(1500.0));

        // um lançamento gerado e depois excluído não volta a ser criado
        MvcResult currentMonth = perform(get("/api/v1/transactions").param("month", current.toString()), token, null)
                .andReturn();
        String generatedId = JsonPath.read(body(currentMonth), "$.content[0].id");
        perform(delete("/api/v1/transactions/" + generatedId), token, null).andExpect(status().isNoContent());
        perform(get("/api/v1/transactions").param("month", current.toString()), token, null)
                .andExpect(jsonPath("$.totalElements").value(0));

        // edição vale para os próximos meses; o histórico não muda
        perform(put("/api/v1/recurring-transactions/" + recurringId), token, """
                {"categoryId":"%s","description":"Aluguel novo","amount":1600,"dayOfMonth":10,"startMonth":"%s"}"""
                .formatted(housing, start))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(1600))
                .andExpect(jsonPath("$.nextDate").value(current.plusMonths(1).atDay(10).toString()));
        perform(get("/api/v1/transactions").param("month", start.toString()), token, null)
                .andExpect(jsonPath("$.content[0].amount").value(1500.0));

        // mês inicial não muda depois de gerado; tipo da categoria precisa ser o mesmo
        perform(put("/api/v1/recurring-transactions/" + recurringId), token, """
                {"categoryId":"%s","description":"Aluguel","amount":1600,"dayOfMonth":10,"startMonth":"%s"}"""
                .formatted(housing, current.plusMonths(3)))
                .andExpect(status().isUnprocessableContent());
        perform(put("/api/v1/recurring-transactions/" + recurringId), token, """
                {"categoryId":"%s","description":"Aluguel","amount":1600,"dayOfMonth":10,"startMonth":"%s"}"""
                .formatted(categoryId(token, "Salário"), start))
                .andExpect(status().isUnprocessableContent());

        // outro usuário não enxerga o lançamento fixo
        String intruder = register(uniqueEmail());
        perform(delete("/api/v1/recurring-transactions/" + recurringId), intruder, null)
                .andExpect(status().isNotFound());

        // encerrar mantém o histórico, desvinculado do modelo
        perform(delete("/api/v1/recurring-transactions/" + recurringId), token, null)
                .andExpect(status().isNoContent());
        perform(get("/api/v1/recurring-transactions"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        perform(get("/api/v1/transactions").param("month", start.toString()), token, null)
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].recurringId").doesNotExist());
    }

    @Test
    void futureRecurringTransactionIsNotLaunchedYetAndBlocksCategoryDeletion() throws Exception {
        String token = register(uniqueEmail());
        String bills = categoryId(token, "Contas");
        YearMonth next = YearMonth.now().plusMonths(1);

        perform(post("/api/v1/recurring-transactions"), token, """
                {"categoryId":"%s","description":"Internet","amount":120,"dayOfMonth":5,"startMonth":"%s"}"""
                .formatted(bills, next))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nextDate").value(next.atDay(5).toString()));

        perform(get("/api/v1/transactions").param("month", next.toString()), token, null)
                .andExpect(jsonPath("$.totalElements").value(0));
        perform(delete("/api/v1/categories/" + bills), token, null).andExpect(status().isConflict());

        perform(post("/api/v1/recurring-transactions"), token, """
                {"categoryId":"%s","description":"","amount":0,"dayOfMonth":32,"startMonth":"%s"}"""
                .formatted(bills, next))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.dayOfMonth").exists())
                .andExpect(jsonPath("$.errors.amount").exists());
    }

    @Test
    void creditCardPurchasesInstallmentsAndInvoices() throws Exception {
        String token = register(uniqueEmail());
        String shopping = categoryId(token, "Compras");
        String salary = categoryId(token, "Salário");

        // fecha dia 3, vence dia 10; datas em 2025 para que as faturas já estejam fechadas
        MvcResult created = perform(post("/api/v1/credit-cards"), token, """
                {"name":"Nubank","color":"#8a05be","closingDay":3,"dueDay":10,"creditLimit":5000}""")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.color").value("#8A05BE"))
                .andExpect(jsonPath("$.availableLimit").value(5000))
                .andReturn();
        String card = JsonPath.read(body(created), "$.id");

        // compra à vista antes do fechamento → fatura de março
        perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"Livro","amount":120,"date":"2025-03-02",
                 "paymentMethod":"CREDIT","creditCardId":"%s"}""".formatted(shopping, card))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceMonth").value("2025-03"))
                .andExpect(jsonPath("$.creditCard.name").value("Nubank"));

        // parcelada depois do fechamento: 3x, uma parcela por fatura a partir de abril
        MvcResult installment = perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"Fone","amount":1000,"date":"2025-03-05",
                 "paymentMethod":"CREDIT","creditCardId":"%s","installments":3}""".formatted(shopping, card))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(333.34))
                .andExpect(jsonPath("$.installmentNumber").value(1))
                .andExpect(jsonPath("$.installmentCount").value(3))
                .andExpect(jsonPath("$.invoiceMonth").value("2025-04"))
                .andReturn();
        String firstInstallment = JsonPath.read(body(installment), "$.id");

        perform(get("/api/v1/credit-cards/" + card + "/invoices/2025-06"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total").value(333.33))
                .andExpect(jsonPath("$.summary.closingDate").value("2025-06-03"))
                .andExpect(jsonPath("$.summary.dueDate").value("2025-06-10"))
                .andExpect(jsonPath("$.summary.status").value("OVERDUE"))
                .andExpect(jsonPath("$.transactions[0].date").value("2025-05-05"))
                .andExpect(jsonPath("$.transactions[0].installmentNumber").value(3));

        // filtro por cartão na listagem do mês
        perform(get("/api/v1/transactions").param("month", "2025-03").param("creditCardId", card), token, null)
                .andExpect(jsonPath("$.totalElements").value(2));
        perform(get("/api/v1/transactions").param("month", "2025-03").param("paymentMethod", "PIX"), token, null)
                .andExpect(jsonPath("$.totalElements").value(0));

        // pagar a fatura de março libera o limite dela
        perform(put("/api/v1/credit-cards/" + card + "/invoices/2025-03/payment"), token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
        perform(get("/api/v1/credit-cards"), token, null)
                .andExpect(jsonPath("$[0].availableLimit").value(4000.0));
        perform(put("/api/v1/credit-cards/" + card + "/invoices/2099-01/payment"), token, null)
                .andExpect(status().isUnprocessableContent());

        // regras de forma de pagamento
        perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"Sem cartão","amount":10,"date":"2025-03-02",
                 "paymentMethod":"CREDIT"}""".formatted(shopping))
                .andExpect(status().isUnprocessableContent());
        perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"Pix parcelado","amount":10,"date":"2025-03-02",
                 "paymentMethod":"PIX","installments":2}""".formatted(shopping))
                .andExpect(status().isUnprocessableContent());
        perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"Salário","amount":3000,"date":"2025-03-01",
                 "paymentMethod":"CREDIT","creditCardId":"%s"}""".formatted(salary, card))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").doesNotExist())
                .andExpect(jsonPath("$.creditCard").doesNotExist());

        String intruder = register(uniqueEmail());
        perform(post("/api/v1/transactions"), intruder, """
                {"categoryId":"%s","description":"X","amount":10,"date":"2025-03-02",
                 "paymentMethod":"CREDIT","creditCardId":"%s"}""".formatted(categoryId(intruder, "Compras"), card))
                .andExpect(status().isNotFound());

        // cartão com compras não pode ser excluído; excluir todas as parcelas de uma vez
        perform(delete("/api/v1/credit-cards/" + card), token, null).andExpect(status().isConflict());
        perform(delete("/api/v1/transactions/" + firstInstallment).param("allInstallments", "true"), token, null)
                .andExpect(status().isNoContent());
        perform(get("/api/v1/credit-cards/" + card + "/invoices/2025-05"), token, null)
                .andExpect(jsonPath("$.transactions.length()").value(0))
                .andExpect(jsonPath("$.summary.status").value("PAID"));
    }

    // ----------------------------------------------------------------- helpers

    private String register(String email) throws Exception {
        MvcResult result = perform(post("/api/v1/auth/register"), null, """
                {"name":"Pessoa Teste","email":"%s","password":"12345678"}""".formatted(email))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(body(result), "$.token");
    }

    private String categoryId(String token, String name) throws Exception {
        MvcResult result = perform(get("/api/v1/categories"), token, null).andExpect(status().isOk()).andReturn();
        List<String> ids = JsonPath.read(body(result), "$[?(@.name == '" + name + "')].id");
        return ids.getFirst();
    }

    private String createTransaction(String token, String categoryId, String description, String amount,
                                     String date) throws Exception {
        MvcResult result = perform(post("/api/v1/transactions"), token, """
                {"categoryId":"%s","description":"%s","amount":%s,"date":"%s"}"""
                .formatted(categoryId, description, amount, date))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(body(result), "$.id");
    }

    private ResultActions perform(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
            String token, String json) throws Exception {
        if (token != null) {
            request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        if (json != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(json);
        }
        return mvc.perform(request);
    }

    private static String body(MvcResult result) throws Exception {
        return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }
}
