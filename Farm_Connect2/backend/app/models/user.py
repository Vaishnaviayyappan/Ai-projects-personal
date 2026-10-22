from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    DEALER = "dealer"
    EXPERT = "expert"
    ADMIN = "admin"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.FARMER)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)

    profile = relationship("FarmerProfile", back_populates="user", uselist=False)

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True)
    location = Column(String)  # e.g. "Sangrur, Punjab"
    land_size = Column(String) # e.g. "5 Acres"
    primary_crops = Column(String) # Comma separated, e.g. "Wheat, Rice"
    soil_type = Column(String) # e.g. "Alluvial"
    irrigation_source = Column(String) # e.g. "Tubewell"

    user = relationship("User", back_populates="profile")
