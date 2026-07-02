# Requirements Document

## Introduction

This document defines the requirements for the **Emergency SOS Enhancements** feature set of the Panic Ring personal safety application. The existing app provides an SOS panic button (hold-to-trigger, urgent/discreet/check-in modes), emergency contacts stored in SQLite (name, phone, email, priority), WhatsApp alert notifications, a live map with Leaflet, and JWT authentication.

The six enhancements described here extend the app's SOS capabilities based on a UI mockup:

1. **Tap-4x Hidden SOS Trigger** — a silent, screen-tap-based SOS activation that works without opening the app explicitly.
2. **Emergency Calling Screen** — a full-screen overlay displayed when SOS is triggered, showing a countdown, "Emergency Calling…" text, and animated contact avatars.
3. **Contact Safe-Status Badges** — each emergency contact card displays a colour-coded "Safe" or "Alert" status pill reflecting whether the contact has acknowledged the alert.
4. **Call Police Button** — a prominent button on the active-alert/home screen that dials the configured emergency services number (default `10111` for South Africa).
5. **Live Contact Map** — the map view shows avatar pins for the locations of emergency contacts, not just the user's own location.
6. **"Need Help" Info Card** — when an alert is active, a contextual card displays the user's address, alert timestamp, phone number, and a Call Police button.

The app is built with React + Vite (frontend) and Node.js + Express + SQLite (backend). The frontend uses TanStack Query for data fetching, Framer Motion for animation, Leaflet for maps, and Tailwind CSS for styling.

---

## Glossary

- **App**: The Panic Ring React + Vite progressive web application.
- **Backend**: The Node.js + Express + SQLite server.
- **Alert**: A panic event record in the `alerts` table with a `status` of `active` or `resolved`.
- **Contact**: An emergency contact record in the `emergency_contacts` table belonging to a specific user.
- **Contact_Status**: A per-contact acknowledgement flag (`safe` or `alert`) stored alongside the Alert record indicating whether the Contact has confirmed awareness.
- **Emergency_Number**: The telephone number used to contact public emergency services; configurable per user, default `10111` (South Africa).
- **Tap_Zone**: A configurable, invisible rectangular tap-target rendered over the screen that detects a rapid 4-tap sequence.
- **Emergency_Calling_Screen**: A full-screen React overlay displayed immediately after SOS is triggered, showing a countdown timer, status text, and animated Contact avatar rings.
- **Need_Help_Card**: A card component rendered on the home screen while an Alert is active, displaying the user's address, alert timestamp, registered phone number, and a Call Police button.
- **Contact_Map**: The map view that renders avatar pins for each Contact whose location has been shared, in addition to the user's own alert pin.
- **Avatar_Pin**: A Leaflet `DivIcon` displaying a Contact's initials inside a styled circle, placed at the Contact's last known coordinates.

---

## Requirements

### Requirement 1: Tap-4x Hidden SOS Trigger

**User Story:** As a user in a dangerous situation where I cannot visibly interact with my phone, I want to tap a specific area of the screen four times rapidly to silently trigger an SOS alert so that I can call for help without attracting attention.

#### Acceptance Criteria

1. WHEN the App is open and the user is authenticated, THE App SHALL render an invisible Tap_Zone overlay of at least 44×44 CSS pixels in the bottom-right corner of the screen.
2. WHEN the Tap_Zone detects 4 taps within a 2-second window, THE App SHALL trigger an Alert with `trigger_method` set to `tap_4x`.
3. WHEN a Tap_Zone trigger fires, THE App SHALL display the Emergency_Calling_Screen immediately without requiring additional confirmation.
4. THE App SHALL apply a 15-second cooldown after a Tap_Zone trigger to prevent duplicate Alerts.
5. IF an Alert is already active when the Tap_Zone detects 4 taps, THEN THE App SHALL not create a duplicate Alert and SHALL display the Emergency_Calling_Screen for the existing Alert.
6. THE App SHALL record the Tap_Zone trigger in the Alert record alongside the standard `trigger_method` field.
7. WHERE the user has disabled the tap trigger in Settings, THE App SHALL not render the Tap_Zone overlay.

---

### Requirement 2: Emergency Calling Screen

**User Story:** As a user who has triggered an SOS, I want to see a clear full-screen overlay that shows me a countdown and which contacts are being called so that I know help is on the way.

#### Acceptance Criteria

1. WHEN an Alert is created by any trigger method, THE App SHALL display the Emergency_Calling_Screen as a full-screen overlay above all other UI elements.
2. THE Emergency_Calling_Screen SHALL display a large countdown number that starts at 5 and decrements by 1 each second.
3. WHEN the countdown reaches 0, THE Emergency_Calling_Screen SHALL transition to displaying "Emergency Calling…" text in place of the countdown number.
4. THE Emergency_Calling_Screen SHALL render an avatar ring for each of the user's Contacts, animated to radiate outward from the centre of the screen to indicate notification is in progress.
5. WHEN the user taps a "Cancel" button on the Emergency_Calling_Screen before the countdown reaches 0, THE App SHALL cancel the pending Alert, dismiss the overlay, and not notify Contacts.
6. WHEN the countdown completes and the alert is sent, THE App SHALL dismiss the Emergency_Calling_Screen and return to the home screen with the active Alert state visible.
7. THE Emergency_Calling_Screen SHALL prevent interaction with the underlying UI while it is displayed.
8. IF the App loses focus while the Emergency_Calling_Screen is visible, THE App SHALL continue the countdown in the background using a Web Worker or `setInterval` fallback.

---

### Requirement 3: Contact Safe-Status Badges

**User Story:** As a user with an active alert, I want to see at a glance whether each contact has acknowledged my distress call so that I know who is aware and who has not responded.

#### Acceptance Criteria

1. WHEN an Alert is active, THE App SHALL display a status badge on each ContactCard in the contacts list, showing either "Safe" (green pill) or "Alert" (red pill) based on the Contact_Status for that Alert.
2. THE Backend SHALL expose a `PATCH /api/entities/alerts/:id/contact-status` endpoint that accepts `{ contact_phone, status }` where `status` is `safe` or `alert`, and updates the Contact_Status record for that Alert.
3. WHEN a Contact acknowledges an alert via the WhatsApp notification link, THE Backend SHALL update the Contact_Status to `safe` for that Contact on the associated Alert.
4. THE App SHALL poll the current Alert's Contact_Status data at intervals of no more than 30 seconds while an Alert is active.
5. WHEN no Alert is active, THE App SHALL render ContactCards without status badges.
6. THE Backend SHALL store Contact_Status data as a JSON field `contact_statuses` on the Alert record, mapping `contact_phone` to `safe` or `alert`.
7. WHEN an Alert is resolved, THE App SHALL clear all Contact_Status badges from the ContactCards.

---

### Requirement 4: Call Police Button

**User Story:** As a user in an active emergency, I want a single, prominent button that immediately dials the local emergency services number so that I can get professional help without searching for the number.

#### Acceptance Criteria

1. WHEN an Alert is active, THE App SHALL display a "Call Police" button prominently on the home screen and on the Need_Help_Card.
2. WHEN the user taps the "Call Police" button, THE App SHALL initiate a phone call to the Emergency_Number using `window.location.href = 'tel:<Emergency_Number>'`.
3. THE App SHALL use `10111` as the default Emergency_Number for all users unless overridden in the user's safety profile.
4. WHEN the user taps the "Call Police" button, THE App SHALL log the call attempt in the active Alert record with a timestamp via a `PATCH` request to the Backend.
5. THE App SHALL allow the user to configure the Emergency_Number in the Settings page to support regional variants (e.g., `911`, `999`, `112`).
6. IF the user taps "Call Police" and there is no active telephony capability (e.g., a non-phone browser), THE App SHALL display a visible message showing the Emergency_Number for the user to dial manually.

---

### Requirement 5: Live Contact Map

**User Story:** As a user or emergency contact monitoring an alert, I want the map view to show where my emergency contacts are located so that I can understand who is nearby and able to help.

#### Acceptance Criteria

1. WHEN the map view is rendered, THE App SHALL display an Avatar_Pin for each Contact that has a known last location, in addition to any active Alert pins.
2. THE Backend SHALL expose a `GET /api/entities/emergency_contacts/locations` endpoint that returns the last known location (latitude, longitude, last_location_update) for each of the authenticated user's Contacts who have opted in to location sharing.
3. WHEN a Contact's location data is older than 60 minutes, THE App SHALL render the Avatar_Pin with a reduced opacity of 0.4 to indicate a stale location.
4. THE App SHALL label each Avatar_Pin with the Contact's initials, rendered inside a coloured circle consistent with the Contact's relationship colour scheme used on ContactCards.
5. WHEN the user taps an Avatar_Pin, THE App SHALL display a popup showing the Contact's name, relationship, and the time the location was last updated.
6. THE App SHALL refresh Contact location data on the map at intervals of no more than 60 seconds while the map view is visible.
7. WHERE a Contact has not shared their location, THE App SHALL not render an Avatar_Pin for that Contact.

---

### Requirement 6: "Need Help" Info Card

**User Story:** As a user with an active alert, I want a card at the bottom of my screen showing my current address, the time the alert started, my phone number, and a call police button so that I have all critical information in one place and can act immediately.

#### Acceptance Criteria

1. WHEN an Alert is active, THE App SHALL render the Need_Help_Card on the home screen below the active alert banner.
2. THE Need_Help_Card SHALL display the address associated with the active Alert, falling back to the user's last known GPS coordinates formatted as decimal degrees if no address is available.
3. THE Need_Help_Card SHALL display the timestamp of the active Alert formatted in the `Africa/Johannesburg` timezone using the format `HH:mm · DD MMM YYYY`.
4. THE Need_Help_Card SHALL display the user's registered phone number from the safety profile.
5. THE Need_Help_Card SHALL include a "Call Police" button that behaves identically to the button defined in Requirement 4.
6. WHEN the active Alert's address is updated by the Backend (e.g., via reverse geocoding), THE App SHALL re-render the Need_Help_Card with the updated address within the next polling interval (no more than 30 seconds).
7. WHEN no Alert is active, THE App SHALL not render the Need_Help_Card.
8. THE Need_Help_Card SHALL be visible without scrolling on devices with a viewport height of 600 CSS pixels or greater when no other expanded components are present above it.

---
