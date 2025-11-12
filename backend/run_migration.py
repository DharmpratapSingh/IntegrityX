#!/usr/bin/env python3
"""
Quick migration script to add container fields to artifacts table.
Run with: python run_migration.py
"""

import os
from sqlalchemy import create_engine, text

# Get DATABASE_URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dharmpratapsingh@localhost:5432/walacor_integrity")

def run_migration():
    """Add container/hierarchy fields to artifacts table."""
    engine = create_engine(DATABASE_URL)

    migration_queries = [
        "ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36);",
        "ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS artifact_container_type VARCHAR(50) DEFAULT 'file';",
        "ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS directory_name VARCHAR(255);",
        "ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS directory_hash VARCHAR(64);",
        "ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS file_count INTEGER;",
        "CREATE INDEX IF NOT EXISTS idx_artifact_parent_id ON artifacts(parent_id);",
        "UPDATE artifacts SET artifact_container_type = 'file' WHERE artifact_container_type IS NULL;",
    ]

    with engine.connect() as conn:
        for query in migration_queries:
            try:
                conn.execute(text(query))
                conn.commit()
                print(f"✅ {query[:50]}...")
            except Exception as e:
                print(f"⚠️  {query[:50]}... - {str(e)}")
                continue

        # Verify migration
        result = conn.execute(text("""
            SELECT COUNT(*) as total_artifacts,
                   COUNT(parent_id) as artifacts_with_parent
            FROM artifacts;
        """))
        row = result.fetchone()
        print(f"\n✅ Migration completed!")
        print(f"   Total artifacts: {row[0]}")
        print(f"   Artifacts with parent: {row[1]}")

if __name__ == "__main__":
    run_migration()
