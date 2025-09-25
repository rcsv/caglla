-- Reset all tables
DROP TABLE IF EXISTS itineraries;
DROP TABLE IF EXISTS days;
DROP TABLE IF EXISTS trip_user;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS places;

-- Create users table
CREATE TABLE users (
    google_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    preferred_currency VARCHAR(10) DEFAULT 'JPY',
    skip_confirm_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create trips table
CREATE TABLE trips (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(255),
    start_date DATE,
    end_date DATE,
    access_level ENUM('private', 'public') DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE
);

-- Create days table
CREATE TABLE days (
    id VARCHAR(255) PRIMARY KEY,
    trip_id VARCHAR(255) NOT NULL,
    day_number INT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Create itineraries table
CREATE TABLE itineraries (
    id VARCHAR(255) PRIMARY KEY,
    day_id VARCHAR(255) NOT NULL,
    sort_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
);

-- Create trip_user table (HABTM relationship)
CREATE TABLE trip_user (
    trip_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trip_id, user_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE
);

-- Create places table (for autocomplete)
CREATE TABLE places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_place_id VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    main_text VARCHAR(255) NOT NULL,
    secondary_text VARCHAR(255),
    types JSON,
    matched_substrings JSON,
    formatted_address VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    name VARCHAR(255),
    rating DECIMAL(2,1),
    international_phone_number VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
