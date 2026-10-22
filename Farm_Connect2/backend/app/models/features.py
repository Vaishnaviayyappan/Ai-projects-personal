from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class MarketItem(Base):
    __tablename__ = "market_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(String)  # e.g. "₹2,200/qt"
    buyer = Column(String)
    distance = Column(String)
    tags = Column(String)  # Comma separated tags
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # ForeignKey("user.id") - loosely coupled for now or straightforward
    item_id = Column(Integer, ForeignKey("market_items.id"))
    quantity = Column(Integer, default=1)
    
    item = relationship("MarketItem")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    total_amount = Column(String)
    status = Column(String, default="pending") # pending, completed, cancelled
    items_summary = Column(String) # JSON string or simple text summary
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    benefit = Column(String)
    type = Column(String)
    link = Column(String, nullable=True) # Portal link
    application_process = Column(String) # Detailed process description



class WeatherLog(Base):
    __tablename__ = "weather_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    temp = Column(String)
    condition = Column(String)
    location = Column(String)
    humidity = Column(String)
    wind = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Tutorial(Base):
    __tablename__ = "tutorials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    duration = Column(String)
    views = Column(String)
    category = Column(String)
    image_url = Column(String)
    video_url = Column(String)
    external_source_url = Column(String) # For specific Youtube or other external links if different from video_url

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    author_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    comments = relationship("ForumComment", back_populates="post")

class ForumComment(Base):
    __tablename__ = "forum_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"))
    content = Column(String)
    author_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    post = relationship("ForumPost", back_populates="comments")

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String)
    issue_detected = Column(String)
    confidence = Column(Float)
    solution = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    specialization = Column(String) # e.g. "Soil Scientist", "Veterinarian"
    qualification = Column(String) # e.g. "PhD in Agriculture"
    experience = Column(String) # e.g. "10 years"
    rating = Column(Float, default=5.0)
    image_url = Column(String)
    is_online = Column(Boolean, default=True)


