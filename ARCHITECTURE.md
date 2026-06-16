# ASU Course React Admin — Architecture Guide

> Skills, rules, and conventions for building and extending this project.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Path Aliases](#path-aliases)
4. [Environment & Runtime Config](#environment--runtime-config)
5. [API Layer](#api-layer)
6. [State Management](#state-management)
7. [Routing](#routing)
8. [Hooks](#hooks)
9. [Component Conventions](#component-conventions)
10. [Styling](#styling)
11. [Security Patterns](#security-patterns)
12. [Build & Deploy](#build--deploy)
13. [Rules & Constraints](#rules--constraints)

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| View | React | 19.x |
| Bundler | Vite + SWC | 7.x |
| UI | Chakra UI v3 | 3.x |
| State | MobX + mobx-persist-store | 6.x |
| Server state | React Query | 3.x |
| HTTP | Axios | 1.x |
| Routing | React Router | 7.x |
| Styles | Sass + Chakra | — |
| Auth | Firebase (Google) | 12.x |
| Payment | Stripe | 5.x |
| Animation | Framer Motion | 12.x |
| Charts | ECharts + echarts-for-react | 6.x |
| Icons | react-icons | 5.x |

---

## Folder Structure

```
/
├── src/
│   ├── api/
│   │   ├── services/                # One file per domain
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── course.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── chat.service.js
│   │   │   ├── enrollment.service.js
│   │   │   ├── feedback.service.js
│   │   │   ├── file.service.js
│   │   │   ├── certificates.service.js
│   │   │   └── email-analytics.service.js
│   │   ├── httpRequest.js           # Main axios instance (encrypted)
│   │   ├── httpAuthRequest.js       # Auth-specific axios instance
│   │   ├── httpGatewayRequest.js    # Gateway axios instance
│   │   └── queryClient.js           # React Query client
│   ├── components/                  # Shared, reusable UI
│   │   ├── ui/                      # Chakra UI provider/utils
│   │   │   ├── provider.jsx
│   │   │   ├── color-mode.jsx
│   │   │   └── toaster.jsx
│   │   ├── Buttons/
│   │   │   ├── PrimaryButton.jsx
│   │   │   ├── SecondaryButton.jsx
│   │   │   └── TertiaryButton.jsx
│   │   ├── Header/
│   │   ├── widgets/
│   │   └── [other shared components]
│   ├── modules/                     # Feature modules (self-contained)
│   │   ├── Auth/
│   │   │   ├── Login/
│   │   │   ├── SignUp/
│   │   │   └── ConfirmPage/
│   │   ├── Main/
│   │   ├── MyCourses/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── Payment/
│   │   ├── Settings/
│   │   ├── Chat/
│   │   ├── FAQ/
│   │   └── NotFound/
│   ├── layouts/
│   │   ├── MainLayout/
│   │   ├── AuthLayout/
│   │   └── SettingsLayout/
│   ├── store/
│   │   ├── auth.store.js
│   │   ├── app.store.js
│   │   └── chat.store.js
│   ├── hooks/                       # Global hooks
│   │   └── useSubscriptionStatus.js
│   ├── router/
│   │   └── index.jsx
│   ├── config/
│   │   ├── runtime-config.js        # Env resolution
│   │   └── firebase.js
│   ├── utils/
│   │   ├── crypto.js                # AES-256-GCM encryption
│   │   ├── formatPrice.js
│   │   └── index.js
│   ├── scss/
│   │   └── main.scss
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── docs/                        # Internal dev docs
│   ├── App.jsx
│   ├── firebase.js
│   └── main.jsx
├── public/
├── helm/                            # K8s Helm charts
├── vite.config.js
├── jsconfig.json
├── eslint.config.js
└── .env / .env.dev / .env.staging / .env.production
```

---

## Path Aliases

All aliases resolve from `/src`. Never use relative paths like `../../components`.

```js
// jsconfig.json + vite.config.js
components/*   → src/components/*
api/*          → src/api/*
assets/*       → src/assets/*
hooks/*        → src/hooks/*
layouts/*      → src/layouts/*
modules/*      → src/modules/*
store/*        → src/store/*
utils/*        → src/utils/*
scss/*         → src/scss/*
router         → src/router/index.jsx
locale/*       → src/locale/*
```

**Usage:**
```js
import PrimaryButton from "components/Buttons/PrimaryButton";
import authStore from "store/auth.store";
import { formatPrice } from "utils/formatPrice";
```

---

## Environment & Runtime Config

Always import env variables from `config/runtime-config.js`, **never** from `import.meta.env` directly.

```js
// src/config/runtime-config.js
// Falls back: window.__ENV__ (Docker) → import.meta.env (local)
export const VITE_ADMIN_BASE_URL = ...;
export const VITE_AUTH_BASE_URL  = ...;
export const VITE_ENCRYPTION_KEY = ...;
export const VITE_ENVIRONMENT_ID = ...;
export const VITE_PROJECT_ID     = ...;
export const VITE_API_KEY        = ...;
```

**Rule:** `window.__ENV__` is injected by Docker at runtime for production. Always go through `runtime-config.js` so the same code works in all environments.

---

## API Layer

### Three Axios Instances

| Instance | File | Base URL | Use For |
|---|---|---|---|
| `httpRequest` | `api/httpRequest.js` | `VITE_ADMIN_BASE_URL` | All standard API calls |
| `httpAuthRequest` | `api/httpAuthRequest.js` | `VITE_AUTH_BASE_URL` | Auth endpoints (login, refresh) |
| `httpGatewayRequest` | `api/httpGatewayRequest.js` | `VITE_ADMIN_BASE_URL` | Gateway-wrapped calls |

**httpRequest** — the primary instance:
- Timeout: 40 s
- `withCredentials: true`
- Request interceptor: encrypts POST/PUT bodies (AES-256-GCM) when `VITE_ENCRYPTION_KEY` is set
- Response interceptor: decrypts responses, unwraps to `response?.data`
- 401 → `authStore.logout()`

**httpGatewayRequest** wraps payloads:
```js
{ data: { method, table, object_data } }
```
Unwraps response to `response?.data?.data?.data`.

### Service File Pattern

Each domain gets one service file that owns raw HTTP calls and exports React Query hooks.

```js
// api/services/user.service.js
import httpRequest from "api/httpRequest";
import { useQuery, useMutation } from "react-query";

const userService = {
  getUsers:    ()         => httpRequest.get("/v1/user"),
  getUserById: (id)       => httpRequest.get(`/v1/user/${id}`),
  updateUser:  (id, data) => httpRequest.put(`/v1/user/${id}`, data),
  deleteUser:  (id)       => httpRequest.delete(`/v1/user/${id}`),
};

export const useUsersListQuery = (options = {}) =>
  useQuery(["USERS_LIST"], userService.getUsers, options);

export const useUpdateUserMutation = (options) =>
  useMutation(({ id, data }) => userService.updateUser(id, data), options);

export default userService;
```

**Rules:**
- Raw service object at the top, React Query hooks below.
- Query keys are `SCREAMING_SNAKE_CASE` strings or arrays: `["USER", id]`.
- Never call `httpRequest` directly inside a component. Always go through a service.
- Mutations receive a single object argument so destructuring stays clean: `({ id, data })`.

### React Query Client

```js
// api/queryClient.js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
```

**Rules:**
- `retry: false` — don't retry on failure; auth errors should fail fast.
- `refetchOnWindowFocus: false` — admin data doesn't need background refresh.
- Invalidate queries after mutations via `queryClient.invalidateQueries(key)`.

---

## State Management

MobX is used **only** for client-side global state that must persist across routes and page refreshes. React Query owns all server state.

### Stores

| Store | File | Persisted Keys | Purpose |
|---|---|---|---|
| Auth | `store/auth.store.js` | `isAuthorized`, `user` | Auth token, user profile |
| App | `store/app.store.js` | `language`, `deviceId` | Language, device fingerprint |
| Chat | `store/chat.store.js` | `closedSessions` | Which chat sessions user closed |

### Store Pattern

```js
// store/auth.store.js
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

class AuthStore {
  isAuthorized = false;
  user = null;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: "AuthStore",
      properties: ["isAuthorized", "user"],
      storage: window.localStorage,
    });
  }

  setCredentials(data) { /* ... */ }
  setIsAuthorized(val) { this.isAuthorized = val; }
  setUser(user)        { this.user = user; }
  logout()             { this.isAuthorized = false; this.user = null; }
}

export default new AuthStore();
```

**Rules:**
- Singleton — each store file exports a `new Store()` instance.
- `makeAutoObservable` + `makePersistable` in every store constructor.
- Wrap consuming components in `observer()` from `mobx-react-lite`.
- Only store truly global, persistent state in MobX. Local UI state lives in `useState`.

### Usage in Components

```jsx
import { observer } from "mobx-react-lite";
import authStore from "store/auth.store";

const Profile = observer(() => {
  return <div>{authStore.user?.name}</div>;
});
```

---

## Routing

File: `src/router/index.jsx`

The router is an `observer` component. It renders different route trees based on `authStore.isAuthorized`.

### Authenticated Routes

```
/ (MainLayout)
├── /                              Main dashboard
├── /my-courses                    MyCourses list
├── /my-courses/:id/content        Course content player
├── /my-courses/:id/content/finished  Completion page
├── /faq                           FAQ
├── /settings (SettingsLayout)
│   ├── /profile
│   └── /subscription
├── /chat/:id                      Chat detail
├── /payment/:courseId             One-time payment
└── /payment/subscription          Subscription payment
```

### Unauthenticated Routes

```
/ (AuthLayout)
├── /                              Login
├── /login-confirm                 OTP confirm
├── /sent-link                     Magic link sent
└── /sent-email                    Signup email sent
```

### Redirect Preservation

```js
const REDIRECT_KEY = "post_login_redirect";
// Before redirect to login: sessionStorage.setItem(REDIRECT_KEY, location.pathname)
// After login: navigate(sessionStorage.getItem(REDIRECT_KEY) || "/")
```

**Rules:**
- Add new protected pages inside the authenticated route tree only.
- New auth-flow pages go inside the unauthenticated tree under `AuthLayout`.
- Always use the `REDIRECT_KEY` pattern when redirecting unauthenticated users.

---

## Hooks

### Global Hooks (`src/hooks/`)

Hooks shared across multiple modules live here.

#### `useSubscriptionStatus`

```js
const {
  hasActiveSubscription, // boolean — status is 'active' or 'trialing'
  subscriptionLoading,
  isTrialing,
  trialEnd,              // timestamp | null
  subscriptionStatus,    // raw status string
} = useSubscriptionStatus();
```

### Module-Level Hooks (`src/modules/[Module]/hooks/`)

Hooks used only within one module live next to that module.

#### `useFeedbackTimer` (MyCourses)

Returns `true` after the user has been on a lesson atom for 30 seconds. Used to show a feedback prompt.

#### `useDevtoolsProtection` (MyCourses)

Detects DevTools open state and pauses video playback + blocks keyboard shortcuts for extracting content.

- Blocks: F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+Shift+U
- Detection: compares `window.outerWidth - window.innerWidth > 160`

### Hook Rules

- Name: always `use` prefix, camelCase — `useSubscriptionStatus`, not `SubscriptionStatusHook`.
- A hook that calls a React Query hook should live in a service file, not in `src/hooks/`.
- `src/hooks/` is for hooks with business logic that have no natural home in a service.
- Module hooks go in `src/modules/[Module]/hooks/`, not in global `src/hooks/`.

---

## Component Conventions

### File Naming

- Component files: PascalCase — `PrimaryButton.jsx`, `CourseCard.jsx`
- Folder name matches component name: `Header/index.jsx` exports `Header`
- Hook files: camelCase with `use` prefix — `useSubscriptionStatus.js`
- Service files: `[domain].service.js` — `user.service.js`
- Store files: `[domain].store.js` — `auth.store.js`

### Shared vs Module Components

| Where | What goes here |
|---|---|
| `src/components/` | Used by 2+ modules or by layouts |
| `src/modules/[M]/components/` | Used only inside that one module |

### Button Variants

Always use the pre-built button components. Do not write `<Button>` from Chakra directly in features.

```jsx
import PrimaryButton   from "components/Buttons/PrimaryButton";
import SecondaryButton from "components/Buttons/SecondaryButton";
import TertiaryButton  from "components/Buttons/TertiaryButton";
```

### Safe HTML Rendering

Never use `dangerouslySetInnerHTML` directly. Use the `HTMLRenderer` component which sanitizes via DOMPurify.

```jsx
import HTMLRenderer from "components/HTMLRenderer";
<HTMLRenderer html={course.description} />
```

### SVG Imports

SVGs are imported as React components via `vite-plugin-svgr`:

```jsx
import { ReactComponent as Logo } from "assets/icons/logo.svg";
// or
import LogoSrc from "assets/icons/logo.svg?url";
```

---

## Styling

- **Primary:** Chakra UI props (`color`, `px`, `mt`, etc.)
- **Global:** `src/scss/main.scss` — only for base resets and things Chakra cannot cover
- **Color mode:** Managed by Chakra's `next-themes` integration via `src/components/ui/color-mode.jsx`
- **Design tokens:** See `src/docs/brand.md` for the color palette and typography scale

**Rules:**
- Prefer Chakra props over writing SCSS for component-level styles.
- Do not add new `.scss` files for individual components.
- Do not use inline `style={{}}` except for dynamic values that can't be expressed as Chakra props.

---

## Security Patterns

### Request Encryption

All POST/PUT requests are encrypted when `VITE_ENCRYPTION_KEY` is set. This is handled automatically by `httpRequest.js`. You do not need to encrypt manually.

Algorithm: **AES-256-GCM** with anti-replay timestamp (±30 s window).

```
Payload → { payload: "<base64(nonce + tag + ciphertext)>" }
```

Response decryption is also automatic.

### HTML Sanitization

Use `DOMPurify` through the `HTMLRenderer` component. Never render raw backend HTML without sanitization.

### Content Protection (Video)

The `useDevtoolsProtection` hook in the MyCourses module automatically handles DevTools detection. Apply it to the course content player page, not globally.

### Mobile Blocking

The `MobileBlocker` component checks viewport width and blocks access on mobile devices. Applied at the layout level — do not add per-page.

### Local Environment Gate

`LocalPasswordGate` wraps the app in dev/staging to prevent unauthorized access to pre-production URLs.

---

## Build & Deploy

### Scripts

```bash
npm run dev       # Local dev server (Vite)
npm run build     # Production build → /dist
npm run preview   # Preview the /dist build locally
npm run lint      # ESLint
```

### Environment Files

| File | Used By |
|---|---|
| `.env` | Local default |
| `.env.dev` | Dev server deployment |
| `.env.staging` | Staging deployment |
| `.env.production` | Production deployment |

### Docker / Kubernetes

- Helm charts in `/helm` and `/.helm`
- `window.__ENV__` is injected at container startup to override env variables without rebuilding the image
- Always use `runtime-config.js` so this override works

---

## Rules & Constraints

### Do

- Import env variables from `config/runtime-config.js`
- Import HTTP instances only inside service files
- Export React Query hooks from service files alongside the raw service
- Wrap all components that read MobX stores in `observer()`
- Use path aliases (no relative `../../` imports)
- Use `HTMLRenderer` for any backend-supplied HTML
- Use pre-built Button components (`PrimaryButton`, etc.)
- Put module-specific components in `modules/[M]/components/`
- Put module-specific hooks in `modules/[M]/hooks/`

### Don't

- Don't call `httpRequest` / `httpAuthRequest` directly in components
- Don't store server state in MobX — that's React Query's job
- Don't use `dangerouslySetInnerHTML` directly
- Don't use `import.meta.env` directly in feature code
- Don't add new global SCSS files for component styles
- Don't add shared components to `modules/` — they belong in `components/`
- Don't create new stores without persisting them via `makePersistable`
- Don't use inline `style={{}}` for static values — use Chakra props

### Query Key Convention

```js
// Single resource list
["USERS_LIST"]
["COURSES_LIST"]

// Single resource by ID
["USER", id]
["COURSE", id]

// Nested
["USER_COURSES", userId]
```

### Mutation Pattern

```js
const { mutate, isLoading } = useUpdateUserMutation({
  onSuccess: () => {
    queryClient.invalidateQueries(["USERS_LIST"]);
    toast({ title: "Saved" });
  },
  onError: (err) => {
    toast({ title: "Error", description: err.message, status: "error" });
  },
});

// Call with a single object
mutate({ id: user.id, data: formValues });
```
