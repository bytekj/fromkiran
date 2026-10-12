-- Letters (feedback) sent from the essay pages. Private: never shown on the site.
CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  essay_slug TEXT NOT NULL,
  essay_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  reaction TEXT,
  ip_hash TEXT,
  email_sent INTEGER NOT NULL DEFAULT 0,
  publish_ok INTEGER NOT NULL DEFAULT 0 -- reserved: 1 if you later choose to show a letter
);
CREATE INDEX IF NOT EXISTS idx_letters_created ON letters(created_at);
CREATE INDEX IF NOT EXISTS idx_letters_iphash ON letters(ip_hash, created_at);
