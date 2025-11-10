"""
Dodanie tabel: roles, permissions, role_permission oraz powiązania z userami
"""
import sqlalchemy as sa
from alembic import op

revision = '20240531_add_roles_permissions'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String, unique=True, nullable=False)
    )
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String, unique=True, nullable=False)
    )
    op.create_table(
        'role_permission',
        sa.Column('role_id', sa.Integer, sa.ForeignKey('roles.id')),
        sa.Column('permission_id', sa.Integer, sa.ForeignKey('permissions.id'))
    )
    op.add_column('users', sa.Column(
        'role_id', sa.Integer, sa.ForeignKey('roles.id')))


def downgrade():
    op.drop_column('users', 'role_id')
    op.drop_table('role_permission')
    op.drop_table('permissions')
    op.drop_table('roles')
