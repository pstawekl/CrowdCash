# CrowdCash

CrowdCash to nowoczesna platforma crowdfundingowa umożliwiająca przedsiębiorcom zbieranie środków na realizację swoich projektów, a inwestorom wspieranie innowacyjnych pomysłów i potencjalny zwrot z inwestycji.

## 🎯 Główne funkcje

### Dla Przedsiębiorców:
- Tworzenie i zarządzanie kampaniami crowdfundingowymi
- Publikowanie projektów z opisem, celami finansowymi i terminami
- Zarządzanie profilami kampanii z obrazami i szczegółami
- System poziomów nagród dla inwestorów
- Monitorowanie postępów zbiórek
- Panel zarządzania kampaniami

### Dla Inwestorów:
- Przeglądanie dostępnych kampanii w feedzie
- Szczegółowe informacje o projektach
- Dokonywanie inwestycji w wybrane kampanie
- Śledzenie historii inwestycji i transakcji
- Panel inwestora z przeglądem aktywności
- Powiadomienia o aktualizacjach kampanii

### Funkcje systemowe:
- Bezpieczne logowanie i rejestracja z weryfikacją email
- System uprawnień oparty na rolach (RBAC)
- Integracja z Stripe do płatności
- Weryfikacja danych przez REGON API
- Powiadomienia w czasie rzeczywistym
- Responsywny interfejs webowy
- Aplikacja mobilna (iOS/Android)

## 🛠️ Technologie

### Backend:
- **FastAPI** - nowoczesny framework webowy dla Python
- **PostgreSQL** - relacyjna baza danych
- **SQLAlchemy** - ORM do pracy z bazą danych
- **Alembic** - migracje bazy danych
- **Pydantic** - walidacja danych
- **JWT** - autoryzacja i uwierzytelnianie
- **Stripe** - integracja płatności
- **FastAPI-Mail** - wysyłanie emaili

### Frontend Web:
- **React 19** - biblioteka UI
- **TypeScript** - typowanie statyczne
- **Vite** - narzędzie buildowe
- **TanStack Router** - routing
- **TanStack Query** - zarządzanie stanem serwera
- **TailwindCSS** - framework CSS
- **Axios** - klient HTTP

### Frontend Mobile:
- **React Native** - framework mobilny
- **Expo** - platforma deweloperska
- **React Navigation** - nawigacja
- **AsyncStorage** - lokalne przechowywanie danych

## 📋 Wymagania wstępne

Przed rozpoczęciem upewnij się, że masz zainstalowane:

- **Python 3.8+** (zalecane 3.10+)
- **Node.js 18+** i **npm** lub **pnpm**
- **PostgreSQL 12+**
- **Git**
- **Expo CLI** (dla aplikacji mobilnej) - `npm install -g expo-cli`

## 🚀 Instrukcja uruchomienia lokalnego

### Krok 1: Klonowanie repozytorium

```bash
git clone <url-repozytorium>
cd CrowdCash
```

### Krok 2: Przygotowanie bazy danych PostgreSQL

1. **Zainstaluj i uruchom PostgreSQL** (jeśli jeszcze nie masz):
   - Windows: Pobierz z [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql@14`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Utwórz bazę danych**:

```bash
# Zaloguj się do PostgreSQL jako użytkownik postgres
psql -U postgres

# W konsoli PostgreSQL wykonaj:
CREATE DATABASE crowdcash;
CREATE USER crowdcash_user WITH PASSWORD 'twoje_haslo';
GRANT ALL PRIVILEGES ON DATABASE crowdcash TO crowdcash_user;
\q
```

3. **Przywróć backup bazy danych** (opcjonalnie, jeśli masz backup):

```bash
# Użyj najnowszego backupu z katalogu db/
psql -U postgres -d crowdcash < db/backup-crowdcash-2026-01-19.sql
```

Lub jeśli chcesz utworzyć bazę od zera, wykonaj migracje Alembic (patrz Krok 3).

### Krok 3: Konfiguracja i uruchomienie Backendu

1. **Przejdź do katalogu backend**:

```bash
cd backend
```

2. **Utwórz wirtualne środowisko Python**:

```bash
# Windows
python -m venv venv

# macOS/Linux
python3 -m venv venv
```

3. **Aktywuj wirtualne środowisko**:

```bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
venv\Scripts\activate.bat

# macOS/Linux
source venv/bin/activate
```

4. **Zainstaluj zależności**:

```bash
pip install -r requirements.txt
```

5. **Skonfiguruj zmienne środowiskowe**:

Utwórz plik `.env` w katalogu `backend/` z następującą konfiguracją:

```env
# Baza danych
DATABASE_URL=postgresql://crowdcash_user:twoje_haslo@localhost:5432/crowdcash

# JWT
SECRET_KEY=twoj-secret-key-minimum-32-znaki-losowe
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (dla wysyłania weryfikacji)
MAIL_USERNAME=twoj-email@gmail.com
MAIL_PASSWORD=twoje-haslo-aplikacji
MAIL_FROM=twoj-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_TLS=True
MAIL_SSL=False

# Stripe (opcjonalne, dla płatności)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# REGON API (opcjonalne, dla weryfikacji firm)
REGON_API_KEY=twoj-klucz-api-regon
```

6. **Wykonaj migracje bazy danych**:

```bash
# Jeśli używasz Alembic
alembic upgrade head
```

7. **Uruchom serwer deweloperski**:

```bash
uvicorn app.main:app --reload
```

Backend będzie dostępny pod adresem: `http://127.0.0.1:8000`

Dokumentacja API (Swagger) będzie dostępna pod: `http://127.0.0.1:8000/docs`

### Krok 4: Uruchomienie Frontendu Webowego

1. **Otwórz nowy terminal** i przejdź do katalogu web:

```bash
cd web
```

2. **Zainstaluj zależności**:

```bash
npm install
# lub
pnpm install
```

3. **Uruchom serwer deweloperski**:

```bash
npm run dev
# lub
pnpm dev
```

Aplikacja webowa będzie dostępna pod adresem: `http://localhost:5173` (lub innym portem wskazanym przez Vite)

### Krok 5: Uruchomienie Frontendu Mobilnego

1. **Otwórz nowy terminal** i przejdź do katalogu frontend:

```bash
cd frontend
```

2. **Zainstaluj zależności**:

```bash
npm install
# lub
pnpm install
```

3. **Uruchom aplikację Expo**:

```bash
npx expo start
```

4. **Wybierz platformę**:
   - Naciśnij `a` dla Android Emulator
   - Naciśnij `i` dla iOS Simulator
   - Zeskanuj kod QR w aplikacji Expo Go na telefonie (dla testów na urządzeniu fizycznym)

**Uwaga**: Dla emulatora Android, backend powinien być dostępny pod adresem `http://10.0.2.2:8000` (aplikacja mobilna automatycznie używa tego adresu dla Android).

## 📁 Struktura projektu

```
CrowdCash/
├── backend/              # Backend FastAPI
│   ├── app/             # Główny kod aplikacji
│   ├── alembic/         # Migracje bazy danych
│   ├── venv/            # Wirtualne środowisko Python
│   ├── requirements.txt # Zależności Python
│   └── .env             # Zmienne środowiskowe (nie commituj!)
│
├── web/                 # Frontend webowy (React + Vite)
│   ├── src/
│   │   ├── components/  # Komponenty React
│   │   ├── pages/       # Strony aplikacji
│   │   ├── utils/       # Narzędzia (API, auth)
│   │   └── router.tsx   # Konfiguracja routingu
│   ├── package.json
│   └── vite.config.ts
│
├── frontend/            # Frontend mobilny (React Native + Expo)
│   ├── screens/         # Ekrany aplikacji
│   ├── components/      # Komponenty React Native
│   ├── navigation/      # Konfiguracja nawigacji
│   ├── utils/           # Narzędzia (API, auth)
│   └── package.json
│
└── db/                  # Backupy bazy danych
    └── backup-crowdcash-*.sql
```

## 🔧 Rozwiązywanie problemów

### Problem: Backend nie łączy się z bazą danych
- Sprawdź czy PostgreSQL jest uruchomiony: `pg_isready`
- Zweryfikuj dane w pliku `.env` (DATABASE_URL)
- Upewnij się, że użytkownik bazy danych ma odpowiednie uprawnienia

### Problem: Frontend webowy nie łączy się z backendem
- Sprawdź czy backend działa na porcie 8000
- Zweryfikuj adres w `web/src/utils/api.ts`
- Sprawdź CORS w konfiguracji FastAPI

### Problem: Aplikacja mobilna nie łączy się z backendem
- Dla Android Emulator: użyj `http://10.0.2.2:8000`
- Dla iOS Simulator: użyj `http://localhost:8000`
- Dla urządzenia fizycznego: użyj IP twojego komputera w sieci lokalnej (np. `http://192.168.1.100:8000`)

### Problem: Błędy migracji Alembic
- Sprawdź czy baza danych istnieje
- Zweryfikuj DATABASE_URL w `.env`
- Uruchom: `alembic current` aby sprawdzić aktualną wersję
- Jeśli potrzebujesz zresetować: `alembic downgrade base` a następnie `alembic upgrade head`

## 📚 Dokumentacja API

Po uruchomieniu backendu, dokumentacja interaktywna jest dostępna pod:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

## 🤝 Wsparcie

W przypadku problemów lub pytań, sprawdź:
- Dokumentację FastAPI: https://fastapi.tiangolo.com/
- Dokumentację Expo: https://docs.expo.dev/
- Dokumentację React: https://react.dev/

## 📄 Licencja

Copyright (c) 2025 Jakub Stawski. Wszelkie prawa zastrzeżone.

Ten projekt został stworzony jako praca inżynierska. Kod źródłowy, dokumentacja i wszystkie związane materiały są własnością autora.

**Zastrzeżenie**: Ten projekt jest przeznaczony wyłącznie do celów edukacyjnych i demonstracyjnych w ramach pracy inżynierskiej. Wszelkie prawa autorskie i własności intelektualnej są zastrzeżone. Kopiowanie, modyfikacja, dystrybucja lub komercyjne wykorzystanie bez wyraźnej pisemnej zgody autora jest zabronione.

---

**Autor**: Jakub Stawski  
**Projekt**: Praca Inżynierska
