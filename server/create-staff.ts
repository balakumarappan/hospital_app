import bcrypt from 'bcryptjs';
import { db } from './db.ts';
const [,,username,name,role]=process.argv;
const password=process.env.STAFF_PASSWORD;
if(!username || !name || !['admin','reception'].includes(role) || !password || password.length<12){console.error('Set STAFF_PASSWORD (at least 12 characters), then: npm run staff:create -- USERNAME "Full Name" admin|reception');process.exit(1);}
const hash=await bcrypt.hash(password,12);
await db.query('INSERT INTO staff(username,name,role,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO UPDATE SET name=$2,role=$3,password_hash=$4,active=true',[username,name,role,hash]);
console.log('Staff login created');await db.end();
