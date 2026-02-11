import * as XLSX from "xlsx";

/**
 * Download an array of objects as an Excel (.xlsx) file.
 * @param data   Array of row objects (key→value)
 * @param columns  Optional ordered list of { header, key } to control column order and labels.
 *                 If omitted, all keys from the first row are used.
 * @param filename  File name without extension (default "export")
 */
export function downloadExcel(
  data: Record<string, unknown>[],
  columns?: { header: string; key: string }[],
  filename = "export"
) {
  if (data.length === 0) return;

  let sheetData: Record<string, unknown>[];

  if (columns) {
    // Map data to ordered/renamed columns
    sheetData = data.map((row) => {
      const mapped: Record<string, unknown> = {};
      columns.forEach(({ header, key }) => {
        mapped[header] = row[key] ?? "";
      });
      return mapped;
    });
  } else {
    sheetData = data;
  }

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
