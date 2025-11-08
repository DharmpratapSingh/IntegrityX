#!/usr/bin/env python3
"""
Initialize the database with proper schema.
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import Database

def main():
    # Use DATABASE_URL from environment (PostgreSQL required)
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required. Please set it to your PostgreSQL connection string.")
    
    print(f'Initializing database with: {database_url.split("@")[0].split(":")[0]}...')
    
    # Initialize database - this will call create_all()
    db = Database(db_url=database_url)
    
    print('✅ Database initialized successfully!')
    print(f'Database URL: {database_url}')
    
    # Check table creation
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f'Tables created: {tables}')

if __name__ == '__main__':
    main()




