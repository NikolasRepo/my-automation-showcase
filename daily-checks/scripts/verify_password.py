import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import verify_password, hash_password
from app.models.user import User, UserRole
from app.models.inspection import Inspection, ProductionLine, Station, ChecklistItem
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "admin@yourcompany.com")
        )
        admin = result.scalar_one_or_none()
        if not admin:
            print("Admin not found")
            return
        print(f"Admin found: {admin.full_name}")
        print(f"Stored hash: {admin.hashed_password[:30]}...")
        test = verify_password("ChangeThisPassword123", admin.hashed_password)
        print(f"Password 'ChangeThisPassword123' verifies: {test}")

asyncio.run(check())