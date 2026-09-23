const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function getUtcDayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getRemainingDays(dueDate: string, today = new Date()): number | null {
  const match = DATE_PATTERN.exec(dueDate);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const todayDayNumber = getUtcDayNumber(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );
  const dueDayNumber = getUtcDayNumber(year, month, day);
  return dueDayNumber - todayDayNumber;
}

export function getDueDateLabel(dueDate: string, today = new Date()): string {
  const remainingDays = getRemainingDays(dueDate, today);

  if (remainingDays === null) {
    return "마감일 오류";
  }

  if (remainingDays < 0) {
    return "마감됨";
  }

  if (remainingDays === 0) {
    return "D-DAY";
  }

  return `D-${remainingDays}`;
}
