// Minimal CSV builder — good enough for indicator/value tables, avoids
// pulling in a full CSV library for something this simple. Quotes every
// field and escapes embedded quotes per RFC 4180, since indicator labels
// contain commas (e.g. "# of clients started on PrEP").
export function buildCsv(rows: (string | number)[][]): string {
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(',')).join('\r\n');
}
