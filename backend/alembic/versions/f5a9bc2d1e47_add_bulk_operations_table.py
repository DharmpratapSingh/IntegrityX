"""add_bulk_operations_table

Revision ID: f5a9bc2d1e47
Revises: e024131443c3
Create Date: 2024-10-28 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f5a9bc2d1e47'
down_revision = 'e024131443c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create bulk_operations table for tracking bulk operations analytics.
    """
    op.create_table(
        'bulk_operations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('operation_type', sa.String(length=50), nullable=False),
        sa.Column('operation_subtype', sa.String(length=50), nullable=True),
        sa.Column('documents_count', sa.Integer(), nullable=False, default=0),
        sa.Column('success_count', sa.Integer(), nullable=False, default=0),
        sa.Column('failure_count', sa.Integer(), nullable=False, default=0),
        sa.Column('success', sa.String(length=20), nullable=False, default='success'),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.String(length=255), nullable=True),
        sa.Column('operation_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for efficient querying
    op.create_index('idx_bulk_op_type_created', 'bulk_operations', ['operation_type', 'created_at'])
    op.create_index('idx_bulk_op_success', 'bulk_operations', ['success'])
    op.create_index('idx_bulk_op_user_created', 'bulk_operations', ['user_id', 'created_at'])
    op.create_index(op.f('ix_bulk_operations_operation_type'), 'bulk_operations', ['operation_type'], unique=False)
    op.create_index(op.f('ix_bulk_operations_operation_subtype'), 'bulk_operations', ['operation_subtype'], unique=False)
    op.create_index(op.f('ix_bulk_operations_user_id'), 'bulk_operations', ['user_id'], unique=False)
    op.create_index(op.f('ix_bulk_operations_created_at'), 'bulk_operations', ['created_at'], unique=False)


def downgrade() -> None:
    """
    Drop bulk_operations table and its indexes.
    """
    op.drop_index(op.f('ix_bulk_operations_created_at'), table_name='bulk_operations')
    op.drop_index(op.f('ix_bulk_operations_user_id'), table_name='bulk_operations')
    op.drop_index(op.f('ix_bulk_operations_operation_subtype'), table_name='bulk_operations')
    op.drop_index(op.f('ix_bulk_operations_operation_type'), table_name='bulk_operations')
    op.drop_index('idx_bulk_op_user_created', table_name='bulk_operations')
    op.drop_index('idx_bulk_op_success', table_name='bulk_operations')
    op.drop_index('idx_bulk_op_type_created', table_name='bulk_operations')
    op.drop_table('bulk_operations')

