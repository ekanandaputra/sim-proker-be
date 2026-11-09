import * as exceljs from 'exceljs';

/** Shared styling helpers for the recap-style Excel exports. */

export const CURRENCY_FORMAT = '"Rp" #,##0';

const HEADER_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF9BC2E6' },
};
const TOTAL_FILL: exceljs.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDDEBF7' },
};
const BORDER: Partial<exceljs.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

/** Two centered, merged title rows (title + institution) spanning columns 1..lastCol. */
export function addSheetTitle(sheet: exceljs.Worksheet, title: string, lastCol: number) {
  const lines = [title, 'POLITEKNIK PERKAPALAN NEGERI SURABAYA'];
  lines.forEach((text, i) => {
    sheet.mergeCells(i + 1, 1, i + 1, lastCol);
    const cell = sheet.getCell(i + 1, 1);
    cell.value = text;
    cell.font = { bold: true, size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

/** Bold "label : value" line starting at column 1 (label) and column `valueCol`. */
export function writeLabelValue(
  sheet: exceljs.Worksheet,
  rowNumber: number,
  label: string,
  value: string | number,
  valueCol = 2,
  valueFormat?: string,
) {
  const labelCell = sheet.getCell(rowNumber, 1);
  labelCell.value = label;
  labelCell.font = { bold: true };
  const valueCell = sheet.getCell(rowNumber, valueCol);
  valueCell.value = value;
  valueCell.font = { bold: true };
  if (valueFormat) valueCell.numFmt = valueFormat;
}

export function writeSectionTitle(sheet: exceljs.Worksheet, rowNumber: number, title: string) {
  const cell = sheet.getCell(rowNumber, 1);
  cell.value = title;
  cell.font = { bold: true, size: 11 };
}

export function writeHeaderRow(sheet: exceljs.Worksheet, rowNumber: number, labels: string[]) {
  labels.forEach((label, i) => {
    const cell = sheet.getCell(rowNumber, i + 1);
    cell.value = label;
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });
}

/** Bordered data row; column 1 is centered, `currencyCols` (1-based) get the Rupiah format. */
export function writeDataRow(
  sheet: exceljs.Worksheet,
  rowNumber: number,
  values: (string | number)[],
  currencyCols: number[] = [],
) {
  values.forEach((value, i) => {
    const cell = sheet.getCell(rowNumber, i + 1);
    cell.value = value;
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (i === 0) cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (currencyCols.includes(i + 1)) cell.numFmt = CURRENCY_FORMAT;
  });
}

/**
 * Writes a bold total row: `label` in a merged cell spanning columns 1..(lastCol - totals.length),
 * the totals up to `lastCol`, and blank bordered cells up to `tableWidth`.
 * `totalFormats` overrides the number format per total (default: Rupiah).
 */
export function writeTotalRow(
  sheet: exceljs.Worksheet,
  rowNumber: number,
  label: string,
  lastCol: number,
  totals: number[],
  tableWidth = lastCol,
  totalFormats: (string | undefined)[] = [],
) {
  const firstTotalCol = lastCol - totals.length + 1;
  if (firstTotalCol - 1 > 1) sheet.mergeCells(rowNumber, 1, rowNumber, firstTotalCol - 1);
  sheet.getCell(rowNumber, 1).value = label;
  sheet.getCell(rowNumber, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  totals.forEach((total, i) => {
    const cell = sheet.getCell(rowNumber, firstTotalCol + i);
    cell.value = total;
    const format = i in totalFormats ? totalFormats[i] : CURRENCY_FORMAT;
    if (format) cell.numFmt = format;
  });
  for (let c = 1; c <= tableWidth; c++) {
    const cell = sheet.getCell(rowNumber, c);
    cell.font = { bold: true };
    cell.fill = TOTAL_FILL;
    cell.border = BORDER;
  }
}

/** Excel sheet names: max 31 chars, no []:*?/\ and unique (case-insensitive) within `used`. */
export function uniqueSheetName(name: string, used: Set<string>): string {
  const base = (
    name
      .replace(/[[\]:*?/\\]/g, ' ')
      .replace(/^'+|'+$/g, '')
      .trim() || 'Unit'
  ).slice(0, 31);
  let candidate = base;
  for (let i = 2; used.has(candidate.toLowerCase()); i++) {
    const suffix = ` (${i})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
