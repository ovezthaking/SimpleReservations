# 🎯 SimpleReservations

**Prosty i intuicyjny system rezerwacji dla wszystkiego**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://simplereservations.vercel.app/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green?style=flat&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> 🚀 **Demo na żywo**: [https://simplereservations.vercel.app/](https://simplereservations.vercel.app/) 

> 🚀 **Zainstaluj package**:   
```bash
npm i simplereservations
```

## ✨ O projekcie

SimpleReservations to nowoczesny system rezerwacji stworzony z myślą o prostocie i efektywności. Pierwotnie zaprojektowany dla drukarek 3D, może być łatwo dostosowany do rezerwacji dowolnych zasobów - sal konferencyjnych, sprzętu, pojazdów czy innych udostępnianych obiektów.

### 🎯 Główne funkcje

- **📅 Intuicyjne zarządzanie rezerwacjami** - Łatwe dodawanie, edytowanie i usuwanie rezerwacji
- **⏰ Zarządzanie czasem** - Elastyczne ustawianie godzin i czasu trwania (1-12h)
- **👥 Identyfikacja użytkowników** - Przypisywanie rezerwacji do konkretnych osób
- **📋 Projekty i notatki** - Możliwość dodawania dodatkowych informacji
- **🔄 Real-time sync** - Synchronizacja w czasie rzeczywistym dzięki Supabase
- **📱 Responsive design** - Pełna responsywność na wszystkich urządzeniach
- **🌐 Status połączenia** - Wizualna informacja o stanie połączenia z bazą danych

### 🎨 Interfejs użytkownika

- **Nadchodzące rezerwacje** - Wyróżnione zielonym kolorem z pełnymi opcjami zarządzania
- **Historia rezerwacji** - Przejrzysta lista przeszłych rezerwacji
- **Modal formularz** - Elegancki formularz dodawania/edycji rezerwacji
- **Ikonografia** - Intuicyjne ikony z biblioteki Lucide React

## 🛠️ Stack technologiczny

### Frontend
- **React 19.1.0** - Najnowsza wersja biblioteki React
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Lucide React** - Nowoczesne ikony SVG

### Backend & Baza danych
- **Supabase** - Backend-as-a-Service z PostgreSQL
- **Real-time subscriptions** - Automatyczne odświeżanie danych

### Narzędzia deweloperskie
- **Create React App** - Szybkie środowisko deweloperskie
- **ESLint** - Linting kodu JavaScript/React
- **Jest & Testing Library** - Testy jednostkowe i integracyjne

## 🚀 Szybki start

### Wymagania
- Node.js (wersja 16+ zalecana)
- npm lub yarn
- Konto Supabase (dla bazy danych)

### Instalacja

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/ovezthaking/simplereservations.git
cd simplereservations
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj Supabase**
   - Utwórz projekt na [supabase.com](https://supabase.com)
   - Skopiuj URL i klucz API
   - Zaktualizuj [`src/supabaseClient.js`](src/supabaseClient.js) swoimi danymi

4. **Utwórz tabelę w Supabase**
```sql
CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  project TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Włącz Real-time dla tabeli
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
```

5. **Uruchom aplikację**
```bash
npm start
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

## 📁 Struktura projektu

```
simplereservations/
├── public/                 # Pliki statyczne
│   ├── index.html         # Główny plik HTML
│   ├── manifest.json      # Manifest PWA
│   └── favicon.ico        # Ikona aplikacji
├── src/
│   ├── App.js             # Główny komponent aplikacji
│   ├── App.css            # Style CSS dla App
│   ├── index.js           # Punkt wejścia React
│   ├── index.css          # Główne style (Tailwind)
│   ├── supabaseClient.js  # Konfiguracja Supabase
│   └── setupTests.js      # Konfiguracja testów
├── package.json           # Zależności i skrypty
├── tailwind.config.js     # Konfiguracja Tailwind CSS
└── README.md             # Ten plik
```

## 🧪 Testowanie

```bash
# Uruchom testy
npm test

# Uruchom testy z coverage
npm test -- --coverage
```

## 🏗️ Build i deployment

```bash
# Zbuduj aplikację do produkcji
npm run build

# Katalog build/ będzie zawierał zoptymalizowane pliki gotowe do wdrożenia
```

### Deployment na Vercel

1. Połącz swoje repozytorium GitHub z Vercel
2. Vercel automatycznie wykryje projekt React
3. Ustaw zmienne środowiskowe dla Supabase (jeśli używasz)
4. Deploy zostanie wykonany automatycznie

## 🎛️ Konfiguracja

### Dostosowanie do własnych potrzeb

1. **Zmiana typu zasobu**: Edytuj tytuły i etykiety w [`src/App.js`](src/App.js)
2. **Dostosowanie stylów**: Modyfikuj klasy Tailwind lub dodaj własne style
3. **Nowe pola**: Rozszerz formularz i model danych w bazie

### Zmienne środowiskowe

Dla bezpieczeństwa, przenieś konfigurację Supabase do zmiennych środowiskowych:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 API Endpoints

Aplikacja korzysta z automatycznych endpointów Supabase:

- `GET /reservations` - Pobieranie wszystkich rezerwacji
- `POST /reservations` - Tworzenie nowej rezerwacji
- `PUT /reservations/:id` - Aktualizacja rezerwacji
- `DELETE /reservations/:id` - Usuwanie rezerwacji

## 🤝 Contribute

Chcesz pomóc w rozwoju projektu?

1. Fork repozytorium
2. Utwórz branch dla swojej funkcji (`git checkout -b feature/AmazingFeature`)
3. Commit swoich zmian (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 🐛 Zgłaszanie błędów

Jeśli znajdziesz błąd lub masz sugestię:

1. Sprawdź, czy issue już nie istnieje
2. Otwórz nowy issue z dokładnym opisem
3. Dołącz kroki reprodukcji błędu

## 📄 Licencja

Ten projekt jest udostępniony na licencji **CC0 1.0 Universal** - zobacz plik [`LICENSE`](LICENSE) po szczegóły.

Oznacza to, że możesz swobodnie używać, modyfikować i dystrybuować ten kod w dowolnym celu, w tym komercyjnym.

## 👥 Autorzy

- **Oliwer Urbaniak** - *Główny deweloper* - [@OveZThaKing](https://github.com/ovezthaking)

## 🙏 Podziękowania

- [Create React App](https://create-react-app.dev/) - za świetne środowisko startowe
- [Supabase](https://supabase.com/) - za niesamowity BaaS
- [Tailwind CSS](https://tailwindcss.com/) - za fenomenalny CSS framework
- [Lucide](https://lucide.dev/) - za piękne ikony
- [Vercel](https://vercel.com/) - za łatwy deployment

---

⭐ **Jeśli projekt Ci się podoba, zostaw gwiazdkę!** ⭐