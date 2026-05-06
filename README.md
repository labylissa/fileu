# Fileu — Gestion locative sans agence

## Stack

- **Backend** : FastAPI + SQLAlchemy async + PostgreSQL + JWT
- **Frontend** : React + Vite + TailwindCSS
- **Infra** : Docker Compose

---

## Démarrage rapide

### 1. Variables d'environnement

```bash
cp .env.example .env
# Génère une vraie clé JWT :
openssl rand -hex 32
# Colle le résultat dans JWT_SECRET_KEY dans .env
```

### 2. Lancer avec Docker

```bash
docker-compose up --build
```

Les services :
| Service   | URL                        |
|-----------|----------------------------|
| API       | http://localhost:8000      |
| Docs API  | http://localhost:8000/docs |
| Frontend  | http://localhost:3000      |
| pgAdmin   | http://localhost:5050      |

### 3. Migrations (première fois ou après modif de modèles)

```bash
# Depuis la racine du projet
docker-compose exec backend alembic -c backend/alembic.ini upgrade head
```

---

## Endpoints auth (Sprint 1)

| Méthode | Route                    | Description              |
|---------|--------------------------|--------------------------|
| POST    | /api/v1/auth/register    | Créer un compte          |
| POST    | /api/v1/auth/login       | Se connecter (JWT)       |
| POST    | /api/v1/auth/refresh     | Renouveler le token      |
| GET     | /api/v1/auth/me          | Profil utilisateur connecté |
| GET     | /health                  | Health check             |

### Exemple register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "bailleur@test.com", "password": "motdepasse", "role": "bailleur"}'
```

### Exemple login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bailleur@test.com", "password": "motdepasse"}'
```

---

## Structure du projet

```
fileu/
├── backend/
│   ├── alembic/              # Migrations DB
│   │   └── versions/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py     # Settings (pydantic-settings)
│   │   │   └── security.py   # JWT + hash
│   │   ├── db/
│   │   │   ├── base.py       # Base SQLAlchemy
│   │   │   └── session.py    # Engine + get_db
│   │   ├── models/
│   │   │   └── user.py       # User, Property, Contract
│   │   ├── routers/
│   │   │   └── auth.py       # Endpoints auth
│   │   ├── schemas/
│   │   │   └── user.py       # Pydantic schemas
│   │   ├── deps.py           # Dépendances FastAPI (get_current_user...)
│   │   └── main.py           # App entry point
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
└── .env.example
```

---

## Roadmap sprints

- [x] **Sprint 1** — Architecture & Auth (ce commit)
- [ ] **Sprint 2** — Gestion des biens immobiliers
- [ ] **Sprint 3** — Contrats de bail
- [ ] **Sprint 4** — Finances & Quittances
- [ ] **Sprint 5** — Paiement en ligne & Rappels
