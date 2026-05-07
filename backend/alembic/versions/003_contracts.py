"""Sprint 3 — Contracts table (refactored)

Revision ID: 003_contracts
Revises: 002_property
Create Date: 2026-05-06
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "003_contracts"
down_revision: Union[str, None] = "002_property"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    for enum_name, values in [
        ("contracttype",   ["meublé", "non meublé", "mobilité", "étudiant", "colocation"]),
        ("contractstatus", ["brouillon", "actif", "expiré", "résilié"]),
    ]:
        sa.Enum(*values, name=enum_name).create(op.get_bind(), checkfirst=True)

    # Drop Sprint-1 contracts table (schéma simplifié)
    op.drop_table("contracts")

    # New contracts table — Sprint 3
    op.create_table(
        "contracts",
        sa.Column("id",          sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("owner_id",    sa.Integer(), nullable=False),

        # Locataire
        sa.Column("tenant_firstname",  sa.String(), nullable=False),
        sa.Column("tenant_lastname",   sa.String(), nullable=False),
        sa.Column("tenant_email",      sa.String(), nullable=False),
        sa.Column("tenant_phone",      sa.String(), nullable=True),
        sa.Column("tenant_birth_date", sa.Date(),   nullable=True),
        sa.Column("tenant_birth_place",sa.String(), nullable=True),
        sa.Column("tenant_profession", sa.String(), nullable=True),
        sa.Column("cotenants",         sa.JSON(),   nullable=True),

        # Bail
        sa.Column("contract_type",  sa.Enum("meublé", "non meublé", "mobilité",
                                            "étudiant", "colocation",
                                            name="contracttype"),
                  nullable=False, server_default="meublé"),
        sa.Column("start_date",    sa.Date(), nullable=False),
        sa.Column("end_date",      sa.Date(), nullable=True),
        sa.Column("notice_period", sa.Integer(), nullable=True, server_default="1"),

        # Financier
        sa.Column("rent_amount",    sa.Float(), nullable=False),
        sa.Column("charges_amount", sa.Float(), nullable=True, server_default="0"),
        sa.Column("deposit_amount", sa.Float(), nullable=True, server_default="0"),
        sa.Column("payment_day",    sa.Integer(), nullable=True, server_default="1"),
        sa.Column("payment_method", sa.String(), nullable=True, server_default="virement"),

        # Révision loyer
        sa.Column("rent_revision_enabled", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("rent_revision_index",   sa.String(), nullable=True, server_default="IRL"),
        sa.Column("rent_revision_month",   sa.Integer(), nullable=True, server_default="1"),

        # Divers
        sa.Column("special_clauses", sa.Text(), nullable=True),
        sa.Column("internal_notes",  sa.Text(), nullable=True),

        # Statut
        sa.Column("status", sa.Enum("brouillon", "actif", "expiré", "résilié",
                                    name="contractstatus"),
                  nullable=False, server_default="actif"),

        # Timestamps
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
    op.drop_index("ix_contracts_status",      table_name="contracts")
    op.drop_index("ix_contracts_owner_id",    table_name="contracts")
    op.drop_index("ix_contracts_property_id", table_name="contracts")
    op.drop_index("ix_contracts_id",          table_name="contracts")
    op.drop_table("contracts")

    sa.Enum(name="contractstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="contracttype").drop(op.get_bind(), checkfirst=True)
