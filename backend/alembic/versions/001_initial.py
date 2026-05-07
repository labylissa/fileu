"""Migration unique complète — tous les sprints

Revision ID: 001_initial
Revises:
Create Date: 2026-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Créer les ENUMs via SQL pur — évite tout conflit SQLAlchemy
    conn.execute(sa.text("CREATE TYPE IF NOT EXISTS role AS ENUM ('bailleur', 'locataire', 'admin')"))
    conn.execute(sa.text("CREATE TYPE IF NOT EXISTS propertystatus AS ENUM ('disponible', 'loué', 'en travaux', 'archivé')"))
    conn.execute(sa.text("CREATE TYPE IF NOT EXISTS propertytype AS ENUM ('appartement', 'maison', 'studio', 'garage', 'local commercial', 'autre')"))
    conn.execute(sa.text("CREATE TYPE IF NOT EXISTS contracttype AS ENUM ('meublé', 'non meublé', 'mobilité', 'étudiant', 'colocation')"))
    conn.execute(sa.text("CREATE TYPE IF NOT EXISTS contractstatus AS ENUM ('brouillon', 'actif', 'expiré', 'résilié')"))

    # Users
    op.create_table(
        "users",
        sa.Column("id",                sa.Integer(),              nullable=False),
        sa.Column("email",             sa.String(),               nullable=False),
        sa.Column("hashed_password",   sa.String(),               nullable=False),
        sa.Column("role",              sa.Text(),                 nullable=False, server_default="locataire"),
        sa.Column("is_active",         sa.Boolean(),              nullable=True,  server_default="true"),
        sa.Column("created_at",        sa.DateTime(timezone=True),nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id",    "users", ["id"],    unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Properties
    op.create_table(
        "properties",
        sa.Column("id",            sa.Integer(),               nullable=False),
        sa.Column("owner_id",      sa.Integer(),               nullable=False),
        sa.Column("address",       sa.String(),                nullable=False),
        sa.Column("city",          sa.String(),                nullable=True),
        sa.Column("zip_code",      sa.String(),                nullable=True),
        sa.Column("country",       sa.String(),                nullable=True,  server_default="France"),
        sa.Column("property_type", sa.Text(),                  nullable=True),
        sa.Column("status",        sa.Text(),                  nullable=True,  server_default="disponible"),
        sa.Column("surface",       sa.Float(),                 nullable=True),
        sa.Column("num_rooms",     sa.Integer(),               nullable=True),
        sa.Column("num_bedrooms",  sa.Integer(),               nullable=True),
        sa.Column("num_bathrooms", sa.Integer(),               nullable=True),
        sa.Column("floor",         sa.Integer(),               nullable=True),
        sa.Column("num_floors",    sa.Integer(),               nullable=True),
        sa.Column("description",   sa.Text(),                  nullable=True),
        sa.Column("rent_price",    sa.Float(),                 nullable=False),
        sa.Column("charges",       sa.Float(),                 nullable=True,  server_default="0"),
        sa.Column("deposit",       sa.Float(),                 nullable=True,  server_default="0"),
        sa.Column("is_furnished",  sa.Boolean(),               nullable=True,  server_default="false"),
        sa.Column("has_parking",   sa.Boolean(),               nullable=True,  server_default="false"),
        sa.Column("has_elevator",  sa.Boolean(),               nullable=True,  server_default="false"),
        sa.Column("has_balcony",   sa.Boolean(),               nullable=True,  server_default="false"),
        sa.Column("has_garden",    sa.Boolean(),               nullable=True,  server_default="false"),
        sa.Column("energy_class",  sa.String(length=2),        nullable=True),
        sa.Column("ges_class",     sa.String(length=2),        nullable=True),
        sa.Column("year_built",    sa.Integer(),               nullable=True),
        sa.Column("last_renovation",sa.Integer(),              nullable=True),
        sa.Column("photos",        sa.JSON(),                  nullable=True),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at",    sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_id",       "properties", ["id"],       unique=False)
    op.create_index("ix_properties_owner_id", "properties", ["owner_id"], unique=False)

    # Contracts
    op.create_table(
        "contracts",
        sa.Column("id",          sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("owner_id",    sa.Integer(), nullable=False),

        sa.Column("tenant_firstname",   sa.String(), nullable=False),
        sa.Column("tenant_lastname",    sa.String(), nullable=False),
        sa.Column("tenant_email",       sa.String(), nullable=False),
        sa.Column("tenant_phone",       sa.String(), nullable=True),
        sa.Column("tenant_birth_date",  sa.Date(),   nullable=True),
        sa.Column("tenant_birth_place", sa.String(), nullable=True),
        sa.Column("tenant_profession",  sa.String(), nullable=True),
        sa.Column("cotenants",          sa.JSON(),   nullable=True),

        sa.Column("contract_type",  sa.Text(), nullable=False, server_default="meublé"),
        sa.Column("start_date",     sa.Date(), nullable=False),
        sa.Column("end_date",       sa.Date(), nullable=True),
        sa.Column("notice_period",  sa.Integer(), nullable=True, server_default="1"),

        sa.Column("rent_amount",    sa.Float(), nullable=False),
        sa.Column("charges_amount", sa.Float(), nullable=True, server_default="0"),
        sa.Column("deposit_amount", sa.Float(), nullable=True, server_default="0"),
        sa.Column("payment_day",    sa.Integer(), nullable=True, server_default="1"),
        sa.Column("payment_method", sa.String(), nullable=True, server_default="virement"),

        sa.Column("rent_revision_enabled", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("rent_revision_index",   sa.String(),  nullable=True, server_default="IRL"),
        sa.Column("rent_revision_month",   sa.Integer(), nullable=True, server_default="1"),

        sa.Column("special_clauses", sa.Text(), nullable=True),
        sa.Column("internal_notes",  sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="actif"),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),

        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["owner_id"],    ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contracts_id",          "contracts", ["id"],          unique=False)
    op.create_index("ix_contracts_property_id", "contracts", ["property_id"], unique=False)
    op.create_index("ix_contracts_owner_id",    "contracts", ["owner_id"],    unique=False)
    op.create_index("ix_contracts_status",      "contracts", ["status"],      unique=False)


def downgrade() -> None:
    op.drop_table("contracts")
    op.drop_table("properties")
    op.drop_table("users")
    conn = op.get_bind()
    for t in ["contractstatus", "contracttype", "propertytype", "propertystatus", "role"]:
        conn.execute(sa.text(f"DROP TYPE IF EXISTS {t} CASCADE"))
