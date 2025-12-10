import csv
import os
import sys
import time
import unicodedata
import uuid

import requests

from app.core.database import SessionLocal
from app.models import RegionCity

KRAJ = 'PL'  # Kod kraju do importu (np. 'PL')

COLS = [
    'geonameid', 'name', 'asciiname', 'alternatenames', 'latitude', 'longitude',
    'feature_class', 'feature_code', 'country_code', 'cc2', 'admin1_code', 'admin2_code',
    'admin3_code', 'admin4_code', 'population', 'elevation', 'dem', 'timezone', 'modification_date'
]

KRAJ = 'PL'

# Mapowanie kodów admin1_code z GeoNames na kody ISO używane w bazie
GEONAMES_TO_ISO_ADMIN1 = {
    '75': 'PL.06',  # Lubelskie
    '80': 'PL.18',  # Podkarpackie
    '85': 'PL.28',  # Warmińsko-Mazurskie
    '78': 'PL.26',  # Świętokrzyskie
    '84': 'PL.26',  # Świętokrzyskie (alternatywny kod)
    '81': 'PL.20',  # Podlaskie
    '77': 'PL.14',  # Mazowieckie
    '76': 'PL.10',  # Łódzkie
    '72': 'PL.02',  # Dolnośląskie
    '74': 'PL.04',  # Kujawsko-Pomorskie
    '73': 'PL.22',  # Pomorskie
    '82': 'PL.24',  # Śląskie
    '83': 'PL.30',  # Wielkopolskie
    '86': 'PL.32',  # Zachodniopomorskie
    '87': 'PL.08',  # Lubuskie
    '88': 'PL.16',  # Opolskie
    '79': 'PL.12',  # Małopolskie
    '00': None,     # Nieznany kod - pomiń
}

try:
    import tkinter as tk
    from tkinter import filedialog
except ImportError:
    tk = None
    filedialog = None


# def is_location_valid(name, country_code):
#     """
#     Sprawdza, czy lokalizacja istnieje w bazie GeoNames przez API.
#     Zwraca True jeśli lokalizacja istnieje, False w przeciwnym wypadku.
#     """
#     try:
#         url = "http://api.geonames.org/searchJSON"
#         params = {
#             "q": name,
#             "country": country_code,
#             "maxRows": 1,
#             "username": "demo"  # Zmień na swój login GeoNames!
#         }
#         resp = requests.get(url, params=params, timeout=5)
#         if resp.status_code == 200:
#             data = resp.json()
#             return data.get("totalResultsCount", 0) > 0
#         return False
#     except requests.RequestException as e:
#         print(f"Błąd podczas sprawdzania lokalizacji {name}: {e}")
#         return False


def select_file_dialog(title):
    if tk is None or filedialog is None:
        raise RuntimeError(
            "Tkinter is not available. Zainstaluj tkinter lub podaj ścieżki jako argumenty.")
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title=title)
    root.destroy()
    if not file_path:
        raise RuntimeError("Nie wybrano pliku.")
    return file_path


def main():
    if tk is None or filedialog is None:
        print("Podaj ścieżkę do pliku GeoNames jako argument lub zainstaluj tkinter.")
        sys.exit(1)
    if len(sys.argv) < 2:
        print("Nie podano ścieżki do pliku. Otwieram okno wyboru pliku...")
        geonames_file = select_file_dialog(
            "Wybierz plik GeoNames (np. cities500.txt lub geonames.csv)")
    else:
        geonames_file = sys.argv[1]
    db = SessionLocal()
    # Pobierz istniejące admin1_code (województwa) z bazy
    from sqlalchemy import text
    existing_admin1_codes = set(
        row[0] for row in db.execute(text('SELECT admin1_code FROM region_states')).fetchall()
    )
    
    # Pobierz ID Polski z bazy
    from app.models import RegionCountry
    poland = db.query(RegionCountry).filter(
        RegionCountry.country_code == KRAJ
    ).first()
    
    if not poland:
        print(f"Błąd: Kraj {KRAJ} nie został znaleziony w bazie! Najpierw uruchom seed_countries_states.py")
        db.close()
        return
    
    # --- Import tylko miast ---
    with open(geonames_file, encoding='utf-8') as f:
        reader = csv.DictReader(f, fieldnames=COLS, delimiter=';')
        rows = [row for row in reader if row['country_code'] == KRAJ]
    if not rows:
        print(f'Brak rekordów dla kraju {KRAJ}')
        return
    city_count = 0
    # Lista słów kluczowych do pomijania (rozszerzona)
    skip_keywords = [
        'Powiat', 'Województwo', 'Kanał', 'Jezioro', 'Gmina', 'Rzeka', 'Park', 'Rezerwat', 'Zatoka', 'Zamek',
        'Muzeum', 'Pomnik', 'Cmentarz', 'Wieża', 'Most', 'Ulica', 'Plac', 'Osiedle', 'Dzielnica', 'Osada',
        'Wzgórze', 'Góra', 'Wodospad', 'Port', 'Terminal', 'Lotnisko', 'Stacja', 'Przystanek',
        'Szkoła', 'Uniwersytet', 'Szpital', 'Kościół', 'Synagoga', 'Meczet', 'Kaplica', 'Cerkiew', 'Klasztor',
        'Ratusz', 'Biblioteka', 'Galeria', 'Teatr', 'Opera', 'Filharmonia', 'Kino', 'Centrum', 'Ogród', 'Plaża',
        'Skwer', 'Targowisko', 'Hala', 'Stadion', 'Boisko', 'Plac zabaw', 'Zespół szkół', 'Szkoła podstawowa',
        'Liceum', 'Technikum', 'Szkoła zawodowa', 'Przedszkole', 'Żłobek', 'Dom kultury', 'Centrum kultury',
        'Centrum sportu', 'Centrum rekreacji', 'Centrum handlowe', 'Galeria handlowa', 'Supermarket',
        'Sklep spożywczy', 'Apteka', 'Kawiarnia', 'Restauracja', 'Bar', 'Pub', 'Klub nocny', 'Hotel', 'Motel',
        'Pensjonat', 'Hostel', 'Camping', 'Pole namiotowe', 'Stacja benzynowa', 'Warsztat', 'Serwis',
        'Salon samochodowy',
        # Rozszerzone wg Twojej listy:
        'Struga', 'Potok', 'Przylądek', 'Przełęcz', 'Wyspa', 'Półwysep', 'Obszar', 'Zbiornik', 'Zalew', 'Staw',
        'Tunel', 'Elektrownia', 'Kopalnia', 'Zakład', 'Farma', 'Kolonia', 'Przystań', 'Przysiółek', 'Wieś',
        'Obwód', 'Region', 'Oblast', 'Kraj', 'Province', 'District', 'County', 'Area', 'Zone', 'Field', 'Estate',
        'Settlement', 'Village', 'Hamlet', 'Farm', 'Colony', 'Camp', 'Barracks', 'Refuge', 'Shelter', 'Ruins',
        'Fort', 'Castle', 'Palace', 'Tower', 'Chapel', 'Church', 'Monastery', 'Sanctuary', 'Shrine', 'Temple',
        'Mosque', 'Synagogue', 'Cathedral', 'Basilica', 'Abbey', 'Convent', 'Hermitage', 'Cloister', 'Oratory',
        'Tabernacle', 'Pagoda', 'Stupa', 'Mausoleum', 'Cemetery', 'Graveyard', 'Tomb', 'Crypt', 'Vault',
        'Sepulchre', 'Necropolis', 'Memorial', 'Monument', 'Statue', 'Obelisk', 'Column', 'Pillar', 'Stele',
        'Stone', 'Rock', 'Boulder', 'Cairn', 'Dolmen', 'Menhir', 'Stone circle', 'Stone row', 'Stone alignment',
        'Stone avenue', 'Stone setting', 'Stone slab', 'Stone table', 'Stone seat', 'Stone bench', 'Stone cross',
        'Stone pillar', 'Stone monument', 'Stone sculpture', 'Stone carving', 'Stone relief', 'Stone inscription',
        'Stone tablet', 'Stone plaque', 'Stone marker', 'Stone boundary marker', 'Stone milestone',
        'Stone waymarker', 'Stone signpost', 'Stone guidepost', 'Stone direction post', 'Stone fingerpost',
        'Stone sign', 'Stone noticeboard', 'Stone information board', 'Stone map', 'Stone plan', 'Stone diagram',
        'Stone chart', 'Stone graph', 'Stone list', 'Stone register', 'Stone record', 'Stone log', 'Stone journal',
        'Stone diary', 'Stone chronicle', 'Stone annals', 'Stone history', 'Stone story', 'Stone legend',
        'Stone myth', 'Stone tale', 'Stone fable', 'Stone parable', 'Stone allegory', 'Stone metaphor',
        'Stone simile', 'Stone analogy', 'Stone comparison', 'Stone contrast', 'Stone opposition',
        'Stone contradiction', 'Stone paradox', 'Stone irony', 'Stone satire', 'Stone sarcasm', 'Stone wit',
        'Stone humour', 'Stone joke', 'Stone pun', 'Stone riddle', 'Stone puzzle', 'Stone enigma', 'Stone mystery',
        'Stone secret', 'Stone code', 'Stone cipher', 'Stone cryptogram', 'Stone anagram', 'Stone palindrome',
        'Stone acrostic', 'Stone crossword', 'Stone wordsearch', 'Stone sudoku', 'Stone puzzle box',
        'Stone puzzle ball', 'Stone puzzle cube', 'Stone puzzle ring', 'Stone puzzle lock', 'Stone puzzle key',
        'Stone puzzle piece', 'Stone puzzle part', 'Stone puzzle element', 'Stone puzzle component',
        'Stone puzzle section', 'Stone puzzle segment', 'Stone puzzle fragment', 'Stone puzzle bit',
        'Stone puzzle chip', 'Stone puzzle shard', 'Stone puzzle splinter', 'Stone puzzle sliver', 'Stone puzzle splint'
    ]
    for row in rows:
        name = row['name']
        if any(x in name for x in skip_keywords):
            continue  # pomijamy nie-miasta wg listy
        cc2 = row.get('cc2')
        if cc2 != '' and cc2 is not None:
            continue
        
        # Konwertuj kod GeoNames na kod ISO
        geonames_admin1 = row['admin1_code']
        iso_admin1_code = GEONAMES_TO_ISO_ADMIN1.get(geonames_admin1)
        
        if not iso_admin1_code:
            continue  # pomijamy miasta z nieznanym kodem województwa
        
        # Sprawdź czy admin1_code istnieje w województwach
        if iso_admin1_code not in existing_admin1_codes:
            continue  # pomijamy miasta bez powiązanego województwa

        state_id = db.execute(
            text("SELECT id FROM region_states WHERE admin1_code = :admin1_code"),
            {"admin1_code": iso_admin1_code}  # Użyj kodu ISO zamiast GeoNames
        ).scalar()

        if not state_id:
            print(f"Brak województwa dla admin1_code: {iso_admin1_code} (GeoNames: {geonames_admin1})")
            continue

        city = RegionCity(
            id=uuid.uuid4(),
            geonameid=row['geonameid'],
            name=name,
            asciiname=row['asciiname'],
            alternatenames=row['alternatenames'],
            latitude=row['latitude'],
            longitude=row['longitude'],
            feature_class=row['feature_class'],
            feature_code=row['feature_code'],
            country_id=poland.id,  # Użyj dynamicznego ID zamiast zahardkodowanego
            state_id=state_id,
            admin1_code=row['admin1_code'],  # Zostaw oryginalny kod GeoNames
            admin2_code=row['admin2_code'],
            admin3_code=row['admin3_code'],
            admin4_code=row['admin4_code'],
            population=row['population'] or None,
            elevation=row['elevation'],
            dem=row['dem'],
            timezone=row['timezone'],
            modification_date=row['modification_date']
        )
        db.add(city)
        city_count += 1
        if city_count % 1000 == 0:
            db.commit()
            print(f"Zaimportowano {city_count} miast...")
    db.commit()
    print(f'Dodano miast: {city_count}')
    db.close()

# --- Zakomentowana logika importu krajów i województw ---
# def load_admin1_map(...):
#     ...
#
# ...pozostała zakomentowana logika...


if __name__ == '__main__':
    main()
    main()
