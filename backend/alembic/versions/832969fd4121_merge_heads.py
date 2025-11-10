"""merge heads

Revision ID: 832969fd4121
Revises: 1d61cff3ac48, add_company_model
Create Date: 2025-05-29 13:22:02.742621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '832969fd4121'
down_revision: Union[str, None] = ('1d61cff3ac48', 'add_company_model')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
