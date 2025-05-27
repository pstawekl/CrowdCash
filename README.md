# 🏦 **CrowdCash**

CrowdCash to multiplatformowa aplikacja, która umożliwia inwestorom indywidualnym inwestowanie w lokalne biznesy w modelu crowdinvestingu. Dzięki intuicyjnemu interfejsowi mobilnemu i webowemu użytkownicy mogą przeglądać projekty, inwestować środki, śledzić swoje inwestycje i wspierać rozwój lokalnych przedsiębiorstw.

---

## ✨ **Główne funkcjonalności**

✅ Rejestracja i logowanie inwestorów oraz przedsiębiorców  
✅ Personalizowany feed inwestycyjny według lokalizacji i zainteresowań  
✅ Przeglądanie, filtrowanie i wyszukiwanie kampanii inwestycyjnych  
✅ Wpłaty online zintegrowane z systemem płatności TPay  
✅ System rozliczeń pomiędzy inwestorami, platformą i przedsiębiorcami  
✅ Panele administracyjne dla przedsiębiorców i właściciela platformy  
✅ Powiadomienia o statusach inwestycji i kampanii  
✅ Obsługa wieloplatformowa: aplikacja mobilna (React Native) + aplikacja webowa (React.js)  

---

## 🛠️ **Technologie**

* **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL
* **Frontend Web:** React.js + Vite
* **Frontend Mobile:** React Native (Android/iOS)
* **Płatności:** TPay
* **Autoryzacja:** OAuth 2.0 + JWT
* **Zarządzanie wersjami:** Git, GitHub
* **CI/CD:** GitHub Actions
* **Hosting backend:** MyDevil
* **Hosting web:** OVHCloud
* **Hosting mobilny:** Google Play, App Store

---

## ⚙️ **Jak uruchomić projekt lokalnie**

```bash
# Klonuj repozytorium
git clone https://github.com/twoj-user/crowdcash.git

# Wejdź do katalogu backend
cd backend

# Utwórz i aktywuj wirtualne środowisko (Python)
python -m venv .venv
source .venv/bin/activate  # lub .venv\Scripts\activate na Windows

# Zainstaluj zależności
pip install -r requirements.txt

# Uruchom backend (FastAPI)
uvicorn app.main:app --reload

# W osobnym terminalu uruchom frontend web
cd frontend
npm install
npm run dev

# Aplikacja mobilna w React Native uruchamiana przez Expo:
cd mobile
npm install
npx expo start
```

---

## 📄 **Licencja**

Projekt tworzony jako praca inżynierska przez **Jakuba Stawskiego** (PUW).
Wszelkie prawa zastrzeżone.
