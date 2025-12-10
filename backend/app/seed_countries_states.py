"""
Skrypt do importu krajów i województw dla Polski.
Uruchom ten skrypt PRZED seed_geonames.py
"""
import uuid

from app.core.database import SessionLocal
from app.models import RegionCountry, RegionState

# Podstawowe dane dla Polski
POLAND_DATA = {
    'country': {
        'name': 'Polska',
        'country_code': 'PL',
        'geonameid': '798544',  # GeoNames ID dla Polski
    },
    'states': [
        {'name': 'Dolnośląskie', 'admin1_code': 'PL.02'},
        {'name': 'Kujawsko-Pomorskie', 'admin1_code': 'PL.04'},
        {'name': 'Lubelskie', 'admin1_code': 'PL.06'},
        {'name': 'Lubuskie', 'admin1_code': 'PL.08'},
        {'name': 'Łódzkie', 'admin1_code': 'PL.10'},
        {'name': 'Małopolskie', 'admin1_code': 'PL.12'},
        {'name': 'Mazowieckie', 'admin1_code': 'PL.14'},
        {'name': 'Opolskie', 'admin1_code': 'PL.16'},
        {'name': 'Podkarpackie', 'admin1_code': 'PL.18'},
        {'name': 'Podlaskie', 'admin1_code': 'PL.20'},
        {'name': 'Pomorskie', 'admin1_code': 'PL.22'},
        {'name': 'Śląskie', 'admin1_code': 'PL.24'},
        {'name': 'Świętokrzyskie', 'admin1_code': 'PL.26'},
        {'name': 'Warmińsko-Mazurskie', 'admin1_code': 'PL.28'},
        {'name': 'Wielkopolskie', 'admin1_code': 'PL.30'},
        {'name': 'Zachodniopomorskie', 'admin1_code': 'PL.32'},
    ]
}

def seed_countries_states():
    db = SessionLocal()
    
    try:
        # Sprawdź czy Polska już istnieje
        poland = db.query(RegionCountry).filter(
            RegionCountry.country_code == 'PL'
        ).first()
        
        if not poland:
            # Dodaj Polskę
            poland = RegionCountry(
                id=uuid.uuid4(),
                geonameid=POLAND_DATA['country']['geonameid'],
                name=POLAND_DATA['country']['name'],
                asciiname='Poland',
                country_code=POLAND_DATA['country']['country_code'],
            )
            db.add(poland)
            db.commit()
            db.refresh(poland)
            print(f"✓ Dodano kraj: {poland.name}")
        else:
            print(f"✓ Kraj {poland.name} już istnieje")
        
        # Dodaj województwa
        added_states = 0
        for state_data in POLAND_DATA['states']:
            existing = db.query(RegionState).filter(
                RegionState.admin1_code == state_data['admin1_code']
            ).first()
            
            if not existing:
                state = RegionState(
                    id=uuid.uuid4(),
                    name=state_data['name'],
                    asciiname=state_data['name'],
                    admin1_code=state_data['admin1_code'],
                    country_id=poland.id,
                )
                db.add(state)
                added_states += 1
        
        db.commit()
        print(f"✓ Dodano {added_states} województw")
        print("Seed countries and states completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding countries and states: {e}")
        raise
    finally:
        db.close()

if __name__ == '__main__':
    seed_countries_states()
    seed_countries_states()
