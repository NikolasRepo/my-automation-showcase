from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    verify_password, create_access_token, hash_password,
    get_current_user, require_role
)
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, Token
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class OperatorLogin(BaseModel):
    full_name: str


@router.post("/token/operator", response_model=Token)
async def operator_login(
    payload: OperatorLogin,
    db: AsyncSession = Depends(get_db),
):
    """Name-only login for operators — no password required."""
    result = await db.execute(
        select(User).where(
            User.full_name == payload.full_name,
            User.role == UserRole.operator,
            User.is_active == True,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operator name not found",
        )
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/token", response_model=Token)
async def leader_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Username and password login for leaders and admins."""
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    if not user or user.role == UserRole.operator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin, UserRole.leader)),
):
    # Leaders and admins must have a username
    if payload.role in (UserRole.leader, UserRole.admin):
        if not payload.username:
            raise HTTPException(
                status_code=400,
                detail="Username is required for leader and admin accounts",
            )

    # Check for duplicate username if provided
    if payload.username:
        existing = await db.execute(select(User).where(User.username == payload.username))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")

    # Check for duplicate email if provided
    if payload.email:
        existing = await db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

    # Check for duplicate operator name
    if payload.role == UserRole.operator:
        existing_name = await db.execute(
            select(User).where(
                User.full_name == payload.full_name,
                User.role == UserRole.operator,
            )
        )
        if existing_name.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="An operator with this name already exists",
            )

    user = User(
        full_name=payload.full_name,
        username=payload.username or None,
        email=payload.email or None,
        hashed_password=hash_password(payload.password) if payload.password else "",
        role=payload.role,
    )
    db.add(user)
    await db.flush()
    return user


@router.get("/users/operators", response_model=list[UserOut])
async def list_operators(
    db: AsyncSession = Depends(get_db),
):
    """Returns all active operator accounts — used by the operator login page. Public endpoint."""
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.operator, User.is_active == True)
        .order_by(User.full_name)
    )
    return result.scalars().all()


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin, UserRole.leader)),
):
    result = await db.execute(select(User).order_by(User.role, User.full_name))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "full_name" in payload and payload["full_name"]:
        user.full_name = payload["full_name"]
    if "username" in payload:
        user.username = payload["username"] or None
    if "email" in payload:
        user.email = payload["email"] or None
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/password", response_model=UserOut)
async def reset_password(
    user_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not payload.get("password"):
        raise HTTPException(status_code=400, detail="Password is required")
    user.hashed_password = hash_password(payload["password"])
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    await db.delete(user)
    await db.commit()
