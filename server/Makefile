# DEV

build-dev:
	docker build -t v -f containers/images/Dockerfile . && docker build -t turn -f containers/images/Dockerfile.turn .

clean-dev:
	docker-compose -f containers/composes/compose.dev.yaml down

run-dev:
	docker-compose -f containers/composes/compose.dev.yaml up

logs-dev:
	docker-compose -f containers/composes/compose.dev.yaml logs -f --tail 100

# PROD

stop-prod:
	docker-compose -f containers/composes/dc.prod.yml stop --timeout 120

clean-prod:
	docker-compose -f containers/composes/dc.prod.yml down --timeout 120

run-prod:
	docker-compose -f containers/composes/dc.prod.yml up -d --timeout 120

logs-prod:
	docker-compose -f containers/composes/dc.prod.yml logs -f --tail 100