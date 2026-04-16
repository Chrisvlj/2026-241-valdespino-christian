# PollClass - Laboratorio 1

Proyecto de encuestas en vivo con React, Vite, Bun, MongoDB, Mongoose, Tailwind y polling básico.

## Testing E2E (Playwright)

Todos los tests y artefactos viven dentro de `tests/`.

```bash
# ejecutar toda la suite
bun run test:e2e

# instalar navegadores (si falla por browser faltante)
bun run test:e2e:install
bun run test:e2e:install:deps

# alias de suite completa
bun run test:e2e:all

# suites por alcance
bun run test:e2e:smoke
bun run test:e2e:routes
bun run test:e2e:professor
bun run test:e2e:student
bun run test:e2e:integration

# modos de ejecucion
bun run test:e2e:headed
bun run test:e2e:ui
bun run test:e2e:debug

# abrir reporte html
bun run test:e2e:report
```

Artefactos:

- Capturas: `tests/artifacts/capturas/`
- Videos: `tests/artifacts/videos/`
- Resultado crudo Playwright: `tests/artifacts/test-results/`
- Reporte HTML: `tests/artifacts/playwright-report/`

## Desarrollo

```bash
bun install
bun run dev
```

## Variables de entorno

```bash
cp .env.example .env
```
