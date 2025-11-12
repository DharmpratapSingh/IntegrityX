#!/usr/bin/env python3
"""
Initialize database with updated schema including container fields.
"""

import os
import sys
from sqlalchemy import create_engine, inspect

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from src.models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dharmpratapsingh@localhost:5432/walacor_integrity")

def init_database():
    """Create all tables with new schema."""
    print("🔧 Initializing database with updated schema...")

    engine = create_engine(DATABASE_URL)

    # Create all tables
    Base.metadata.create_all(engine)

    # Verify schema
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f"✅ Created {len(tables)} tables:")
    for table in tables:
        columns = inspector.get_columns(table)
        print(f"   📋 {table} ({len(columns)} columns)")

        if table == 'artifacts':
            col_names = [col['name'] for col in columns]
            # Check for new container fields
            new_fields = ['parent_id', 'artifact_container_type', 'directory_name', 'directory_hash', 'file_count']
            for field in new_fields:
                status = "✅" if field in col_names else "❌"
                print(f"      {status} {field}")

    print("\n🎉 Database initialized successfully!")

if __name__ == "__main__":
    init_database()
