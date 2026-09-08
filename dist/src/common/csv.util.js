"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCsv = buildCsv;
function buildCsv(rows) {
    const escape = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
    return rows.map((row) => row.map(escape).join(',')).join('\r\n');
}
//# sourceMappingURL=csv.util.js.map