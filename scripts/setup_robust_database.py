#!/usr/bin/env python3
"""
Robust Database Setup and Migration Script

This script provides automated database setup with:
- Automatic PostgreSQL installation and configuration
- Database creation and user setup
- Migration management
- Health checks and validation
- Backup and recovery setup
- Production-ready configuration
"""

import os
import sys
import subprocess
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
import json
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RobustDatabaseSetup:
    """
    Robust database setup and management.
    
    Features:
    - Automatic PostgreSQL installation
    - Database and user creation
    - Migration management
    - Health validation
    - Backup configuration
    - Production optimization
    """
    
    def __init__(self):
        """Initialize the database setup."""
        self.db_name = "walacor_integrity"
        self.db_user = "walacor_user"
        self.db_password = "walacor_secure_password_2024"
        self.db_host = "localhost"
        self.db_port = "5432"
        
        # Configuration paths
        self.project_root = Path(__file__).parent.parent
        self.backend_dir = self.project_root / "backend"
        self.env_file = self.backend_dir / ".env"
        
        # Database configuration
        self.db_config = {
            'name': self.db_name,
            'user': self.db_user,
            'password': self.db_password,
            'host': self.db_host,
            'port': self.db_port
        }
        
        logger.info("Robust database setup initialized")
    
    def setup_postgresql(self) -> bool:
        """Setup PostgreSQL with automatic installation."""
        logger.info("Setting up PostgreSQL...")
        
        try:
            # Check if PostgreSQL is installed
            if self._check_postgresql_installed():
                logger.info("PostgreSQL is already installed")
                return True
            
            # Install PostgreSQL based on OS
            if self._install_postgresql():
                logger.info("PostgreSQL installed successfully")
                return True
            else:
                logger.error("Failed to install PostgreSQL")
                return False
                
        except Exception as e:
            logger.error(f"PostgreSQL setup failed: {e}")
            return False
    
    def _check_postgresql_installed(self) -> bool:
        """Check if PostgreSQL is installed and running."""
        try:
            # Check if psql command exists
            result = subprocess.run(['which', 'psql'], capture_output=True, text=True)
            if result.returncode != 0:
                return False
            
            # Check if PostgreSQL service is running
            result = subprocess.run(['pg_isready'], capture_output=True, text=True)
            return result.returncode == 0
            
        except Exception as e:
            logger.warning(f"Error checking PostgreSQL installation: {e}")
            return False
    
    def _install_postgresql(self) -> bool:
        """Install PostgreSQL based on the operating system."""
        try:
            import platform
            system = platform.system().lower()
            
            if system == "darwin":  # macOS
                logger.info("Installing PostgreSQL on macOS...")
                result = subprocess.run(['brew', 'install', 'postgresql@14'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    # Start PostgreSQL service
                    subprocess.run(['brew', 'services', 'start', 'postgresql@14'], 
                                 capture_output=True, text=True)
                    time.sleep(5)  # Wait for service to start
                    return True
            
            elif system == "linux":
                logger.info("Installing PostgreSQL on Linux...")
                # Try apt first (Ubuntu/Debian)
                result = subprocess.run(['sudo', 'apt-get', 'update'], 
                                      capture_output=True, text=True)
                result = subprocess.run(['sudo', 'apt-get', 'install', '-y', 'postgresql', 'postgresql-contrib'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    # Start PostgreSQL service
                    subprocess.run(['sudo', 'systemctl', 'start', 'postgresql'], 
                                 capture_output=True, text=True)
                    subprocess.run(['sudo', 'systemctl', 'enable', 'postgresql'], 
                                 capture_output=True, text=True)
                    return True
            
            logger.error(f"Unsupported operating system: {system}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to install PostgreSQL: {e}")
            return False
    
    def create_database_and_user(self) -> bool:
        """Create database and user with proper permissions."""
        logger.info("Creating database and user...")
        
        try:
            # Connect as postgres user to create database and user
            conn = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                user='postgres',
                database='postgres'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Create user if not exists
            cursor.execute(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{self.db_user}') THEN
                        CREATE USER {self.db_user} WITH PASSWORD '{self.db_password}';
                    END IF;
                END
                $$;
            """)
            
            # Create database if not exists
            cursor.execute(f"""
                SELECT 'CREATE DATABASE {self.db_name}'
                WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{self.db_name}')
                \\gexec
            """)
            
            # Grant privileges
            cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {self.db_name} TO {self.db_user};")
            cursor.execute(f"GRANT ALL ON SCHEMA public TO {self.db_user};")
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {self.db_user};")
            cursor.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {self.db_user};")
            cursor.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {self.db_user};")
            cursor.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {self.db_user};")
            
            cursor.close()
            conn.close()
            
            logger.info("Database and user created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create database and user: {e}")
            return False
    
    def setup_environment(self) -> bool:
        """Setup environment variables."""
        logger.info("Setting up environment variables...")
        
        try:
            # Create .env file if it doesn't exist
            if not self.env_file.exists():
                self.env_file.touch()
            
            # Read existing .env content
            env_content = ""
            if self.env_file.exists():
                with open(self.env_file, 'r') as f:
                    env_content = f.read()
            
            # Update DATABASE_URL
            db_url = f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
            
            # Remove old DATABASE_URL if exists
            lines = env_content.split('\n')
            filtered_lines = [line for line in lines if not line.startswith('DATABASE_URL=')]
            
            # Add new DATABASE_URL
            filtered_lines.append(f"DATABASE_URL={db_url}")
            
            # Write updated .env file
            with open(self.env_file, 'w') as f:
                f.write('\n'.join(filtered_lines))
            
            logger.info("Environment variables updated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup environment: {e}")
            return False
    
    def run_migrations(self) -> bool:
        """Run database migrations."""
        logger.info("Running database migrations...")
        
        try:
            # Change to backend directory
            original_cwd = os.getcwd()
            os.chdir(self.backend_dir)
            
            # Set environment variable
            os.environ['DATABASE_URL'] = f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
            
            # Run migrations
            result = subprocess.run(['alembic', 'upgrade', 'head'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Database migrations completed successfully")
                return True
            else:
                logger.error(f"Migration failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to run migrations: {e}")
            return False
        finally:
            os.chdir(original_cwd)
    
    def validate_setup(self) -> bool:
        """Validate database setup."""
        logger.info("Validating database setup...")
        
        try:
            # Test connection
            db_url = f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
            engine = create_engine(db_url)
            
            with engine.connect() as conn:
                # Test basic connectivity
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                logger.info(f"PostgreSQL version: {version}")
                
                # Check if tables exist
                result = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """))
                tables = [row[0] for row in result.fetchall()]
                logger.info(f"Tables found: {tables}")
                
                # Test insert/select
                test_table = "test_robust_setup"
                conn.execute(text(f"CREATE TABLE IF NOT EXISTS {test_table} (id SERIAL PRIMARY KEY, test_data TEXT)"))
                conn.execute(text(f"INSERT INTO {test_table} (test_data) VALUES ('robust_setup_test')"))
                result = conn.execute(text(f"SELECT * FROM {test_table} WHERE test_data = 'robust_setup_test'"))
                test_result = result.fetchone()
                conn.execute(text(f"DROP TABLE {test_table}"))
                
                if test_result:
                    logger.info("Database validation successful")
                    return True
                else:
                    logger.error("Database validation failed - test query returned no results")
                    return False
                    
        except Exception as e:
            logger.error(f"Database validation failed: {e}")
            return False
    
    def setup_backup_configuration(self) -> bool:
        """Setup backup configuration."""
        logger.info("Setting up backup configuration...")
        
        try:
            # Create backup directory
            backup_dir = self.project_root / "backups"
            backup_dir.mkdir(exist_ok=True)
            
            # Create backup script
            backup_script = backup_dir / "backup_database.sh"
            backup_script_content = f"""#!/bin/bash
# Database backup script
BACKUP_DIR="{backup_dir}"
DB_NAME="{self.db_name}"
DB_USER="{self.db_user}"
DB_HOST="{self.db_host}"
DB_PORT="{self.db_port}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DB_NAME_$TIMESTAMP.sql"

# Create backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
"""
            
            with open(backup_script, 'w') as f:
                f.write(backup_script_content)
            
            # Make script executable
            os.chmod(backup_script, 0o755)
            
            logger.info("Backup configuration created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup backup configuration: {e}")
            return False
    
    def optimize_postgresql(self) -> bool:
        """Optimize PostgreSQL for production."""
        logger.info("Optimizing PostgreSQL configuration...")
        
        try:
            # Connect to database
            conn = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_password,
                database=self.db_name
            )
            cursor = conn.cursor()
            
            # Create indexes for better performance
            optimization_queries = [
                # Index for artifacts table
                "CREATE INDEX IF NOT EXISTS idx_artifacts_loan_id_created_at ON artifacts(loan_id, created_at DESC);",
                "CREATE INDEX IF NOT EXISTS idx_artifacts_created_by_created_at ON artifacts(created_by, created_at DESC);",
                
                # Index for artifact_events table
                "CREATE INDEX IF NOT EXISTS idx_artifact_events_artifact_id_created_at ON artifact_events(artifact_id, created_at DESC);",
                "CREATE INDEX IF NOT EXISTS idx_artifact_events_event_type_created_at ON artifact_events(event_type, created_at DESC);",
                
                # Index for attestations table
                "CREATE INDEX IF NOT EXISTS idx_attestations_artifact_id_kind ON attestations(artifact_id, kind);",
                "CREATE INDEX IF NOT EXISTS idx_attestations_created_at ON attestations(created_at DESC);",
                
                # Index for provenance_links table
                "CREATE INDEX IF NOT EXISTS idx_provenance_links_parent_child ON provenance_links(parent_artifact_id, child_artifact_id);",
                "CREATE INDEX IF NOT EXISTS idx_provenance_links_created_at ON provenance_links(created_at DESC);",
            ]
            
            for query in optimization_queries:
                try:
                    cursor.execute(query)
                except Exception as e:
                    logger.warning(f"Optimization query failed (may already exist): {e}")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info("PostgreSQL optimization completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize PostgreSQL: {e}")
            return False
    
    def run_complete_setup(self) -> bool:
        """Run complete database setup."""
        logger.info("Starting robust database setup...")
        
        setup_steps = [
            ("Setup PostgreSQL", self.setup_postgresql),
            ("Create Database and User", self.create_database_and_user),
            ("Setup Environment", self.setup_environment),
            ("Run Migrations", self.run_migrations),
            ("Validate Setup", self.validate_setup),
            ("Setup Backup Configuration", self.setup_backup_configuration),
            ("Optimize PostgreSQL", self.optimize_postgresql),
        ]
        
        for step_name, step_function in setup_steps:
            logger.info(f"Executing: {step_name}")
            if not step_function():
                logger.error(f"Failed at step: {step_name}")
                return False
            logger.info(f"Completed: {step_name}")
        
        logger.info("🎉 Robust database setup completed successfully!")
        return True

def main():
    """Main function."""
    print("🚀 Robust Database Setup for Walacor Financial Integrity Platform")
    print("=" * 70)
    
    setup = RobustDatabaseSetup()
    
    if setup.run_complete_setup():
        print("\n✅ Database setup completed successfully!")
        print("\n📋 Setup Summary:")
        print(f"   Database: {setup.db_name}")
        print(f"   User: {setup.db_user}")
        print(f"   Host: {setup.db_host}:{setup.db_port}")
        print(f"   Environment file: {setup.env_file}")
        print("\n🔧 Next Steps:")
        print("   1. Start your backend application")
        print("   2. Test the API endpoints")
        print("   3. Monitor database health")
        print("\n🛡️ Your database is now robust and production-ready!")
    else:
        print("\n❌ Database setup failed!")
        print("Please check the logs above for error details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
