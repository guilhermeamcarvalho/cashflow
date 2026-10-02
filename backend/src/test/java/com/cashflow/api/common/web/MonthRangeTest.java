package com.cashflow.api.common.web;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class MonthRangeTest {

    @Test
    void coversWholeMonthIncludingLeapDay() {
        MonthRange range = MonthRange.of(YearMonth.of(2028, 2));

        assertThat(range.start()).isEqualTo(LocalDate.of(2028, 2, 1));
        assertThat(range.end()).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void previousCrossesYearBoundary() {
        assertThat(MonthRange.of(YearMonth.of(2026, 1)).previous().month()).isEqualTo(YearMonth.of(2025, 12));
    }

    @Test
    void fallsBackToCurrentMonth() {
        Clock clock = Clock.fixed(Instant.parse("2026-10-15T12:00:00Z"), ZoneOffset.UTC);

        assertThat(MonthRange.ofOrCurrent(null, clock).month()).isEqualTo(YearMonth.of(2026, 10));
        assertThat(MonthRange.ofOrCurrent(YearMonth.of(2025, 3), clock).month()).isEqualTo(YearMonth.of(2025, 3));
    }
}
