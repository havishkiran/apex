# Design Brief — Apex (Motorcycle Ride-Tracking App, iOS)

I'm designing a mobile app that automatically tracks motorcycle rides — recording GPS routes, live stats, and ride history across multiple bikes, with support for pairing external Bluetooth GPS devices for better accuracy. Design for **iOS, portrait orientation, modern iPhone sizes**.

---

## Brand

- **App name:** Apex
- **Tagline:** hit your apex
- **Meaning:** "apex" is the cornering term — the point you clip on the inside of a turn. Riders know it instantly; it's aspirational and renders cleanly as a bold wordmark.

### Logo
A bold letter "A" whose **sharp top point is the apex**, with a small light dot marking that peak and a gentle curved crossbar representing the racing line through the corner. Orange mark on a dark rounded app-icon tile. The mark stays legible at favicon size and works in monochrome (dark mark on light, or light mark on dark).

### Color palette
| Role | Hex | Usage |
|------|-----|-------|
| Accent / safety-orange | `#FF6B1A` | Active & recording states, live route line, the logo mark — **the only color** |
| Tile / surface dark | `#17191D` | App-icon tile, dark cards |
| Border (on dark) | `#2A2D33` | Subtle 1px separators |
| Text / off-white | `#F2F2F0` | Primary text and readouts on dark |
| Map base | dark theme | So the orange route + white readouts are the highest-contrast elements |

Everything outside the accent is muted grayscale.

---

## Design Direction

Dark-first, high-contrast, glanceable. A rider should be able to read the key number in under a second at a stoplight.

- Bold typography for live metrics; instrument-cluster clarity, not a social feed
- Generous touch targets — gloves are a real use case
- Minimal chrome, muted grayscale base
- Safety-orange `#FF6B1A` reserved for active/recording states and the live route line
- Dark-themed base map
- Avoid the generic SaaS-dashboard look

---

## Screens

### 1. Track (home)
Full-bleed dark map with the live route drawing in safety-orange as you ride. A prominent stat band showing **current speed, distance, and elapsed time**. One large start/stop record control. Subtle indicator showing GPS source (phone vs. external device) and signal quality.

### 2. Ride Detail
The completed route on a map, a stats summary (distance, duration, avg/max speed, elevation gain), and graphs for **speed** and **elevation** over the ride. Title/date, and which bike was used.

### 3. History
Scrollable list of past rides as cards (route thumbnail, date, distance, duration). Filterable by vehicle. Clear empty state.

### 4. Garage
Manage multiple bikes. Each vehicle as a card with name, photo, and lifetime stats (total distance, ride count). Add/edit vehicle flow.

### 5. Devices
Pair and manage external BLE GPS trackers. Show discovered devices, connection status, and battery level if available. Clear connected / searching / disconnected states.

### 6. Settings
Units (mi/km), default GPS source, vehicle selection, and permission status indicators.

---

## States to Include

- **Track:** recording vs. idle
- **Devices:** connected vs. searching vs. disconnected
- **History & Garage:** empty states

---

## Technical Context
*(for grounding, not a visual concern)*

Built in **React Native via Expo with development builds**. Real-time map, on-device SQLite storage, background GPS, and BLE device pairing. Design components should map cleanly to standard React Native components — nothing requiring exotic native UI.

Asset sizes the build will need: app icon at 1024×1024, adaptive-icon foreground, splash logo, and a monochrome tab-bar mark.

---

**Start with the Track screen** — it's the heart of the app and sets the visual language the other five inherit.
