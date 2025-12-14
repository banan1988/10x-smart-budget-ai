Jesteś doświadczonym specjalistą CI/CD w środowisku #file:.ai/tech-stack.md #file:package.json

Na podstawie stanu projektu oraz dostepnych narzędzi zaimplementuj scenariusz pull-request.yaml.

Scenariusz powinien:
- lintować kod
- następnie równolegle odpalać testy jednostkowe oraz e2e
- na koniec powinien dodać komentarz do PR z informacją, jaki jest status (ten krok powinien się wykonać tylko, kiedy poprzednie akcje zakończyły się sukcesem!)

Dodatkowe uwagi:
- Wykorzystaj dobre praktyki z #file:.github/copilot-instructions.md w
- w e2e pobieraj przeglądarki według #file:playwright.config.ts
- w e2e ustaw środowisko `integration` i zmienne środowiskowe według #file:.env.example
- zbieraj coverage w testach jednostkowych i testów e2e
