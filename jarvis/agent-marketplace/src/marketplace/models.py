import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Column
import sqlalchemy as sa
import json


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ── JSON helpers for SQLite ─────────────────────────────────────

class JSONList(sa.TypeDecorator):
    impl = sa.Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else "[]"

    def process_result_value(self, value, dialect):
        return json.loads(value) if value else []


class JSONDict(sa.TypeDecorator):
    impl = sa.Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else "{}"

    def process_result_value(self, value, dialect):
        return json.loads(value) if value else {}


# ── User ────────────────────────────────────────────────────────

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=new_id, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


# ── Agent Profile ───────────────────────────────────────────────

class AgentProfile(SQLModel, table=True):
    __tablename__ = "agent_profiles"

    id: str = Field(default_factory=new_id, primary_key=True)
    owner_id: str = Field(foreign_key="users.id", index=True)
    name: str
    slug: str = Field(unique=True, index=True)
    tagline: Optional[str] = None
    description: str = ""
    avatar_url: Optional[str] = None
    category: str = "other"
    tags: list = Field(default=[], sa_column=Column(JSONList))
    capabilities: list = Field(default=[], sa_column=Column(JSONList))
    pricing_model: Optional[str] = None
    pricing_details: dict = Field(default={}, sa_column=Column(JSONDict))
    demo_url: Optional[str] = None
    source_url: Optional[str] = None
    api_endpoint: Optional[str] = None
    portfolio: list = Field(default=[], sa_column=Column(JSONList))
    total_hires: int = 0
    avg_rating: Optional[float] = None
    response_time_hours: Optional[float] = None
    tasks_completed: int = 0
    total_earned_cents: int = 0
    is_docked: bool = True
    is_featured: bool = False
    dock_date: datetime = Field(default_factory=utcnow)
    status: str = "active"
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


# ── Conversation ────────────────────────────────────────────────

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: str = Field(default_factory=new_id, primary_key=True)
    agent_profile_id: str = Field(foreign_key="agent_profiles.id", index=True)
    initiator_id: str = Field(foreign_key="users.id", index=True)
    owner_id: str = Field(foreign_key="users.id", index=True)
    subject: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_read_by_owner: bool = False
    is_read_by_initiator: bool = True
    created_at: datetime = Field(default_factory=utcnow)


# ── Message ─────────────────────────────────────────────────────

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(default_factory=new_id, primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    sender_id: str = Field(foreign_key="users.id")
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=utcnow)
