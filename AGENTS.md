# 과제 관리 웹앱 작업 가이드

## 프로젝트 목적

이 프로젝트의 목적은 완벽한 상용 서비스를 만드는 것이 아니라, Codex를 활용한 AI 개발 워크플로를 연습하는 것입니다. 작은 기능을 명확히 구현하고, 변경 사항을 확인하며, 필요할 때만 구조를 개선합니다.

## 기술 기준

- Next.js와 TypeScript를 사용합니다.
- 초기 데이터 저장소는 `localStorage`입니다. 데이터베이스나 서버 기능은 요청받기 전까지 추가하지 않습니다.
- 외부 라이브러리는 기본 기능만으로 해결할 수 없을 때에만 제안하고, 사용자 승인 없이 추가하지 않습니다.

## 구현 원칙

- 가능한 한 단순한 구조와 적은 파일 수를 유지합니다.
- 기능을 구현할 때 기존 기능이 계속 동작하는지 함께 확인합니다.
- TypeScript 타입을 명확히 정의하고, `any` 사용을 피합니다.
- 컴포넌트가 지나치게 길거나 여러 책임을 가지게 되면, 의미 있는 단위로 분리합니다. 단, 너무 이른 추상화는 피합니다.
- 요청 범위를 벗어난 리팩터링, 기능 추가, 디자인 변경은 하지 않습니다.

## 변경 후 확인

기능을 구현하거나 수정한 뒤에는 반드시 다음을 실행해 확인합니다.

```bash
npm run lint
npm run build
```

오류가 발생하면 원인을 해결하거나, 해결할 수 없는 이유와 영향을 명확히 보고합니다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
