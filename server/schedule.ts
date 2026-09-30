export type Doctor = { pattern: 'daily' | 'weekly' | 'monthly'; weekdays: number[]; month_day: number | null; start_time: string; end_time: string; slot_minutes: number; capacity: number; active: boolean };

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function todayIndia(now=new Date()): string { return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function futureSlot(date:string,time:string,now=new Date()):boolean {
  const today=todayIndia(now);
  if(date>today)return true;
  if(date<today)return false;
  const current=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  return time>current;
}
export function visits(d: Doctor, date: string): boolean {
  if (!d.active || !validDate(date)) return false;
  const dt = new Date(date + 'T12:00:00Z');
  return d.pattern === 'daily' || d.pattern === 'weekly' && d.weekdays.includes(dt.getUTCDay()) || d.pattern === 'monthly' && d.month_day === dt.getUTCDate();
}
function minutes(time: string): number { const [h,m] = time.slice(0,5).split(':').map(Number); return h*60+m; }
export function slots(d: Doctor): string[] {
  const out: string[] = [];
  for (let i=minutes(d.start_time); i + d.slot_minutes <= minutes(d.end_time); i += d.slot_minutes) out.push(`${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}`);
  return out;
}
export function withinWindow(date: string): boolean {
  if (!validDate(date)) return false;
  const days = (Date.parse(date+'T12:00:00Z') - Date.parse(todayIndia()+'T12:00:00Z')) / 86400000;
  return days >= 0 && days <= 62;
}
