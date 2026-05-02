import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.inspection import Inspection, ProductionLine, Station, ChecklistItem
from sqlalchemy import select

async def reset():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == UserRole.admin)
        )
        admins = result.scalars().all()
        for admin in admins:
            admin.hashed_password = hash_password("ChangeThisPassword123")
            print(f"Reset password for: {admin.full_name} | {admin.email}")
        await db.commit()
        print("Done.")

asyncio.run(reset())