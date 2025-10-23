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
    # Create database with absolute path
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'integrityx.db')
    print(f'Creating database at: {db_path}')
    
    # Initialize database - this will call create_all()
    db = Database(db_url=f'sqlite:///{db_path}')
    
    print('✅ Database created successfully!')
    print(f'Database location: {db_path}')
    print(f'Database file exists: {os.path.exists(db_path)}')
    
    # Check table creation
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f'Tables created: {tables}')

if __name__ == '__main__':
    main()

