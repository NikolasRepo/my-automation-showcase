import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.inspection import Inspection, ProductionLine, Station, ChecklistItem
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f'Total users in database: {len(users)}')
        for u in users:
            print(f'  {u.full_name} | {u.role} | {u.email}')

asyncio.run(check())