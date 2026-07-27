"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";

interface AvailabilityCalendarProps {
  availableDates?: string[];
  unavailableDates?: string[];
  onSelectDates?: (start: string, end: string) => void;
  minDate?: string;
}

const MONTH_NAMES_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function AvailabilityCalendar({
  availableDates = [],
  unavailableDates = [],
  onSelectDates,
  minDate,
}: AvailabilityCalendarProps) {
  const { t, locale } = useI18n();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const monthNames = locale === "en" ? MONTH_NAMES_EN : MONTH_NAMES_RU;
  const weekdays = locale === "en" ? WEEKDAYS_EN : WEEKDAYS_RU;

  const minDateObj = minDate ? new Date(minDate) : today;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isDateDisabled = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d < minDateObj) return true;
    if (unavailableDates.includes(dateStr)) return true;
    return false;
  };

  const isDateAvailable = (dateStr: string) => {
    if (unavailableDates.length === 0 && availableDates.length === 0) return true;
    if (unavailableDates.includes(dateStr)) return false;
    if (availableDates.length > 0) return availableDates.includes(dateStr);
    return true;
  };

  const isInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  const isStartOrEnd = (dateStr: string) => dateStr === startDate || dateStr === endDate;

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);
    if (isDateDisabled(dateStr)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } else if (dateStr < startDate) {
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      setEndDate(dateStr);
      onSelectDates?.(startDate, dateStr);
    }
  };

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-lg font-bold text-secondary mb-4">📅 {t("serviceDetail.calendarTitle") || "Календарь доступности"}</h3>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-lg border border-gray-200 hover:border-primary hover:text-primary flex items-center justify-center transition-colors text-sm">←</button>
        <span className="font-semibold text-secondary">{monthNames[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} className="w-9 h-9 rounded-lg border border-gray-200 hover:border-primary hover:text-primary flex items-center justify-center transition-colors text-sm">→</button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((wd, idx) => (
          <div key={wd} role="columnheader" className="text-center text-xs font-semibold text-gray-400 py-1" aria-label={wd}>{wd}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const dateStr = formatDate(currentYear, currentMonth, day);
          const disabled = isDateDisabled(dateStr);
          const available = isDateAvailable(dateStr);
          const inRange = isInRange(dateStr);
          const selected = isStartOrEnd(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              aria-label={`${day} ${monthNames[currentMonth]} ${currentYear} — ${available ? (t("serviceDetail.calendarAvailable") || "Доступно") : (t("serviceDetail.calendarUnavailable") || "Нет мест")}`}
              className={`
                relative h-9 rounded-lg text-sm font-medium transition-all
                ${disabled ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:scale-110"}
                ${selected ? "bg-primary text-white shadow-md shadow-primary/30 font-bold" : ""}
                ${inRange ? "bg-primary/10 text-primary" : ""}
                ${!selected && !inRange && available && !disabled ? "text-secondary hover:bg-emerald-50 hover:text-emerald-600" : ""}
                ${!selected && !inRange && !available && !disabled ? "text-red-400 bg-red-50 line-through" : ""}
              `}
            >
              {day}
              {!disabled && available && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
              {!disabled && !available && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span>{t("serviceDetail.calendarAvailable") || "Доступно"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-400 rounded-full" />
          <span>{t("serviceDetail.calendarUnavailable") || "Нет мест"}</span>
        </div>
        {startDate && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span>{startDate}{endDate ? ` — ${endDate}` : " — selected"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
