#!/usr/bin/env python3
"""
Migration script to backfill new fields (loan_type, conditional fields, SSN/ITIN) 
for old documents that don't have them.

This script:
1. Finds all artifacts missing the new fields
2. Sets reasonable defaults where possible
3. Updates local_metadata.comprehensive_document

Run with: python scripts/migrate_old_documents.py
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from src.database import Database
from src.models import Artifact
from sqlalchemy.orm import Session
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def infer_loan_type_from_document_type(document_type: str) -> str:
    """Try to infer loan_type from document_type."""
    doc_type_lower = (document_type or '').lower()
    
    if 'mortgage' in doc_type_lower or 'home' in doc_type_lower:
        return 'home_loan'
    elif 'auto' in doc_type_lower or 'vehicle' in doc_type_lower or 'car' in doc_type_lower:
        return 'auto_loan'
    elif 'business' in doc_type_lower:
        return 'business_loan'
    elif 'student' in doc_type_lower or 'education' in doc_type_lower:
        return 'student_loan'
    elif 'refinance' in doc_type_lower:
        return 'refinance'
    elif 'equity' in doc_type_lower:
        return 'home_equity'
    elif 'personal' in doc_type_lower:
        return 'personal_loan'
    else:
        return 'other'

def migrate_old_documents():
    """Migrate old documents to include new fields."""
    # Initialize database
    db_url = os.getenv("DATABASE_URL", "postgresql://dharmpratapsingh@localhost:5432/walacor_integrity")
    db = Database(db_url=db_url)
    
    try:
        # Get all artifacts
        artifacts = db.get_all_artifacts()
        logger.info(f"Found {len(artifacts)} total artifacts")
        
        migrated_count = 0
        skipped_count = 0
        error_count = 0
        
        # Process in batches and commit frequently
        batch_size = 100
        session = db._ensure_session()
        
        for i, artifact in enumerate(artifacts):
            try:
                # Check if artifact has comprehensive_document
                local_metadata = artifact.local_metadata or {}
                comprehensive_doc = local_metadata.get('comprehensive_document', {})
                
                # Skip if already has loan_type (new document)
                if comprehensive_doc.get('loan_type'):
                    skipped_count += 1
                    continue
                
                # Skip if no comprehensive_document at all (very old documents)
                if not comprehensive_doc:
                    skipped_count += 1
                    continue
                
                # Prepare updates
                needs_update = False
                updated_doc = comprehensive_doc.copy()
                
                # 1. Add loan_type if missing
                if not updated_doc.get('loan_type'):
                    # Try to infer from document_type
                    inferred_type = infer_loan_type_from_document_type(
                        updated_doc.get('document_type') or artifact.artifact_type
                    )
                    updated_doc['loan_type'] = inferred_type
                    needs_update = True
                    if migrated_count < 10:  # Only log first 10 to avoid spam
                        logger.info(f"  Artifact {artifact.id[:8]}... - Inferred loan_type: {inferred_type}")
                
                # 2. Add SSN/ITIN type if borrower has ssn_last4 but no ssn_or_itin_type
                borrower = updated_doc.get('borrower', {})
                if isinstance(borrower, dict):
                    if borrower.get('ssn_last4') and not borrower.get('ssn_or_itin_type'):
                        # Default to SSN (most common)
                        borrower['ssn_or_itin_type'] = 'SSN'
                        updated_doc['borrower'] = borrower
                        needs_update = True
                        if migrated_count < 10:
                            logger.info(f"  Artifact {artifact.id[:8]}... - Added default SSN type")
                
                # 3. Update local_metadata if changes were made
                if needs_update:
                    local_metadata['comprehensive_document'] = updated_doc
                    artifact.local_metadata = local_metadata
                    session.merge(artifact)  # Use merge instead of add
                    migrated_count += 1
                    
                    # Commit in batches
                    if migrated_count % batch_size == 0:
                        session.commit()
                        logger.info(f"  Committed batch: {migrated_count} artifacts migrated so far...")
                    
            except Exception as e:
                logger.error(f"Error processing artifact {artifact.id}: {e}")
                error_count += 1
                session.rollback()
                continue
        
        # Final commit for remaining changes
        if migrated_count > 0:
            try:
                session.commit()
                logger.info(f"\n✅ Migration completed!")
                logger.info(f"   Migrated: {migrated_count} artifacts")
                logger.info(f"   Skipped: {skipped_count} artifacts (already up-to-date or no comprehensive_document)")
                logger.info(f"   Errors: {error_count} artifacts")
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to commit changes: {e}")
                raise
        else:
            logger.info(f"\n✅ No artifacts needed migration!")
            logger.info(f"   All artifacts are up-to-date or don't have comprehensive_document")
            logger.info(f"   Skipped: {skipped_count} artifacts")
            logger.info(f"   Errors: {error_count} artifacts")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("🔄 Starting migration of old documents...")
    print("   This will backfill loan_type and SSN/ITIN type for old documents\n")
    
    success = migrate_old_documents()
    
    if success:
        print("\n✅ Migration script completed successfully!")
        print("   Old documents now have default values for new fields")
        print("   They will display better in the UI")
    else:
        print("\n❌ Migration script encountered errors")
        sys.exit(1)

