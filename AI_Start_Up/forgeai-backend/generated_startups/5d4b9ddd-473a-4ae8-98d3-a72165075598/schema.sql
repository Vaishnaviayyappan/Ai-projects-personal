
-- Table: categories
CREATE TABLE public.categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: services
CREATE TABLE public.services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES public.categories(category_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: conversations
CREATE TABLE public.conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    service_id INTEGER NOT NULL REFERENCES public.services(service_id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: intents
CREATE TABLE public.intents (
    intent_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: intent_conversations
CREATE TABLE public.intent_conversations (
    conversation_id INTEGER NOT NULL REFERENCES public.conversations(conversation_id),
    intent_id INTEGER NOT NULL REFERENCES public.intents(intent_id),
    PRIMARY KEY (conversation_id, intent_id)
);

-- Table: entities
CREATE TABLE public.entities (
    entity_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: entity_conversations
CREATE TABLE public.entity_conversations (
    conversation_id INTEGER NOT NULL REFERENCES public.conversations(conversation_id),
    entity_id INTEGER NOT NULL REFERENCES public.entities(entity_id),
    PRIMARY KEY (conversation_id, entity_id)
);
