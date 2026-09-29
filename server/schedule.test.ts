import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { slots, visits, type Doctor } from './schedule.ts';
const d: Doctor = {pattern:'weekly',weekdays:[2],month_day:null,start_time:'10:00',end_time:'11:00',slot_minutes:20,capacity:1,active:true};
test('weekly and monthly patterns expose only intended days', () => {
  assert.equal(visits(d,'2026-09-29'),true);
  assert.equal(visits(d,'2026-09-30'),false);
  assert.equal(visits({...d,pattern:'monthly',month_day:15},'2026-10-15'),true);
  assert.equal(visits({...d,pattern:'monthly',month_day:15},'2026-10-16'),false);
});
test('slots do not exceed consultation hours', () => assert.deepEqual(slots(d),['10:00','10:20','10:40']));
