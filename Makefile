# Makefile for cswim-satvuln
# Targets:
#   make dev            — local development (compose.yaml only, with --reload)
#   make prod-proxmox   — production on Proxmox VM (10.8.0.50)
#   make prod-mag       — production on mag.gmu.edu (Mac mini)
#   make logs           — tail logs from running stack
#   make down           — stop and remove containers
#   make restart        — restart running stack
#   make migrate        — run alembic migrations against the running api
#   make ps             — show running containers
#   make build          — rebuild images without starting

.PHONY: dev prod-proxmox prod-mag logs down restart migrate ps build

COMPOSE := docker compose
PROD_PROXMOX := -f compose.yaml -f compose.prod.proxmox.yaml
PROD_MAG := -f compose.yaml -f compose.prod.mag.yaml

dev:
	$(COMPOSE) up -d --build

prod-proxmox:
	$(COMPOSE) $(PROD_PROXMOX) up -d --build

prod-mag:
	$(COMPOSE) $(PROD_MAG) up -d --build

logs:
	$(COMPOSE) logs -f --tail=100

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

migrate:
	$(COMPOSE) exec api alembic upgrade head

ps:
	$(COMPOSE) ps

build:
	$(COMPOSE) build