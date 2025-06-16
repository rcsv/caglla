

CREATE TABLE users (
  id        SERIAL NOT NULL PRIMARY KEY,  -- Bubble の internal ID（UUID相当）

  google_id VARCHAR(255) UNIQUE,        -- Google OAuth ID（nullでも許容可）
  email     VARCHAR(255) UNIQUE,            -- Email アドレス（任意ログイン対応用）
  preferred_currency VARCHAR(10),       -- 通貨（例: "JPY"）

  skip_confirm_delete TINYINT(1) DEFAULT 0,  -- チェックボックス系の内部設定

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
