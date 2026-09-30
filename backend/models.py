import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class Request(Base):
    __tablename__ = 'requests'
    id = Column(String, primary_key=True)
    timestamp = Column(String)
    channel = Column(String)
    language = Column(String)
    transcript_original = Column(Text)
    english_summary = Column(Text)
    sector = Column(String)
    specific_need = Column(String)
    severity = Column(Integer)
    sentiment = Column(String)
    affected_population_estimate = Column(Integer)
    location_text = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    district = Column(String)
    state = Column(String)
    cluster_id = Column(Integer, default=-1)

class PriorityScore(Base):
    __tablename__ = 'priority_scores'
    id = Column(Integer, primary_key=True, autoincrement=True)
    district = Column(String)
    sector = Column(String)
    score = Column(Float)
    demand_intensity = Column(Float)
    infra_deficit = Column(Float)
    vulnerability = Column(Float)
    allocation_coverage = Column(Float)
    matching_scheme = Column(String)
    evidence_quotes = Column(Text, default="[]")

class ClusterInfo(Base):
    __tablename__ = 'clusters'
    id = Column(Integer, primary_key=True)
    sector = Column(String)
    district = Column(String)
    size = Column(Integer)
    description = Column(String)
    lat = Column(Float)
    lng = Column(Float)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, unique=True, nullable=True)
    role = Column(String, nullable=False) # 'policymaker' or 'citizen'
    password_hash = Column(String, nullable=True)
    created_at = Column(String)

class CachedRecommendation(Base):
    __tablename__ = 'recommendations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    sector = Column(String)
    district = Column(String)
    priority = Column(String)
    estimated_impact = Column(String)
    matching_scheme = Column(String)
    created_at = Column(String)

# Determine DB_PATH relative to this file or from env
DB_PATH = os.environ.get("DB_PATH")
if not DB_PATH:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(base_dir, "jansetu.sqlite")

engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base.metadata.create_all(engine)
