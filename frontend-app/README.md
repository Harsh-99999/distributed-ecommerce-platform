# springboot-ecommerce-frontend

React + Vite frontend for the [`springboot-ecommerce`](https://github.com/eaaslan/springboot-ecommerce) microservices backend.

**Stack:** React 18 (no TypeScript), React Router 6, native fetch, plain CSS. No Redux, no axios, no UI library — kept deliberately small and easy to follow.

## Pages

| Path | What it does |
|---|---|
| `/` | Catalog — paginated, searchable product grid (public) |
| `/products/:id` | Product detail + Add to Cart |
| `/login` | Email + password → JWT to `localStorage` |
| `/register` | Sign-up |
| `/cart` | Cart items, qty, remove, clear *(auth)* |
| `/checkout` | Card form + `Idempotency-Key` POST `/api/orders` *(auth)* |
| `/orders` | Order history *(auth)* |
| `/orders/:id` | Order detail with status, items, failure reason if cancelled *(auth)* |

## How it talks to the backend

- All HTTP goes to the API Gateway — `VITE_API_URL` env (default `http://localhost:8080`)
- Tiny `src/api/client.js` wrapper auto-attaches `Bearer` token from `localStorage`
- `Idempotency-Key` header on `POST /api/orders` is a fresh `crypto.randomUUID()` per checkout → safe to retry network errors
- `AuthContext` handles login/register/logout + auto-fetches `/api/users/me` on app boot if a token is present
- `CartContext` syncs cart state with backend after every mutation (no optimistic UI to keep it simple)

## Run

```bash
# 1) Start the backend (separate repo)
cd ../springboot-ecommerce
./scripts/smoke-test.sh   # also serves as a sanity check the backend works

# 2) Frontend
cd ../springboot-ecommerce-frontend
npm install
npm run dev
# → http://localhost:5173
```

The backend gateway already CORS-allows `http://localhost:5173`.

## Build & preview

```bash
npm run build         # production bundle into ./dist
npm run preview       # serves dist/ on http://localhost:4173 (also CORS-allowed)
```

## Folder structure

```
src/
├── api/client.js         # fetch wrapper (Bearer + Idempotency-Key support)
├── auth/AuthContext.jsx  # login, register, logout, /me on boot
├── cart/CartContext.jsx  # cart state synced with backend
├── components/
│   ├── Header.jsx        # nav + cart pill + user menu
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Login.jsx          Register.jsx
│   ├── Catalog.jsx        ProductDetail.jsx
│   ├── Cart.jsx           Checkout.jsx
│   └── Orders.jsx         (OrderList + OrderDetail)
├── App.jsx               # router + providers
├── main.jsx              # entry
└── index.css             # all styles
```

## Test cards

| Card number | Outcome |
|---|---|
| `4111 1111 1111 1111` | Success → order CONFIRMED |
| `4111 1111 1111 1115` | Decline (saga compensation kicks in → CANCELLED) |

## Notlar (TR)

- Token `localStorage`'da. Production'da HttpOnly cookie tercih edilir (XSS koruması) — bu öğrenme projesi olduğu için basit tuttuk.
- `CartContext.refresh()` her mutation sonrası backend'den çekiyor — optimistik UI yok ki state-mismatch bug'ı olmasın.
- `/checkout` yeni bir `Idempotency-Key` UUID üretiyor; aynı POST'u 2 kere yollasan da arka taraf aynı `orderId` döndürür (double-charge yok).
- Logout sadece local'i temizler; backend'de stateless JWT. Refresh token revoke için backend'in `/api/auth/logout` route'u var ama UI'a wire'lı değil.

## Deployment

```bash
npm run build
# Push dist/ to:
# - Vercel:  vercel deploy
# - Netlify: netlify deploy --prod --dir=dist
# - GitHub Pages: gh-pages -d dist
# - Static hosting: any web server can serve the dist/ folder
```

Production'da `.env.production` ile `VITE_API_URL=https://api.your-domain.com` set et.
