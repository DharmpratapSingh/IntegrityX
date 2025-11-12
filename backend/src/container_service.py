"""
Container Service for Directory Upload Management

Handles creation and management of directory container artifacts and their children.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)


class ContainerService:
    """Service for managing directory containers and hierarchical artifacts."""

    def __init__(self, db_service):
        self.db_service = db_service

    def create_directory_container(
        self,
        directory_name: str,
        directory_hash: str,
        loan_id: str,
        etid: int,
        walacor_tx_id: str,
        file_count: int,
        created_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a parent container artifact for a directory upload.

        Args:
            directory_name: Name of the directory
            directory_hash: ObjectValidator hash of the entire directory
            loan_id: Associated loan ID
            etid: Walacor ETID
            walacor_tx_id: Blockchain transaction ID
            file_count: Number of files in the directory
            created_by: User who created the container
            metadata: Additional metadata

        Returns:
            Container artifact ID
        """
        container_id = str(uuid.uuid4())

        try:
            # Create container artifact
            container_data = {
                'id': container_id,
                'loan_id': loan_id,
                'artifact_type': 'directory',
                'etid': etid,
                'payload_sha256': directory_hash,  # Directory hash is the payload
                'walacor_tx_id': walacor_tx_id,
                'created_by': created_by,
                'created_at': datetime.now(timezone.utc),

                # Container-specific fields
                'parent_id': None,  # Top-level container
                'artifact_container_type': 'directory_container',
                'directory_name': directory_name,
                'directory_hash': directory_hash,
                'file_count': file_count,

                # Store directory metadata
                'local_metadata': metadata or {},
                'borrower_info': {}  # Will be populated from children
            }

            # Insert into database
            self.db_service.create_artifact(container_data)

            logger.info(f"Created directory container: {container_id} for {directory_name} ({file_count} files)")
            return container_id

        except Exception as e:
            logger.error(f"Failed to create directory container: {e}")
            raise

    def create_child_artifact(
        self,
        parent_id: str,
        filename: str,
        file_hash: str,
        loan_id: str,
        etid: int,
        created_by: str,
        borrower_info: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a child artifact linked to a parent container.

        Args:
            parent_id: Parent container artifact ID
            filename: Individual file name
            file_hash: Hash of this specific file
            loan_id: Associated loan ID
            etid: Walacor ETID
            created_by: User who created the artifact
            borrower_info: Borrower information
            metadata: Additional file metadata

        Returns:
            Child artifact ID
        """
        child_id = str(uuid.uuid4())

        try:
            child_data = {
                'id': child_id,
                'loan_id': loan_id,
                'artifact_type': 'file',
                'etid': etid,
                'payload_sha256': file_hash,
                'walacor_tx_id': '',  # Children don't have separate TX IDs
                'created_by': created_by,
                'created_at': datetime.now(timezone.utc),

                # Link to parent
                'parent_id': parent_id,
                'artifact_container_type': 'file',
                'directory_name': None,
                'directory_hash': None,
                'file_count': None,

                # Store file-specific data
                'local_metadata': {
                    'filename': filename,
                    **(metadata or {})
                },
                'borrower_info': borrower_info or {}
            }

            self.db_service.create_artifact(child_data)

            logger.info(f"Created child artifact: {child_id} ({filename}) under parent {parent_id}")
            return child_id

        except Exception as e:
            logger.error(f"Failed to create child artifact: {e}")
            raise

    def get_container_with_children(self, container_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a container and all its children.

        Args:
            container_id: Container artifact ID

        Returns:
            Container data with children list, or None if not found
        """
        try:
            # Get container
            container = self.db_service.get_artifact_by_id(container_id)
            if not container:
                return None

            # Get all children
            children = self.db_service.get_children_artifacts(container_id)

            return {
                'container': container,
                'children': children,
                'file_count': len(children)
            }

        except Exception as e:
            logger.error(f"Failed to get container with children: {e}")
            return None

    def verify_directory_integrity(self, directory_hash: str) -> Optional[Dict[str, Any]]:
        """
        Verify a directory by its ObjectValidator hash.

        Args:
            directory_hash: Directory hash to verify

        Returns:
            Verification result with container and children info
        """
        try:
            # Find container by directory hash
            container = self.db_service.get_artifact_by_hash(directory_hash)
            if not container:
                return {
                    'is_valid': False,
                    'message': 'Directory not found',
                    'container': None,
                    'children': []
                }

            # Verify it's actually a container
            if container.artifact_container_type != 'directory_container':
                return {
                    'is_valid': False,
                    'message': 'Hash matches a file, not a directory container',
                    'container': container,
                    'children': []
                }

            # Get all children
            children = self.db_service.get_children_artifacts(container.id)

            return {
                'is_valid': True,
                'message': f'Directory verified: {container.directory_name} ({len(children)} files)',
                'container': container,
                'children': children,
                'walacor_tx_id': container.walacor_tx_id,
                'sealed_at': container.created_at.isoformat() if container.created_at else None
            }

        except Exception as e:
            logger.error(f"Failed to verify directory integrity: {e}")
            return {
                'is_valid': False,
                'message': f'Verification error: {str(e)}',
                'container': None,
                'children': []
            }
