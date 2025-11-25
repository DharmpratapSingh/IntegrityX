"""
Database migration script to add missing columns to artifacts table.
Run this script to update the database schema.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Add missing columns to the artifacts table."""
    # Load from root .env file
    root_env = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(root_env)
    
    db_url = os.getenv('DATABASE_URL')
    
    # If PostgreSQL URL, convert to SQLite for local development
    if db_url and db_url.startswith('postgresql'):
        logger.info("PostgreSQL URL detected, using SQLite instead for migration")
        db_url = None
    
    if not db_url:
        # Use SQLite database in backend directory
        db_path = os.path.join(os.path.dirname(__file__), 'integrityx.db')
        db_url = f"sqlite:///{db_path}"
    elif db_url.startswith('sqlite:///'):
        # Handle relative paths in SQLite URL
        db_path = db_url.replace('sqlite:///', '')
        if db_path.startswith('./'):
            # Relative path - resolve from project root
            project_root = os.path.dirname(os.path.dirname(__file__))
            db_path = os.path.join(project_root, db_path[2:])
        db_url = f"sqlite:///{os.path.abspath(db_path)}"
    
    logger.info(f"Using database: {db_url}")
    
    # Ensure directory exists for SQLite
    if db_url.startswith('sqlite:///'):
        db_path = db_url.replace('sqlite:///', '')
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created database directory: {db_dir}")
    
    try:
        engine = create_engine(db_url, echo=False)
        
        with engine.connect() as conn:
            # Check if table exists
            inspector = inspect(engine)
            if 'artifacts' not in inspector.get_table_names():
                logger.info("Artifacts table doesn't exist. Creating all tables...")
                from src.models import Base
                Base.metadata.create_all(engine)
                logger.info("✅ Created all tables")
                return True
            
            # Check if columns exist
            columns = [col['name'] for col in inspector.get_columns('artifacts')]
            
            logger.info(f"Existing columns: {columns}")
            
            # Add missing columns (SQLite compatible syntax)
            if 'parent_id' not in columns:
                logger.info("Adding parent_id column...")
                conn.execute(text("ALTER TABLE artifacts ADD COLUMN parent_id VARCHAR(36)"))
                conn.commit()
                logger.info("✅ Added parent_id column")
            
            if 'artifact_container_type' not in columns:
                logger.info("Adding artifact_container_type column...")
                conn.execute(text("ALTER TABLE artifacts ADD COLUMN artifact_container_type VARCHAR(50) DEFAULT 'file'"))
                conn.commit()
                logger.info("✅ Added artifact_container_type column")
            
            if 'directory_name' not in columns:
                logger.info("Adding directory_name column...")
                conn.execute(text("ALTER TABLE artifacts ADD COLUMN directory_name VARCHAR(255)"))
                conn.commit()
                logger.info("✅ Added directory_name column")
            
            if 'directory_hash' not in columns:
                logger.info("Adding directory_hash column...")
                conn.execute(text("ALTER TABLE artifacts ADD COLUMN directory_hash VARCHAR(64)"))
                conn.commit()
                logger.info("✅ Added directory_hash column")
            
            if 'file_count' not in columns:
                logger.info("Adding file_count column...")
                conn.execute(text("ALTER TABLE artifacts ADD COLUMN file_count INTEGER"))
                conn.commit()
                logger.info("✅ Added file_count column")
            
            # Create index on parent_id if it doesn't exist (SQLite compatible)
            try:
                # Check if index exists
                indexes = [idx['name'] for idx in inspector.get_indexes('artifacts')]
                if 'idx_artifact_parent_id' not in indexes:
                    conn.execute(text("CREATE INDEX idx_artifact_parent_id ON artifacts(parent_id)"))
                    conn.commit()
                    logger.info("✅ Created index on parent_id")
                else:
                    logger.info("Index idx_artifact_parent_id already exists")
            except Exception as e:
                logger.warning(f"Index creation (may already exist): {e}")
            
            logger.info("✅ Database migration completed successfully!")
            return True
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)

