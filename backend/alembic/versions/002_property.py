"""Sprint 2 - Property, PropertyPhoto, PropertyRoom tables

Revision ID: 002_property
Revises: 001_initial
Create Date: 2026-05-05

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "002_property"
down_revision: Union[str, None] = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    for enum_name, values in [
        ("propertytype", ["appartement", "maison", "studio", "loft", "chambre", "autre"]),
        ("dpeclass", ["A", "B", "C", "D", "E", "F", "G"]),
        ("propertystatus", ["disponible", "loué", "en_travaux", "archivé"]),
        ("roomtype", ["salon", "chambre", "cuisine", "salle_de_bain", "wc", "couloir", "bureau", "cave", "parking", "autre"]),
        ("itemcondition", ["neuf", "bon", "usé", "à remplacer"]),
    ]:
        sa.Enum(*values, name=enum_name).create(op.get_bind(), checkfirst=True)

    # Drop old properties table from Sprint 1
    op.drop_table("contracts")
    op.drop_table("properties")

    # New properties table
    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("address2", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("zip_code", sa.String(), nullable=False),
        sa.Column("property_type", sa.Enum("appartement", "maison", "studio", "loft", "chambre", "autre", name="propertytype"), nullable=False),
        sa.Column("surface", sa.Float(), nullable=False),
        sa.Column("num_rooms", sa.Integer(), nullable=True),
        sa.Column("num_bedrooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("total_floors", sa.Integer(), nullable=True),
        sa.Column("has_elevator", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("has_parking", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("has_cellar", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("has_balcony", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("has_garden", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("is_furnished", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("dpe_class", sa.Enum("A", "B", "C", "D", "E", "F", "G", name="dpeclass"), nullable=True),
        sa.Column("dpe_value", sa.Float(), nullable=True),
        sa.Column("ges_class", sa.Enum("A", "B", "C", "D", "E", "F", "G", name="dpeclass"), nullable=True),
        sa.Column("ges_value", sa.Float(), nullable=True),
        sa.Column("rent_price", sa.Float(), nullable=False),
        sa.Column("charges", sa.Float(), nullable=True, server_default="0"),
        sa.Column("deposit_amount", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("disponible", "loué", "en_travaux", "archivé", name="propertystatus"), nullable=False, server_default="disponible"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_id", "properties", ["id"], unique=False)

    # Photos
    op.create_table(
        "property_photos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("original_filename", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("thumbnail_url", sa.String(), nullable=True),
        sa.Column("caption", sa.String(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_cover", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_property_photos_id", "property_photos", ["id"], unique=False)

    # Rooms / Inventaire
    op.create_table(
        "property_rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("room_type", sa.Enum("salon", "chambre", "cuisine", "salle_de_bain", "wc", "couloir", "bureau", "cave", "parking", "autre", name="roomtype"), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("surface", sa.Float(), nullable=True),
        sa.Column("items", sa.JSON(), nullable=True),
        sa.Column("observations", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_property_rooms_id", "property_rooms", ["id"], unique=False)

    # Recreate contracts table with new properties FK
    op.create_table(
        "contracts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("rent_amount", sa.Float(), nullable=False),
        sa.Column("deposit_amount", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=True, server_default="active"),
        sa.Column("contract_type", sa.String(), nullable=True, server_default="meublé"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contracts_id", "contracts", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("contracts")
    op.drop_index("ix_property_rooms_id", table_name="property_rooms")
    op.drop_table("property_rooms")
    op.drop_index("ix_property_photos_id", table_name="property_photos")
    op.drop_table("property_photos")
    op.drop_index("ix_properties_id", table_name="properties")
    op.drop_table("properties")
