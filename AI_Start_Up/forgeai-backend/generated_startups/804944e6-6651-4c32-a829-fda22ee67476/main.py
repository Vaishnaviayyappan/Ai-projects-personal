
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import random
import datetime

app = FastAPI()

class MealPlan(BaseModel):
    name: str
    date: str
    breakfast: str
    lunch: str
    dinner: str
    snacks: List[str]

class User(BaseModel):
    id: int
    name: str
    email: str

class MealPlanRequest(BaseModel):
    name: str
    date: str
    breakfast: str
    lunch: str
    dinner: str
    snacks: List[str]

class UserRequest(BaseModel):
    name: str
    email: str

@app.post("/users/")
async def create_user(user: UserRequest):
    user_dict = user.dict()
    user_dict["id"] = len(users) + 1
    users.append(user_dict)
    return {"message": "User created successfully"}

@app.get("/users/")
async def get_users():
    return users

@app.post("/meal-plans/")
async def create_meal_plan(meal_plan: MealPlanRequest):
    meal_plan_dict = meal_plan.dict()
    meal_plan_dict["date"] = datetime.date.today().strftime("%Y-%m-%d")
    if "id" in meal_plan_dict:
        for user in users:
            if user["id"] == meal_plan_dict["id"]:
                user["meal_plan"] = meal_plan_dict
                return {"message": "Meal plan added successfully"}
    else:
        raise HTTPException(status_code=400, detail="Please provide user id")
    return {"message": "Meal plan added successfully"}

@app.get("/meal-plans/")
async def get_meal_plans():
    return meal_plans

@app.put("/meal-plans/{meal_plan_id}")
async def update_meal_plan(meal_plan_id: int, meal_plan: MealPlanRequest):
    meal_plan_dict = meal_plan.dict()
    meal_plan_dict["date"] = datetime.date.today().strftime("%Y-%m-%d")
    if "id" in meal_plan_dict:
        for user in users:
            if user["id"] == meal_plan_dict["id"]:
                user["meal_plan"] = meal_plan_dict
                return {"message": "Meal plan updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="Please provide user id")
    return {"message": "Meal plan updated successfully"}

@app.delete("/meal-plans/{meal_plan_id}")
async def delete_meal_plan(meal_plan_id: int):
    if "id" in meal_plans[meal_plan_id]:
        for user in users:
            if user["id"] == meal_plans[meal_plan_id]["id"]:
                user["meal_plan"] = None
                return {"message": "Meal plan deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Meal plan not found")
    return {"message": "Meal plan deleted successfully"}

users = []
meal_plans = []

# Generate random meal plan data
for _ in range(10):
    meal_plan = MealPlan(
        name="Breakfast",
        date=datetime.date.today().strftime("%Y-%m-%d"),
        breakfast="Eggs and toast",
        lunch="Chicken sandwich",
        dinner="Beef burger",
        snacks=["Apple slices", "Carrot sticks"]
    )
    meal_plans.append(meal_plan.__dict__)

# Get all meal plans
@app.get("/meal-plans/")
async def get_all_meal_plans():
    return meal_plans

This is a basic implementation of a meal planning API using FastAPI and Pydantic models. It allows users to create, read, update, and delete meal plans. The meal plans are stored in memory for simplicity, but in a real-world application, you would likely use a database to store the data.