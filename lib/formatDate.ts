export function parseDateString(dateStr: string | Date | undefined | null): Date | null {
  if (!dateStr) return null;
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  
  let formattedStr = dateStr;
  // タイムゾーン情報（Z または +09:00 のような形式）が含まれていない場合はUTCとして扱う
  if (!formattedStr.includes('Z') && !formattedStr.includes('+')) {
    formattedStr = formattedStr.replace(' ', 'T');
    if (!formattedStr.endsWith('Z')) {
      formattedStr += 'Z';
    }
  }
  
  const date = new Date(formattedStr);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  const date = parseDateString(dateStr);
  if (!date) return '';
  
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}
