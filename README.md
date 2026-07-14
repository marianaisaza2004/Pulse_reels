# Pulse — Brand Intake

Primer módulo de **Pulse — Reel Script Studio** (Berkeley AI Leadership Intensive).

Este módulo resuelve el primer paso del producto: la empresa sube o pega la
información que tenga a mano (descripción del negocio, posts, brand
guidelines, notas sueltas — lo que sea, en el formato que sea) y el sistema la
normaliza siempre en la misma estructura de 10 categorías, para que el resto
del pipeline (Viral Engine, generación de guiones) reciba siempre un input
estandarizado:

1. Business Identity
2. Brand Personality
3. Target Audience
4. Business Goals
5. Content Strategy
6. Brand Assets
7. Social Performance
8. Competitor Context
9. Campaign Context
10. Constraints

El modelo solo extrae lo que está explícito o directamente implícito en el
input — nunca inventa datos. Los campos sin información quedan vacíos en vez
de rellenarse con texto genérico.

## Cómo correrlo localmente

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edita .env y agrega tu ANTHROPIC_API_KEY

uvicorn app.main:app --reload
```

Abre http://localhost:8000

## Stack

- FastAPI (backend) + HTML/JS plano (frontend), sin build step.
- Claude Opus 4.8 vía Anthropic SDK, con `output_config.format` (structured
  outputs) para forzar el JSON de las 10 categorías.
- Sin login, sin base de datos — cada análisis es una sesión sin estado
  (consistente con el alcance v1 del PRD de Pulse).

## Siguientes pasos (fuera de alcance de este módulo)

- Viral Engine: scoring de 10 criterios antes de escribir el guión.
- Generación del guión (hook, 3-4 beats, CTA) a partir del perfil de marca.
- Persistencia del contexto de marca entre sesiones (pendiente de decisión de
  producto — ver PRD, sección "Open Items").
