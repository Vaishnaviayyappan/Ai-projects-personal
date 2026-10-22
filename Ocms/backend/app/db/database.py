import json
import os
import asyncio
from datetime import datetime
from bson import ObjectId

class MockCursor:
    def __init__(self, data):
        self.data = data
    async def to_list(self, length):
        return self.data[:length]

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.store = []
        self._load()

    def _file_path(self):
        return os.path.join(os.getcwd(), f"{self.name}.json")

    def _load(self):
        if os.path.exists(self._file_path()):
            try:
                with open(self._file_path(), "r") as f:
                    self.store = json.load(f)
            except Exception:
                self.store = []

    def _save(self):
        with open(self._file_path(), "w") as f:
            json.dump(self.store, f, default=str)

    async def insert_one(self, doc):
        doc["_id"] = str(ObjectId())
        self.store.append(doc)
        self._save()
        class Result:
            inserted_id = doc["_id"]
        return Result()

    async def find_one(self, query):
        _id = str(query.get("_id", ""))
        for d in self.store:
            if str(d.get("_id")) == _id:
                return d
        return None

    def find(self, query=None):
        return MockCursor(self.store)

    async def count_documents(self, query):
        if "priority" in query:
            return sum(1 for d in self.store if d.get("priority") == query["priority"])
        if "status" in query:
            status = query["status"]
            return sum(1 for d in self.store if d.get("status") in (status.get("$in", []) if isinstance(status, dict) else [status]))
        return len(self.store)

    def aggregate(self, pipeline):
        categories = {}
        for d in self.store:
            cat = d.get("ai_category", "General")
            categories[cat] = categories.get(cat, 0) + 1
        res = [{"_id": k, "count": v} for k, v in categories.items()]
        return MockCursor(res)

    async def update_one(self, query, update):
        _id = str(query.get("_id", ""))
        set_ops = update.get("$set", {})
        count = 0
        for d in self.store:
            if str(d.get("_id")) == _id:
                for k, v in set_ops.items():
                    d[k] = v
                count = 1
                break
        self._save()
        class Result:
            modified_count = count
        return Result()

class MockClient:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection("complaints_db")
        return self.collections[name]

db_client = MockClient()

async def connect_to_mongo():
    pass

async def close_mongo_connection():
    pass

def get_db():
    return db_client
