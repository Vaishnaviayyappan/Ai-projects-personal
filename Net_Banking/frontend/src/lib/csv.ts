export interface StatementRow {
  txn_ref: string;
  date: string;
  type: string;
  counterparty: string;
  remarks: string;
  amount: number;
  balance_after: number;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function parseStatementCsv(csvText: string): StatementRow[] {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1);

  return dataLines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [txnRef, date, type, counterparty, remarks, amount, balanceAfter] = parseCsvLine(line);
      return {
        txn_ref: txnRef ?? '',
        date: date ?? '',
        type: type ?? '',
        counterparty: counterparty ?? '',
        remarks: remarks ?? '',
        amount: Number(amount ?? 0),
        balance_after: Number(balanceAfter ?? 0),
      };
    });
}
