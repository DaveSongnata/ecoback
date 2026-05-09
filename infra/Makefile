.PHONY: dev prod down logs ps reset migrate seed shell

# Sobe a stack de dev (gera .env.dev se não existir; rebuilda se o Dockerfile mudou).
dev:
	@./setup.sh dev
	docker compose -f docker-compose.dev.yml up --build

dev-bg:
	@./setup.sh dev
	docker compose -f docker-compose.dev.yml up -d --build

# Sobe a stack de prod (gera .env se não existir; avisa o que falta preencher).
prod:
	@./setup.sh prod
	docker compose -f docker-compose.prod.yml up -d

down:
	@docker compose -f docker-compose.dev.yml down 2>/dev/null || true
	@docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# CUIDADO: apaga dados (postgres + uploads do volume).
reset:
	docker compose -f docker-compose.dev.yml down -v

logs:
	docker compose -f docker-compose.dev.yml logs -f

ps:
	docker compose -f docker-compose.dev.yml ps

migrate:
	docker compose -f docker-compose.dev.yml exec api node ace migration:run

seed:
	docker compose -f docker-compose.dev.yml exec api node ace db:seed

shell:
	docker compose -f docker-compose.dev.yml exec api sh
