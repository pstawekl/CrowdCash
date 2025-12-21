"""
Skrypt do seedowania kategorii kampanii w bazie danych.
"""
import sys
from pathlib import Path

# Dodaj katalog główny do ścieżki
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app import models

def seed_categories():
    db = SessionLocal()
    try:
        categories = [
            {
                "name": "Gastronomia i kawiarnie",
                "description": "Restauracje, kawiarnie, food trucki, catering"
            },
            {
                "name": "Handel detaliczny",
                "description": "Sklepy stacjonarne, e-commerce, markety"
            },
            {
                "name": "Usługi",
                "description": "Usługi profesjonalne, konsultacje, naprawy"
            },
            {
                "name": "Rzemiosło i produkcja",
                "description": "Produkcja lokalna, rękodzieło, manufaktury"
            },
            {
                "name": "Rolnictwo i ekologia",
                "description": "Gospodarstwa rolne, produkty ekologiczne, permakultura"
            },
            {
                "name": "Turystyka i rekreacja",
                "description": "Hotele, agroturystyka, atrakcje turystyczne"
            },
            {
                "name": "Edukacja i szkolenia",
                "description": "Szkoły, kursy, warsztaty, szkolenia"
            },
            {
                "name": "Zdrowie i wellness",
                "description": "Gabinet medyczny, spa, fitness, zdrowy styl życia"
            },
            {
                "name": "Sztuka i kultura",
                "description": "Galerie, teatry, muzea, wydarzenia kulturalne"
            },
            {
                "name": "Technologia i IT",
                "description": "Aplikacje, oprogramowanie, usługi IT"
            },
            {
                "name": "Moda i design",
                "description": "Odzież, akcesoria, design wnętrz, biżuteria"
            },
            {
                "name": "Inne",
                "description": "Inne kategorie nieuwzględnione powyżej"
            }
        ]

        for cat_data in categories:
            # Sprawdź czy kategoria już istnieje
            existing = db.query(models.Category).filter(models.Category.name == cat_data["name"]).first()
            if not existing:
                category = models.Category(**cat_data)
                db.add(category)
                print(f"Dodano kategorię: {cat_data['name']}")
            else:
                print(f"Kategoria już istnieje: {cat_data['name']}")

        db.commit()
        print("Seedowanie kategorii zakończone pomyślnie!")
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas seedowania kategorii: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()

