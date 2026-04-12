-- ============================================================
-- KLU SPARKZ EventFlow Pro — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'Student' CHECK (role IN ('Student', 'Admin', 'SuperAdmin')),
  approved      BOOLEAN DEFAULT FALSE,
  department    TEXT,
  year          TEXT,
  gender        TEXT,
  dob           DATE,
  bio           TEXT,
  address       TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SCHOOLS (Faculties/Schools of the university) ───────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  color       TEXT DEFAULT '#dc2a3a',
  icon        TEXT DEFAULT 'bi-building',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id  UUID REFERENCES schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT,
  school_id         UUID REFERENCES schools(id) ON DELETE SET NULL,
  department        TEXT,
  category          TEXT DEFAULT 'Cultural',
  date              TIMESTAMPTZ NOT NULL,
  deadline          TIMESTAMPTZ,
  venue             TEXT,
  max_participants  INT DEFAULT 100,
  registered_count  INT DEFAULT 0,
  fee               NUMERIC(10,2) DEFAULT 0,
  prize             TEXT,
  coordinator_name  TEXT,
  coordinator_phone TEXT,
  rules             TEXT,
  banner_url        TEXT,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REGISTRATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_status   TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Free', 'Refunded')),
  payment_mode     TEXT,
  amount           NUMERIC(10,2) DEFAULT 0,
  transaction_id   TEXT,
  attendance_marked BOOLEAN DEFAULT FALSE,
  team_name        TEXT,
  team_members     JSONB,
  registered_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger', 'admin_approval')),
  read       BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADERBOARD ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  position    INT NOT NULL,
  points      INT DEFAULT 0,
  prize_won   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED: DEFAULT SCHOOLS ────────────────────────────────────────────────────
INSERT INTO schools (name, short_name, color, icon, description) VALUES
  ('School of Engineering', 'SOE', '#3b6eff', 'bi-cpu', 'Engineering & Technology programs'),
  ('School of Science', 'SOS', '#14b8a6', 'bi-flask', 'Pure & Applied Sciences'),
  ('School of Management', 'SOM', '#ffd700', 'bi-briefcase', 'Business & Management studies'),
  ('School of Arts', 'SOA', '#f43f5e', 'bi-palette', 'Arts, Humanities & Social Sciences')
ON CONFLICT DO NOTHING;

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Allow public read for schools and departments
CREATE POLICY "Schools are viewable by all" ON schools FOR SELECT USING (true);
CREATE POLICY "Departments are viewable by all" ON departments FOR SELECT USING (true);

-- Events: anyone can view active events
CREATE POLICY "Active events are viewable by all" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);

-- Users: can only read/update own profile (admins can read all)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Registrations
CREATE POLICY "Students can view own registrations" ON registrations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can view all registrations" ON registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);
CREATE POLICY "Students can create registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard: public read
CREATE POLICY "Leaderboard is viewable by all" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Admins can manage leaderboard" ON leaderboard FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'SuperAdmin'))
);
