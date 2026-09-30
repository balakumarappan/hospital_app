import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { db, transaction } from './db.ts';

const adminUsername = process.env.SEED_ADMIN_USERNAME?.trim() || 'velavan.admin';
const production = process.env.NODE_ENV === 'production';
const demoData = !production || process.env.SEED_DEMO_DATA === 'true';

function dateAfter(days: number): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
  }).formatToParts(now);
  const number = (part: string) => Number(parts.find(x => x.type === part)?.value);
  const date = new Date(Date.UTC(number('year'), number('month') - 1, number('day'), 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}
const iso = (date: Date) => date.toISOString().slice(0, 10);
function nextWeekday(day: number): string {
  const date = dateAfter(1);
  while (date.getUTCDay() !== day) date.setUTCDate(date.getUTCDate() + 1);
  return iso(date);
}
function nextMonthDay(day: number): string {
  const date = dateAfter(1);
  if (date.getUTCDate() > day) date.setUTCMonth(date.getUTCMonth() + 1, 1);
  date.setUTCDate(day);
  return iso(date);
}

const existing = await db.query('SELECT id FROM staff WHERE username=$1', [adminUsername]);
if (!existing.rowCount && production && (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD.length < 12)) {
  throw new Error('Set SEED_ADMIN_PASSWORD (at least 12 characters) before creating the production administrator');
}
const password = process.env.SEED_ADMIN_PASSWORD || randomBytes(24).toString('base64url');
if (!existing.rowCount && password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters');
const hash = !existing.rowCount ? await bcrypt.hash(password, 12) : null;

const newAdmin = await transaction(async client => {
  let seededAdmin: { id: string; username: string; password: string } | null = null;
  if (hash) {
    const result = await client.query(
      'INSERT INTO staff(username,name,password_hash,role) VALUES($1,$2,$3,\'admin\') ON CONFLICT(username) DO NOTHING RETURNING id',
      [adminUsername, 'Velavan Hospital Administrator', hash],
    );
    if (result.rowCount) seededAdmin = { id: result.rows[0].id, username: adminUsername, password };
  }

  if (!demoData) return seededAdmin;

  // Stable IDs and references make the seed safe to run repeatedly. ON CONFLICT
  // preserves any edits made to the demonstration records after initial setup.
  const doctors = [
    ['11111111-1111-4111-8111-111111111101', 'Dr Meena Raman', 'General Medicine', 'daily', [], null, '09:00', '12:00', 20, 1],
    ['11111111-1111-4111-8111-111111111102', 'Dr Arun Kumar', 'Paediatrics', 'weekly', [2], null, '10:00', '13:00', 20, 1],
    ['11111111-1111-4111-8111-111111111103', 'Dr Lakshmi Devi', 'Obstetrics', 'monthly', [], 15, '14:00', '17:00', 30, 1],
  ];
  for (const row of doctors) {
    await client.query(
      'INSERT INTO doctors(id,full_name,specialty,pattern,weekdays,month_day,start_time,end_time,slot_minutes,capacity) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING',
      row,
    );
  }

  const patients = [
    ['22222222-2222-4222-8222-222222222201', 'RH-DEMO-0001', 'Kavitha Selvam', '1992-04-10', 'Female', 'Thanjavur', '9000000001'],
    ['22222222-2222-4222-8222-222222222202', 'RH-DEMO-0002', 'Nila Selvam', '2018-08-14', 'Female', 'Thanjavur', '9000000001'],
    ['22222222-2222-4222-8222-222222222203', 'RH-DEMO-0003', 'Ramesh Kumar', '1981-02-05', 'Male', 'Kumbakonam', '9000000002'],
    ['22222222-2222-4222-8222-222222222204', 'RH-DEMO-0004', 'Devi Kumar', '1985-11-20', 'Female', 'Kumbakonam', '9000000002'],
    ['22222222-2222-4222-8222-222222222205', 'RH-DEMO-0005', 'Muthu Vel', '1968-06-08', 'Male', 'Thanjavur', null],
  ];
  for (const [id, uhid, name, dob, sex, village, mobile] of patients) {
    await client.query(
      'INSERT INTO patients(id,uhid,full_name,dob,sex,village) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
      [id, uhid, name, dob, sex, village],
    );
    if (mobile) await client.query(
      'INSERT INTO patient_phones(patient_id,mobile) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [id, mobile],
    );
  }

  const appointments = [
    ['APT-DEMO-0001', patients[0][0], doctors[0][0], iso(dateAfter(1)), '09:20'],
    ['APT-DEMO-0002', patients[1][0], doctors[1][0], nextWeekday(2), '10:40'],
    ['APT-DEMO-0003', patients[3][0], doctors[2][0], nextMonthDay(15), '14:30'],
  ];
  for (const row of appointments) {
    await client.query(
      'INSERT INTO appointments(reference,patient_id,doctor_id,on_date,at_time) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
      row,
    );
  }
  return seededAdmin;
});

console.log(demoData ? 'Velavan Hospital: admin and demonstration records ready.' : 'Velavan Hospital: admin ready; demonstration records skipped.');
if (newAdmin) {
  console.log(`Initial admin username: ${newAdmin.username}`);
  console.log(`Initial admin database ID: ${newAdmin.id}`);
  if (!process.env.SEED_ADMIN_PASSWORD) console.log(`Initial admin password (shown once): ${newAdmin.password}`);
  else console.log('Initial admin password was supplied through SEED_ADMIN_PASSWORD and is not logged.');
} else console.log(`Admin ${adminUsername} already exists; its password was not changed.`);
if (demoData) console.log('Demonstration patient mobiles: 9000000001 (two linked profiles), 9000000002 (two linked profiles). Local OTPs appear in the API terminal.');
await db.end();
