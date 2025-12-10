import os
import xml.etree.ElementTree as ET
from typing import Optional

import zeep
import zeep.helpers
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from zeep import xsd

from app import models
from app.core.database import get_db

router = APIRouter(prefix="/regions", tags=["regions"])

GUS_BIR1_WSDL = "https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/wsdl/UslugaBIRzewnPubl.xsd"
GUS_BIR1_SERVICE_URL = "https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc"
GUS_BIR1_USER_KEY = os.environ.get(
    "GUS_BIR1_USER_KEY", "abcde12345abcde12345")  # testowy klucz


@router.get("/search")
def search_regions(q: str = Query(default=..., min_length=2), type: str = Query(default='all'), country_id: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    q_like = f"%{q.lower()}%"
    results = []
    if type in ('all', 'city'):
        city_query = db.query(models.RegionCity).filter(
            func.lower(models.RegionCity.name).like(q_like))
        if country_id:
            city_query = city_query.filter(
                models.RegionCity.country_id == country_id)
        cities = city_query.limit(10).all()
        results += [{"id": str(city.id), "name": city.name,
                     "type": "city"} for city in cities]
    if type in ('all', 'state'):
        states = db.query(models.RegionState).filter(func.lower(
            models.RegionState.name).like(q_like)).limit(5).all()
        results += [{"id": str(state.id), "name": state.name,
                     "type": "state"} for state in states]
    if type in ('all', 'country'):
        countries = db.query(models.RegionCountry).filter(
            func.lower(models.RegionCountry.name).like(q_like)).limit(5).all()
        results += [{"id": str(country.id), "name": country.name,
                     "type": "country"} for country in countries]
        
    print ("regions searchbox results", results);
    return results


@router.get("/city/{city_id}")
def get_city_details(city_id: str, db: Session = Depends(get_db)):
    city = db.query(models.RegionCity).filter(
        models.RegionCity.id == city_id).first()
    if not city:
        return {"error": "City not found"}
    # Próbujemy pobrać kod pocztowy z pola 'postal_code' jeśli istnieje, lub None
    return {
        "id": str(city.id),
        "name": city.name,
        "postal_code": getattr(city, 'postal_code', None)
    }


@router.get("/gus/company/{nip}")
def get_company_from_gus(nip: str):
    print("[GUS] Start zapytania o firmę po NIP (zeep)")
    sid = None
    try:
        print("[GUS] Tworzenie klienta SOAP...")
        client = zeep.Client(wsdl=GUS_BIR1_WSDL)
        # client.transport.session.headers["Content-Type"] = "application/soap+xml; charset=utf-8"
        # client.transport.session.headers["Accept"] = "application/soap+xml"
        client.service._binding_options["address"] = GUS_BIR1_SERVICE_URL
        print("[GUS] Logowanie do BIR1...")
        sid = client.service.Zaloguj(GUS_BIR1_USER_KEY)
        print(f"[GUS] Otrzymano SID: {sid}")
        # SID jako nagłówek HTTP (zgodnie z instrukcją GUS BIR1)
        client.transport.session.headers["sid"] = sid
        print("[GUS] Wysyłanie zapytania DaneSzukaj...")
        search_params = {
            "Nip": nip,
            "Regon": None,
            "Krs": None,
        }
        print("[GUS] Parametry wyszukiwania:", search_params)
        result = client.service.DaneSzukaj(search_params)
        print(f"[GUS] Wynik DaneSzukaj: {result}")
        # Jeśli result to string (XML), parsujemy ręcznie
        if isinstance(result, str):
            print("[GUS] Parsowanie XML z odpowiedzi DaneSzukaj...")
            root = ET.fromstring(result)
            dane_elem = root.find('dane')
            if dane_elem is None:
                print("[GUS] Brak elementu <dane> w odpowiedzi XML")
                raise HTTPException(
                    status_code=404, detail="Nie znaleziono firmy o podanym NIP")
            dane = {child.tag: child.text for child in dane_elem}
            print(f"[GUS] Dane firmy (XML): {dane}")
        else:
            # fallback: serializacja jak poprzednio
            result_dict = zeep.helpers.serialize_object(result)
            print(f"[GUS] Wynik DaneSzukaj (dict): {result_dict}")
            dane_list = result_dict.get('dane') or result_dict.get('Dane')
            if not dane_list:
                print("[GUS] Brak danych dla podanego NIP (po serializacji)")
                raise HTTPException(
                    status_code=404, detail="Nie znaleziono firmy o podanym NIP")
            dane = dane_list[0] if isinstance(dane_list, list) else dane_list
            print(f"[GUS] Dane firmy (dict): {dane}")
        return {
            "company_name": dane.get("Nazwa", ""),
            "street": dane.get("Ulica", ""),
            "building_number": dane.get("NrNieruchomosci", ""),
            "apartment_number": dane.get("NrLokalu", ""),
            "postal_code": dane.get("KodPocztowy", ""),
            "city": dane.get("Miejscowosc", ""),
            "nip": dane.get("Nip", nip),
            "regon": dane.get("Regon", ""),
            "krs": dane.get("Krs", ""),
            "country": "Polska"
        }
    except Exception as e:
        print(f"[GUS] Błąd: {e}")
        raise HTTPException(
            status_code=500, detail=f"Błąd pobierania danych z GUS BIR1: {e}")
    finally:
        if sid:
            try:
                print(f"[GUS] Wylogowywanie SID: {sid}")
                logout_result = client.service.Wyloguj(sid)
                if logout_result:
                    print("[GUS] Wylogowanie zakończone sukcesem")
                else:
                    print("[GUS] Wylogowanie nie powiodło się")
            except Exception as e:
                print(f"[GUS] Błąd podczas wylogowania: {e}")
                print(f"[GUS] Błąd podczas wylogowania: {e}")
