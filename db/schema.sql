-- Online sessions: только интервалы когда пользователь был в сети
CREATE TABLE IF NOT EXISTS online_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_start TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,  -- последний раз когда видели онлайн
  session_end TIMESTAMP,  -- NULL если сессия активна
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_online_sessions_start ON online_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_online_sessions_end ON online_sessions(session_end);
