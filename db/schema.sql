-- Status checks table: raw polling data
CREATE TABLE IF NOT EXISTS status_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('online', 'offline')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_checks_checked_at ON status_checks(checked_at);

-- Online sessions table: aggregated intervals
CREATE TABLE IF NOT EXISTS online_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_online_sessions_start ON online_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_online_sessions_end ON online_sessions(session_end);
