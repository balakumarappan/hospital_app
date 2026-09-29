import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { db } from './db.ts';
const local=fileURLToPath(new URL('./schema.sql',import.meta.url));
const path=existsSync(local)?local:join(process.cwd(),'server/schema.sql');
await db.query(readFileSync(path,'utf8'));
console.log('Database schema ready');
await db.end();
