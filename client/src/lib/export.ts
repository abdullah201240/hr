export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row.map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
