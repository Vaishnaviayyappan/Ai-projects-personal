
-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    student_id VARCHAR(20)
);

-- Table: meals
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    carbs INTEGER NOT NULL
);

-- Table: meal_plans
CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: meal_plans_meals
CREATE TABLE meal_plans_meals (
    meal_plan_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    PRIMARY KEY (meal_plan_id, meal_id),
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id),
    FOREIGN KEY (meal_id) REFERENCES meals(id)
);

-- Table: preferences
CREATE TABLE preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    dairy_free BOOLEAN NOT NULL,
    gluten_free BOOLEAN NOT NULL,
    vegan BOOLEAN NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: ingredient
CREATE TABLE ingredient (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Table: recipes
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(id)
);

-- Table: meal_plans_recipes
CREATE TABLE meal_plans_recipes (
    meal_plan_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    PRIMARY KEY (meal_plan_id, recipe_id),
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Table: ratings
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    meal_plan_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id)
);

-- Table: messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);
