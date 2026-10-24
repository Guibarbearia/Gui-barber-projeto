export function normalizeBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  return '';
}
