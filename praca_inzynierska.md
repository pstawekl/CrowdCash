# PRACA INŻYNIERSKA

## WSTĘP

### 1. Wprowadzenie

W dobie cyfrowej transformacji gospodarki, finansowanie projektów i przedsiębiorstw uległo znacznym zmianom. Tradycyjne metody pozyskiwania kapitału, takie jak kredyty bankowe czy inwestycje venture capital, stają się coraz mniej dostępne dla małych i średnich przedsiębiorstw oraz startupów. W odpowiedzi na te ograniczenia, w ostatnich latach dynamicznie rozwija się crowdfunding jako alternatywna forma finansowania, która umożliwia bezpośrednie łączenie przedsiębiorców z inwestorami indywidualnymi.

Crowdfunding, jako model finansowania społecznościowego, pozwala na pozyskiwanie środków finansowych od dużej grupy osób poprzez platformy internetowe. Model ten nie tylko demokratyzuje dostęp do kapitału, ale również umożliwia inwestorom indywidualnym uczestnictwo w projektach, które wcześniej były dostępne tylko dla inwestorów instytucjonalnych. Według raportów branży fintech, globalny rynek crowdfundingu osiągnął wartość ponad 100 miliardów dolarów w 2023 roku i nadal dynamicznie rośnie.

### 2. Cel i zakres pracy

Celem niniejszej pracy inżynierskiej jest zaprojektowanie i implementacja kompleksowej platformy crowdfundingowej o nazwie **CrowdCash**, która umożliwia inwestorom finansowanie projektów przedsiębiorców oraz zarządzanie całym cyklem życia kampanii inwestycyjnych.

Platforma CrowdCash została zaprojektowana jako nowoczesne rozwiązanie technologiczne, składające się z trzech głównych komponentów:

1. **Backend API** - serwer REST API zbudowany w technologii FastAPI z bazą danych PostgreSQL
2. **Aplikacja mobilna** - natywna aplikacja mobilna stworzona w React Native z wykorzystaniem frameworku Expo
3. **Aplikacja webowa** - responsywna aplikacja internetowa oparta na React z TypeScript i Tailwind CSS

### 3. Problemy badawcze i proponowane rozwiązanie

Analiza istniejących platform crowdfundingowych wykazała szereg problemów, które zostały uwzględnione w projekcie CrowdCash:

- **Ograniczone funkcjonalności dla inwestorów** - większość platform oferuje podstawowe narzędzia do inwestowania, ale brakuje zaawansowanych mechanizmów monitorowania i analizy portfela inwestycyjnego
- **Brak integracji z systemami regionalnymi** - ograniczone możliwości lokalizacji kampanii i inwestorów w kontekście geograficznym
- **Niewystarczające mechanizmy weryfikacji** - słaba weryfikacja tożsamości użytkowników i firm
- **Brak zaawansowanego systemu powiadomień** - ograniczone możliwości komunikacji między uczestnikami platformy
- **Niedostateczne zarządzanie ryzykiem** - brak kompleksowych narzędzi do oceny ryzyka inwestycyjnego

Proponowanym rozwiązaniem jest platforma CrowdCash, która oferuje:

- **Zaawansowany system ról i uprawnień** - elastyczny mechanizm RBAC (Role-Based Access Control) umożliwiający precyzyjne zarządzanie dostępem
- **Kompleksowe zarządzanie kampaniami** - pełny cykl życia kampanii od projektu przez aktywne finansowanie po rozliczenie
- **System regionalny** - integracja z bazami danych geograficznych umożliwiająca precyzyjne targetowanie kampanii
- **Zaawansowane powiadomienia** - system powiadomień w czasie rzeczywistym dla wszystkich uczestników
- **Bezpieczeństwo i weryfikacja** - wielopoziomowy system weryfikacji użytkowników i firm z integracją REGON/NIP
- **Analityka i raportowanie** - kompleksowe narzędzia analityczne dla inwestorów i przedsiębiorców

### 4. Technologie wykorzystane w projekcie

Wybór technologii został podyktowany wymaganiami wydajnościowymi, skalowalności oraz nowoczesnymi standardami tworzenia aplikacji webowych i mobilnych:

**Backend:**
- **FastAPI** - nowoczesny framework Python do tworzenia API REST
- **PostgreSQL** - zaawansowana relacyjna baza danych
- **SQLAlchemy ORM** - mapowanie obiektowo-relacyjne
- **Pydantic** - walidacja danych i serializacja
- **JWT** - autoryzacja użytkowników
- **Alembic** - migracje bazy danych

**Frontend:**
- **React Native** - tworzenie natywnych aplikacji mobilnych
- **Expo** - platforma do szybkiego developmentu aplikacji mobilnych
- **React** - biblioteka do tworzenia interfejsów użytkownika
- **TypeScript** - statycznie typowany JavaScript
- **Tailwind CSS** - utility-first framework CSS
- **TanStack Query** - zarządzanie stanem serwera

**Dodatkowe technologie:**
- **Docker** - konteneryzacja aplikacji
- **Stripe** - przetwarzanie płatności
- **WebSockets** - komunikacja w czasie rzeczywistym

### 5. Struktura pracy

Niniejsza praca inżynierska składa się z następujących rozdziałów:

**Rozdział 1. Analiza problemu i wymagań**
- Analiza rynku crowdfundingowego
- Badanie wymagań użytkowników
- Specyfikacja wymagań funkcjonalnych i niefunkcjonalnych

**Rozdział 2. Projekt systemu**
- Architektura systemu
- Model danych
- Diagramy przypadków użycia
- Projekt interfejsów użytkownika

**Rozdział 3. Implementacja**
- Implementacja backend API
- Tworzenie aplikacji mobilnej
- Development aplikacji webowej
- Integracja z systemami płatniczymi

**Rozdział 4. Testowanie i wdrażanie**
- Strategia testowania
- Testy jednostkowe i integracyjne
- Testy bezpieczeństwa
- Wdrażanie i konfiguracja

**Rozdział 5. Podsumowanie i wnioski**
- Ocena zrealizowanych celów
- Analiza wyników
- Propozycje dalszego rozwoju

### 6. Metodyka pracy

Praca została zrealizowana zgodnie z metodyką Agile, z wykorzystaniem następujących praktyk:
- Iteracyjne planowanie i development
- Ciągła integracja i deployment (CI/CD)
- Code review i pair programming
- Test-driven development (TDD)
- Regularne demonstracje funkcjonalności

Realizacja projektu objęła 6 miesięcy intensywnej pracy, obejmującej analizę wymagań, projektowanie, implementację, testowanie oraz dokumentację.

---

*Autor:* [Imię i Nazwisko]
*Kierunek:* [Kierunek studiów]
*Rok akademicki:* 2024/2025
