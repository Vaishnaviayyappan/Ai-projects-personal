
-- create database for voice_first_ai
CREATE DATABASE voice_first_ai;

-- connect to the database
\c voice_first_ai

-- create schema for users and their preferences
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    preferred_language VARCHAR(10)
);

CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    voice_call_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_voice_support_enabled BOOLEAN DEFAULT TRUE,
    form_filling_enabled BOOLEAN DEFAULT TRUE,
    navigation_enabled BOOLEAN DEFAULT TRUE
);

-- create schema for phone calls
CREATE TABLE phone_calls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    call_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration INTEGER,
    status VARCHAR(10) CHECK(status IN ('pending', 'connected', 'disconnected'))
);

CREATE TABLE call_records (
    id SERIAL PRIMARY KEY,
    phone_call_id INTEGER NOT NULL REFERENCES phone_calls(id),
    conversation_text TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- create schema for WhatsApp voice support
CREATE TABLE whatsapp_voice_support (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    voice_message_id INTEGER,
    message_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- create schema for form filling
CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    form_name VARCHAR(255) NOT NULL,
    form_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id),
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_submitted BOOLEAN DEFAULT FALSE
);

-- create schema for voice navigation
CREATE TABLE location_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
