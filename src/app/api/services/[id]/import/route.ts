export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

interface ImportError { row: number; field: string; message: string; }
interface ImportResult { total: number; valid: number; errors: ImportError[]; }

// Parse CSV text into rows
function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

function validateRow(row: string[], rowNum: number, headers: string[]): ImportError[] {
  const errors: ImportError[] = [];
  const get = (h: string) => { const i = headers.indexOf(h); return i >= 0 ? row[i]?.trim() : ""; };

  if (!get("dateFrom") && !get("Дата")) errors.push({ row: rowNum, field: "dateFrom", message: "Обязательное поле: Дата начала" });
  if (!get("pricePerPerson") && !get("Цена")) errors.push({ row: rowNum, field: "pricePerPerson", message: "Обязательное поле: Цена" });

  const price = parseFloat(get("pricePerPerson") || get("Цена") || "0");
  if (isNaN(price) || price <= 0) errors.push({ row: rowNum, field: "pricePerPerson", message: "Цена должна быть положительным числом" });

  const guestsAdults = parseInt(get("guestsAdults") || get("Взрослые") || "2");
  if (isNaN(guestsAdults) || guestsAdults < 1) errors.push({ row: rowNum, field: "guestsAdults", message: "Количество взрослых >= 1" });

  const dateFrom = get("dateFrom") || get("Дата");
  const dateTo = get("dateTo") || get("Дата окончания") || dateFrom;
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    errors.push({ row: rowNum, field: "dateFrom", message: "Неверный формат даты начала" });
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    errors.push({ row: rowNum, field: "dateTo", message: "Неверный формат даты окончания" });
  }

  return errors;
}

// POST — импорт CSV/TSV файла с вариантами цен
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const service = await prisma.service.findUnique({ where: { id }, select: { providerId: true } });
    if (!service || service.providerId !== payload.userId) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return NextResponse.json({ error: "Файл пуст или содержит только заголовки" }, { status: 400 });

    // Map ru/en headers to internal field names
    const headerMap: Record<string, string> = {
      // English (from templates)
      "dateFrom": "dateFrom", "dateTo": "dateTo",
      "roomType": "roomType", "mealPlan": "mealPlan",
      "guestsAdults": "guestsAdults", "guestsChildren": "guestsChildren",
      "childAgeFrom": "childAgeFrom", "childAgeTo": "childAgeTo",
      "nights": "nights", "pricePerPerson": "pricePerPerson",
      "availableSlots": "availableSlots",
      // Russian
      "Дата": "dateFrom", "Дата окончания": "dateTo", "Дата начала": "dateFrom",
      "Тип номера": "roomType", "Номер": "roomType",
      "Питание": "mealPlan", "Взрослые": "guestsAdults", "Дети": "guestsChildren",
      "Возраст детей от": "childAgeFrom", "Возраст детей до": "childAgeTo",
      "Возраст детей": "childAge", "Возраст": "childAge",
      "Цена": "pricePerPerson", "Цена за человека": "pricePerPerson",
      "Ночей": "nights", "Количество ночей": "nights",
      "Осталось": "availableSlots", "Мест": "availableSlots",
      "Отель": "title", "Название": "title",
    };

    const rawHeaders = rows[0];
    const headers = rawHeaders.map((h) => headerMap[h] || h);

    const allErrors: ImportError[] = [];
    const validRows: Record<string, string>[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2 || row.every((c) => !c)) continue; // skip empty rows
      const errs = validateRow(row, i, headers);
      allErrors.push(...errs);
      if (errs.length === 0) {
        const obj: Record<string, string> = {};
        headers.forEach((h, j) => { obj[h] = row[j]?.trim() || ""; });
        validRows.push(obj);
      }
    }

    const result: ImportResult = { total: rows.length - 1, valid: validRows.length, errors: allErrors };

    // If there are errors, return them without importing
    if (allErrors.length > 0) {
      return NextResponse.json({ result, imported: false }, { status: 400 });
    }

    // Import valid rows
    if (validRows.length > 0) {
      const getVal = (r: Record<string, string>, ...keys: string[]) => {
        for (const k of keys) { if (r[k]) return r[k]; }
        return "";
      };
      const serviceType = (await prisma.service.findUnique({ where: { id }, select: { type: true } }))?.type;

      await prisma.servicePriceVariant.createMany({
        data: validRows.map((r) => {
          const dateFrom = getVal(r, "dateFrom");
          const dateTo = getVal(r, "dateTo") || dateFrom;
          const childAge = getVal(r, "childAge");
          const childParts = childAge.split("-").map(Number);

          return {
            serviceId: id,
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
            roomType: getVal(r, "roomType") || null,
            mealPlan: getVal(r, "mealPlan") || null,
            childAgeFrom: childParts[0] || null,
            childAgeTo: childParts[1] || childParts[0] || null,
            guestsAdults: parseInt(getVal(r, "guestsAdults")) || 2,
            guestsChildren: parseInt(getVal(r, "guestsChildren")) || 0,
            nights: serviceType === "TOUR" ? (parseInt(getVal(r, "nights")) || null) : null,
            pricePerPerson: parseFloat(getVal(r, "pricePerPerson")) || 0,
            availableSlots: parseInt(getVal(r, "availableSlots")) || null,
          };
        }),
      });
    }

    return NextResponse.json({ result, imported: true });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Ошибка сервера при импорте" }, { status: 500 });
  }
}
