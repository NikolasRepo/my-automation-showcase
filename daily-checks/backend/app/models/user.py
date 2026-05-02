import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class UserRole(str, enum.Enum):
    operator = "operator"
    leader = "leader"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.operator)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    submitted_inspections: Mapped[list["Inspection"]] = relationship(
        "Inspection", foreign_keys="Inspection.operator_id", back_populates="operator"
    )
    reviewed_inspections: Mapped[list["Inspection"]] = relationship(
        "Inspection", foreign_keys="Inspection.supervisor_id", back_populates="supervisor"
    )
    acknowledged_alerts: Mapped[list["Alert"]] = relationship(
        "Alert", foreign_keys="Alert.acknowledged_by", back_populates="acknowledger"
    )
