# 포트폴리오 전면 개선 결과

이 문서는 해당 개편 시점의 작업·검증 기록입니다. 미배포·이메일 미설정 등 당시 상태를 현재 상태로 해석하지 않습니다. 현재 실행·데이터 경계는 [README](../README.md)를 참고하세요.

2026-11-18. 실제 코드 수정 대상: `C:/Users/leere/OneDrive/바탕 화면/건국대/project/포폴 사이트` (peeta0126/Portfolio). 처음 열린 `개인 사이트` (Focus-Hub)는 Git 작업 트리 변경 없이 유지했다.

## 1. 기존 상태

- 정적 프로젝트는 Voyager Atelier·별빛 타로·CrewSpace 3개였고, 운영 DB에는 증강 알까기·Developer Portfolio·Focus Hub를 포함한 6개가 모두 공개 상태였다. 운영 순서와 slug·GitHub ID는 [콘텐츠 검토 문서](portfolio-refresh-review.md)에 있다.
- 메인에서 기술 스택이 프로젝트보다 먼저 나왔고, 프로젝트는 featured 항목만 표시했다. 이미지는 낮은 투명도·회색 배경으로 사용됐으며 전체 카드가 하나의 링크였다.
- CrewSpace의 Next.js 설명이 실제 React·TypeScript·Vite 저장소와 달랐다. 운영 Focus Hub·증강 알까기에는 기간·유형 확인 대기 값이 남아 있었다.
- 공개 스냅샷은 public 프로젝트의 내용·순서와 일치했다. 별빛 타로 DB repository ID는 null이며 실제 GitHub ID 1326084266과 연결하지 않았다. 기존 slug를 기준으로 변경안을 준비해 중복 생성하지 않았다.

## 2. 변경 사항

| 영역 | 파일 | 변경 |
|---|---|---|
| 메인 구성 | app/page.tsx, sections/* | 프로젝트 우선 순서, 대표 3개·기타 분리, 개발자 정체성·학력·5단계 AI 작업 방식 |
| 카드·상세 | components/project-card.tsx, components/project-detail.tsx, app/projects/[slug]/page.tsx | 원색 실제 이미지, 개별 외부 링크, 역할·기술 구조·P/A/R/E·측정 그래프·한계 |
| 콘텐츠 | data/profile.ts, projects.ts, project-content.ts, skills.ts, ai-experience.ts | 근거 확인 원고, 과장 없는 기여 범위·AI 활용, 기술 분류 |
| 원본 보존 | data/project-archive.ts, data/problem-solving.ts | 기존 프로젝트 원문을 archive에 바이트 보존, 기존 홈 사례 4개 원문 유지 |
| 공개 조회 | lib/portfolio.ts, lib/presentation.ts | DB 스냅샷 우선·장애 시 비공개 복원 방지 유지, 기존 사례와 새 사례 중복 제거·프로젝트 연결 |
| 관리자 호환 | types/index.ts, lib/automation/schema.ts, app/admin/project-preview.tsx | 선택적 근거 링크 검증, 기존 JSON과 호환, 동일 상세 페이지 구성 미리보기 |
| 접근성 | app/globals.css, app/layout.tsx, components/header.tsx, components/reveal.tsx | 포커스, 본문 바로가기, 모바일 프로젝트 메뉴, 다크 대비·reduced motion |
| 검증·검토 준비 | tests/*, scripts/audit-refresh.ts, prepare-refresh-review.ts, test-server.ts, seed.ts | 회귀 검사, 읽기 전용 백업·변경안, 기존 seed의 원래 3개 대상 유지 |

정적 프리뷰는 기존 3개와 Focus Hub·증강 알까기·Portfolio 자동화·쇼츠 도구를 포함한 7개다. **운영 DB에 프로젝트를 추가하거나 새 원고를 게시한 것은 아니다.** MAKEGROUND는 실제 비공개 저장소이므로 별도 검토용 초안으로만 준비했다.

이미지 4개 추가: 별빛 타로 실제 배포 첫 화면·카드 선택, Focus Hub 기존 로컬 데스크톱·모바일 캡처. 기존 Voyager 이미지와 타로 카드 리소스도 보존했다. 임의의 AI 이미지를 프로젝트 화면으로 만들지 않았다.

이력서는 새 잡코리아 파일이 대상 저장소에서 확인되지 않아 기존 PDF를 유지했다. `git hash-object public/resume.pdf`와 `HEAD:public/resume.pdf`의 blob이 `ec274dd536de1754093631fe6f2ecef1f229303a`로 일치한다. Contact의 기존 GitHub·블로그를 유지했고 빈 이메일 설정은 임의로 채우지 않았다.

## 3. 보존 확인

- 소스 백업: `backups/portfolio-refresh-20261118/`. 기존 정적 원문 3개·Problem Solving 4개는 보존 테스트 통과.
- 운영 DB 읽기 전후 파일 `artifacts/refresh/db-before.json`, `db-after.json`이 바이트 단위로 같다. 비교 대상은 프로젝트 전체 행, 공개 스냅샷, 홈 사례, 기존 분석, API 사용량이다.
- 프로젝트 6개·공개 여부·순서·slug·수동 보호·기존 분석 3개·홈 원문 4개·사용량 8건 보존. 운영 DB DDL/DML, 큐 실행, 유료 AI 호출 0회.
- 기존 관리자 로그인·편집·승인·거절·공개 설정·순서·이미지 업로드·분석 큐·비용 관리 경로를 유지했다. 새 스키마는 선택 필드만 추가하며 마이그레이션이 없다.
- DB가 있으면 승인된 스냅샷을 읽는다. 새 정적 원고를 운영 데이터에 덧씌우거나 장애 시 숨긴 프로젝트를 복원하지 않는다. 새 저장소·쇼츠를 seed로 자동 게시하지 않는다.
- Git commit/push 및 실제 배포를 실행하지 않았다.

## 4. 검증 결과

| 검사 | 실제 결과 |
|---|---|
| TypeScript | `npm run typecheck` 통과. 최종 build에서도 타입 검사 통과 |
| ESLint | `npm run lint` 통과. 최종 build에서도 lint 통과 |
| Production Build | `npm run build:verify` 통과 (Next.js 15.5.28, .next-verify 격리 출력) |
| 단위 테스트 | `npm test` 27개 통과 |
| DB·자동화 통합 | `npm run test:integration` 26개 하위 시나리오 통과, 상위 포함 실행 집계 27개 |
| 브라우저 | `npm run test:e2e` 최종 8개 통과 |
| 반응형·테마 | 375·768·1440px × 라이트·다크, reduced motion, 가로 넘침 없음 |
| 공개 화면 | 메인·정적 7개 상세, 대표 순서·기타 노출·이미지 로딩·상세 이동·근거 링크·PDF·키보드 포커스 확인 |
| 관리자 | 격리 DB에서 로그인·수동 편집·순서 40 저장·승인·비공개 전환·초안 비교·수정·보호·재작성 예약·이미지 업로드·권한/Origin 검사 통과 |
| 거절 | 격리 통합 테스트에서 초안 거절 시 기존 원문 유지 확인 |
| 데이터 | 스냅샷 정합성, 저장소 중복 방지·비공개 제외·예산·큐·기존 데이터 보존 테스트 통과 |
| Git diff | `git diff --check` 통과 |
| 실제 사이트 읽기 | 기존 운영 메인+상세 6개 총 7 URL HTTP 200, 타로·CrewSpace Demo HTTP 200 |

실제 운영의 HTTP 200은 현재 배포 상태의 읽기 확인이다. 이번 로컬 코드가 배포됐거나 운영 관리자 쓰기가 검증됐다는 의미가 아니다. 브라우저·통합 테스트는 별도 메모리 PostgreSQL과 Mock을 사용하며 실제 GitHub/AI 생성 작업을 실행하지 않는다.

최종 브라우저 실행은 `8 passed (21.8s)`. 처음 발견한 TypeScript 오류 2개와 기존 테스트의 필수 overview 가정은 수정 후 재검사했다. 테스트 중 게시한 Mock 항목이 섞이지 않도록 새 격리 서버에서 별도로 캡처했다.

검증 산출물:

- `artifacts/refresh/browser-final.json`: 대표 3개 상세 모바일 overflow=false, pageerror 없음, 운영·Demo HTTP 결과.
- `artifacts/refresh/preview-hero-1440.png`, `preview-hero-375.png`: 새 원고를 사용하는 로컬 첫 화면.
- `artifacts/refresh/preview-projects-1440.png`, `preview-projects-375.png`: 공개 정적 원고 7개만 포함한 프로젝트 영역.
- `artifacts/refresh/detail-*-375.png`: 대표 상세 3개.
- `artifacts/refresh/home-{375,768,1440}-{light,dark}.png`: 테마·크기별 회귀 검사 화면. 관리자 테스트의 Mock 게시 상태가 포함될 수 있으므로 정리된 콘텐츠 프리뷰는 preview-* 파일을 사용한다.
- `artifacts/refresh/review/manifest.json`: 운영 6개 변경안·원본 해시·보호 필드 차이와 신규 비공개 검토 원고. 프로젝트별 JSON 6개도 함께 생성했다.

## 5. 남은 작업

1. **운영 콘텐츠 변경 승인 대기.** 기존 관리자 JSON 편집에서 확인된 문장만 반영해야 한다. 수동 보호 필드를 AI 승인으로 우회하거나 SQL로 덮지 않는다. 운영에 새 원고를 적용하지 않았으므로 지금 DB 기반 화면에는 기존 상세 내용이 표시된다.
2. **실제 배포 승인 대기.** 배포·운영 관리자 수정은 이번에 실행하지 않았다. 운영 URL을 열어도 새 UI가 아직 보이지 않는 것이 정상이다.
3. **MAKEGROUND 공개 범위 확인.** 저장소가 private이며 DB 미등록이다. 실제 코드의 작품 CRUD·피드백·협업 신청 경로는 확인했지만 운영 DB 통합 결과·기간·개인 역할·공개 범위는 추가 확인이 필요하다.
4. **쇼츠 DB 수동 등록 검토.** 로컬 실물이 확인돼 정적 프리뷰 원고는 준비했지만 공개 GitHub가 없어 링크를 만들지 않았고 기존 GitHub 발견 경로로 자동 등록하지 않았다.
5. **추가 이미지.** 증강 알까기 게임·증강 선택·온라인 대전, Focus 캘린더·할 일/목표, 타로 AI 결과·공유 이미지 및 기타 프로젝트 화면은 추가 업로드 대기다.
6. **이력서·연락처.** 최신 잡코리아 PDF와 공개 개인정보 범위를 확인한 뒤 교체한다. 이메일은 현재 미설정이다.
7. **프로젝트별 검증 한계.** 타로 성능은 과거 6+6회 기록이며 재측정하지 않았다. Focus 6개 통과는 저장소 기록이고 실제 SMTP·운영 복수 계정 RLS는 미검증이다. Godot 실행·최신 네트워크 회귀와 실제 YouTube 업로드도 이번 범위에서 실행하지 않았다.
8. **근거 공개 접근성.** 기존 별빛 타로 저장소가 private이므로 GitHub 근거 링크는 권한 없는 채용 담당자에게 보이지 않을 수 있다. 공개 가능한 측정 기록을 별도로 제공할지 확인해야 한다.

콘텐츠별 사실·출처·승인 절차는 [콘텐츠 검토 문서](portfolio-refresh-review.md)를 참고한다.
