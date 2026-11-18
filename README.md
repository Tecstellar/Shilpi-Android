# Shilpi Android Client

## Overview
Native Android mobile client for the Shilpi Studio ERP platform, built using React Native 0.88, Expo 58, TypeScript, and Zustand. Provides bridal beauticians and salon owners with appointment scheduling, financial ledgers, client CRM, portfolio lookbooks, and terminal QR pairing.

## Interface
- **Application Entry**: `index.js` and `App.tsx` bootstrapping global state, safe areas, and fonts.
- **Application Entry & Navigation**: `App.tsx` controls screen transitions (`splash`, `login_phone`, `login_otp`, `setup`, `dashboard`, `qr_scanner`) via state machine.
- **Main Container**: `src/screens/MainAppContainer.tsx` manages active tabs and overlay sheets:
  - **Tabs (`src/components/BottomTabBar.tsx`)**:
    - `home`: `HomeScreen` (Revenue stats, upcoming bookings, calendar)
    - `orders`: `OrdersScreen`, `OrderDetailScreen`, `NewBookingScreen`
    - `clients`: `ClientsScreen`, `ClientDetailScreen`, `NewClientScreen`
    - `packages`: `PackagesScreen` (Bridal, hair, and makeup service catalog)
    - `more`: `DrawerMenu.tsx` (Gallery, Payments, Expenses, Reminders, Reports, Subscription, Settings)
  - **Standalone Modals**: `QrScannerScreen`, `ActionBottomSheet`
- **Core Domain Services**:
  - `src/services/apiClient.ts`: Configured API client with automatic JWT token attachment and LAN IP resolution (`http://172.22.14.80:4000/api/v1`).
  - `src/services/socketService.ts`: Real-time WebSocket manager for instant web terminal QR pairing.
  - `src/repositories/`: Local state persistence and remote API syncing abstractions.
- **Theme System**: `src/theme/`
  - Indian cultural color palettes (`Signature Pink`, `Kumkum Red`, `Mehendi Green`, `Indigo Blue`).
  - Strict dark and light mode theme tokens.

## Invariants
- `[apiClient.ts:JWT]` Authenticated requests must attach valid Bearer tokens retrieved from `@react-native-async-storage/async-storage`.
- `[financialDisplay]` All financial values received from the backend are represented in paise integers and must be converted to standard INR via `Intl.NumberFormat('en-IN')` upon display.
- `[theme/index.ts:Tokens]` UI components must reference centralized design tokens; raw inline color literals outside the theme system are restricted.

## Side Effects
- HTTP REST API calls to `shilpi-backend` on port `4000`.
- Socket.io connection for bidirectional QR authorization.
- Reads device contact directory via `expo-contacts` for bulk client importing.
- Accesses camera via `expo-camera` to scan web pairing QR codes.
- Writes invoice PDFs and image snapshots to local disk via `expo-file-system` and shares via `expo-sharing`.

## Verification
- Run: `npm test`
