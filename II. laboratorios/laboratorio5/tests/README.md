# Testing en `tests/`

Este directorio concentra todo lo relacionado a Playwright:

- Configuracion: `tests/playwright.config.ts`
- Specs E2E: `tests/e2e/`
- Soporte y helpers: `tests/e2e/support/`
- Artefactos: `tests/artifacts/`

## Comandos

```bash
# suite completa
bun run test:e2e
bun run test:e2e:all

# instalar navegadores de Playwright
bun run test:e2e:install

# instalar navegadores + dependencias del sistema
bun run test:e2e:install:deps

# suites por alcance
bun run test:e2e:smoke
bun run test:e2e:routes
bun run test:e2e:professor
bun run test:e2e:student
bun run test:e2e:integration
bun run test:e2e:validation

# modos de ejecucion
bun run test:e2e:headed
bun run test:e2e:ui
bun run test:e2e:debug

# reporte html
bun run test:e2e:report
```

## Convencion de etiquetas

Los tests usan tags en el titulo para filtrar suites:

- `@smoke`
- `@routes`
- `@professor`
- `@student`
- `@integration`
- `@validation`

Ejemplo de nombre de test:

`@smoke @student student joins by code and votes once`

## Artefactos

- Capturas: `tests/artifacts/capturas/`
- Videos: `tests/artifacts/videos/`
- Resultado crudo: `tests/artifacts/test-results/`
- Reporte HTML: `tests/artifacts/playwright-report/`

## Flujos críticos cubiertos

- Profesor crea encuesta y navega a resultados.
- Estudiante se une por código, vota una vez y ve el registro.
- Profesor cierra encuesta y estudiantes nuevos quedan sin permiso para votar.
- Validación: código de unión con longitud inválida muestra error de formulario.
