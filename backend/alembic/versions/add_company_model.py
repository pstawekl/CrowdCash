"""
Add Company model for storing company data from GUS
"""
import uuid

import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as psql
from alembic import op

revision = 'add_company_model'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'companies',
        sa.Column('id', psql.UUID(as_uuid=True),
                  primary_key=True, default=uuid.uuid4),
        sa.Column('nip', sa.String(20), unique=True, nullable=False),
        sa.Column('regon', sa.String(20), nullable=True),
        sa.Column('krs', sa.String(20), nullable=True),
        sa.Column('company_name', sa.Text(), nullable=False),
        sa.Column('street', sa.Text(), nullable=True),
        sa.Column('building_number', sa.String(20), nullable=True),
        sa.Column('apartment_number', sa.String(20), nullable=True),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('city', sa.Text(), nullable=True),
        sa.Column('country', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(),
                  server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('companies')
