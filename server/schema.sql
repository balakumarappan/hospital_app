CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SEQUENCE IF NOT EXISTS uhid_seq START 10001;
CREATE SEQUENCE IF NOT EXISTS appointment_seq START 10001;

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid text NOT NULL UNIQUE,
  full_name text NOT NULL,
  dob date,
  age_years smallint,
  sex text NOT NULL CHECK (sex IN ('Female','Male','Other','Prefer not to say')),
  village text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (dob IS NOT NULL OR age_years IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS patient_phones (
  patient_id uuid NOT NULL REFERENCES patients(id),
  mobile text NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id,mobile)
);
CREATE INDEX IF NOT EXISTS patient_phones_mobile_idx ON patient_phones(mobile);
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','reception')),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  specialty text NOT NULL,
  pattern text NOT NULL CHECK (pattern IN ('daily','weekly','monthly')),
  weekdays integer[] NOT NULL DEFAULT '{}',
  month_day smallint,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_minutes smallint NOT NULL CHECK (slot_minutes BETWEEN 5 AND 120),
  capacity smallint NOT NULL CHECK (capacity BETWEEN 1 AND 50),
  active boolean NOT NULL DEFAULT true,
  CHECK (end_time > start_time)
);
CREATE TABLE IF NOT EXISTS doctor_leave (
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  on_date date NOT NULL,
  reason text,
  PRIMARY KEY (doctor_id,on_date)
);
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  on_date date NOT NULL,
  at_time time NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','cancelled')),
  booked_by uuid REFERENCES staff(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_slot_idx ON appointments(doctor_id,on_date,at_time) WHERE status='booked';
CREATE TABLE IF NOT EXISTS otp_challenges (
  mobile text PRIMARY KEY,
  code_hash text NOT NULL,
  attempts smallint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now()
);
