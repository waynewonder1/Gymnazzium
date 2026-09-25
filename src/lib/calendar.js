// Builds an .ics calendar file of upcoming workouts, each with a reminder alarm.
// Importing it into Google Calendar / Apple Calendar / Outlook gives phone reminders
// even when the website isn't open.
import { getDay, todayIndex, totalDays } from './plan';

const pad = (n) => String(n).padStart(2, '0');
const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// The .ics spec limits lines to 75 bytes; longer ones continue on a line starting with a space.
const fold = (line) => line.match(/.{1,60}/gu).join('\r\n ');

function stamp(date, time) {
  const [h, m] = time.split(':').map(Number);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(h)}${pad(m)}00`;
}

export function buildCalendar(profile) {
  const time = profile.workoutTime || '06:30';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gymnazzium//Plan//EN', 'CALSCALE:GREGORIAN'];
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;

  for (let i = Math.max(0, todayIndex(profile)); i < totalDays(profile); i++) {
    const day = getDay(profile, i);
    if (day.type !== 'train') continue;
    const [h, m] = time.split(':').map(Number);
    const end = new Date(day.date);
    end.setHours(h, m + day.minutes);
    const description = [day.focus, '', ...day.items.map((it) => `• ${it.name}: ${it.dose}`), '', `Mission: ${day.mission}`].join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:gymnazzium-${profile.startDate}-${i}@gymnazzium`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(day.date, time)}`,
      `DTEND:${stamp(end, `${end.getHours()}:${end.getMinutes()}`)}`,
      `SUMMARY:${escape(`Gymnazzium · ${day.title}`)}`,
      `DESCRIPTION:${escape(description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(`${day.title} in 15 minutes`)}`,
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

export function downloadCalendar(profile) {
  const blob = new Blob([buildCalendar(profile)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gymnazzium-plan.ics';
  a.click();
  URL.revokeObjectURL(url);
}
