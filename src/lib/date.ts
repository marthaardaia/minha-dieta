export function getLocalizedToday() {
  const tzString = new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' });
  const localDate = new Date(tzString);
  
  const todayStr = localDate.toLocaleDateString('en-CA'); // 'yyyy-MM-dd'
  const dayOfWeek = localDate.getDay();
  
  return { todayStr, dayOfWeek };
}
