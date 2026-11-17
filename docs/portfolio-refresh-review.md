# 2026-11-18 포트폴리오 개편 — 콘텐츠 승인 안내

이 작업은 로컬 코드와 원고 준비까지 수행한다. 운영 DB 변경, 비공개 프로젝트 공개, Git push, Vercel 배포는 실행하지 않는다.

## 기존 상태와 보존

실제 작업 대상은 `../포폴 사이트`의 peeta0126/Portfolio이다. 처음 열린 `개인 사이트`는 peeta0126/Focus-Hub이므로 수정하지 않았다. Portfolio는 Next.js 15.5.28이며 배포된 코드와 관련 문서, 관리자 API·편집·초안·큐·이미지·게시 계층을 조사했다. 이 설치에는 `next/dist/docs`가 없어서 열린 Focus Hub의 설치 문서에서 page params, Image, Server/Client 경계를 읽고 대상 버전의 기존 인터페이스를 유지했다.

운영 DB는 `SET TRANSACTION READ ONLY`로 조회했다. 순서대로 다음 6개가 public이다. 비공개 프로젝트는 없었다.

| 순서 | 프로젝트 | slug | DB GitHub ID |
|---|---|---|---|
| 0 | Voyager Atelier | voyager-atelier | 1181590656 |
| 1 | 별빛 타로 | starlight-tarot | 미연결(null) |
| 2 | CrewSpace | crewspace | 1248472221 |
| 3 | 증강 알까기 | github-1431052115 | 1431052115 |
| 4 | Developer Portfolio | github-1329454731 | 1329454731 |
| 5 | Focus Hub | github-1407847850 | 1407847850 |

GitHub에서 별빛 타로 저장소 ID는 1326084266으로 확인했으나 DB 연결은 바꾸지 않았다. 중복 프로젝트를 만들거나 기존 slug를 변경하지 말고 기존 행을 관리해야 한다. tarot-card와 MAKEGROUND 저장소는 GitHub에서 private이다. 별빛 타로의 기존 공개 포트폴리오 링크는 유지했지만 근거 링크는 비로그인 채용 담당자에게 404일 수 있다. MAKEGROUND는 신규 공개 데이터에서 제외하고 비공개 검토용 원고만 준비했다.

공개 스냅샷은 DB의 public 프로젝트와 내용·순서가 일치했다. 대부분의 콘텐츠가 수동 보호 상태다. 원래 정적 데이터에는 3개만 있었고 CrewSpace 기술이 Next.js로 잘못 기록되어 있었다. Focus Hub·증강 알까기의 기간과 개인/팀 구분은 확인 대기로 기록돼 있었다.

소스 백업: `backups/portfolio-refresh-20261118/`. 이전 정적 프로젝트 원문은 `data/project-archive.ts`로 바이트 보존한다. 기존 Problem Solving 원문 4개와 게임 이미지 3개, 이력서 PDF를 보존한다. `backups/`와 운영 조사 자료 `artifacts/`는 Git에서 제외한다.

## 새 정보 구조와 원고

Hero → About → Featured Projects → Other Projects → Problem Solving → Tech Stack → AI-Assisted Workflow → Contact.

대표 프로젝트는 저장소 식별 기준 별빛 타로 → Focus Hub → 증강 알까기로 정렬한다. 기타 프로젝트는 스냅샷에 있는 관리자 상대 순서를 유지하며 featured=false인 기존 프로젝트도 숨기지 않는다. 이 분류는 표시용으로 DB의 공개 상태·정렬·featured 값을 수정하지 않는다.

Hero는 개발자 정체성과 실제 프로젝트 링크, 기록된 타로 평균 응답시간 개선을 보여준다. 타로가 공개 목록에 없으면 Hero의 해당 성과도 표시하지 않는다. About은 학력·개발 방식·프로젝트 경험만 소개한다. 대외활동 섹션은 추가하지 않았다. 카드는 이미지를 원색·contain으로 표시하고 개별 상세·GitHub·실제 Demo 링크를 제공한다. 화면 자료가 없는 프로젝트는 프로젝트명을 표시하며 임의 이미지를 사용하지 않는다.

상세 페이지는 실제 화면 → 기능 → 기획·문제 → 역할 → 기술 구조 → 구현 → 문제 해결(P/A/R/E) → 검증 → 결과·한계 → 링크 순서로 구성한다. 정보가 없는 부분은 숨긴다. 측정 수치는 바 그래프와 텍스트 값, 측정 조건으로 함께 제시한다. 기존 ERD/API/협업/회고 자료도 유지한다. 관리자 미리보기에서도 동일 상세 컴포넌트를 펼쳐 볼 수 있다. 근거 링크는 선택 필드이며 기존 JSON과 호환되고 기존 관리자 JSON 편집·스키마 검증을 통과한다.

정적 프리뷰는 기존 3개에 Focus Hub·증강 알까기·Portfolio 자동화·로컬 쇼츠 도구를 더해 7개다. MAKEGROUND는 공개 7개에 포함하지 않는다. 운영 조회에 정적 원고를 덧씌우지 않는다. DATABASE_URL이 있으면 기존 승인된 스냅샷을 사용하며 DB 장애 시 정적 목록으로 복원하지 않는다. 따라서 배포만 해도 운영 상세 콘텐츠가 새 원고로 바뀌는 것은 아니다.

## 사실 확인 범위

- 별빛 타로: GitHub package.json의 Prisma·PostgreSQL·OpenAI, 로컬/원격 docs/performance.md 및 fb55066 기록을 대조했다. 전후 각각 6회, 15.39초→10.28초, 33.2%, API 2회→1회 및 after() 저장 분리를 확인했다. 실제 AI 호출이나 성능 재측정은 하지 않았다. 이미지/PDF는 로컬 저장 코드·커밋 기록과 대조했다.
- Focus Hub: 첫 로컬 Git 커밋은 2026-10-07이다. 인증·세션·대시보드·Supabase 스키마와 테스트 코드를 조사했다. docs/auth-setup.md에 데스크톱·모바일 Chromium 6개 통과가 기록돼 있다. 실제 SMTP·운영 복수 계정 RLS는 미검증이다. 이번 작업의 Portfolio 테스트 수와 구분한다.
- 증강 알까기: 기존 공개 원고·docs/drafts/augment-alkkagi.md 및 조사 소스/커밋 diff를 대조했다. ed2086c(대상 선택 상태), 989b60c(발사력 UI), 0b2f7cb(동결 턴)의 코드와 회귀 단언을 확인했다. 대기 화면·알 배치·다른 증강 버그를 별도 검증된 해결 성과로 추가하지 않았다. Godot 테스트를 이번에 실행하지 않았다. 팀/기간·개인 역할·시연 경험은 이번 사용자 지시를 반영했다.
- CREW SPACE: 원격 package.json과 App·훅 조사를 대조하여 React·TypeScript·Vite로 수정했다. 교과목 제출·미도입은 사용자 제공 사실로 정리했다. 기존 참여 인원 수치를 서비스 성과로 쓰지 않았다.
- Voyager Atelier: 기존 기술·이미지·개별 해결 사례 보존. 담당 역할은 게임 아트·스프라이트·UI 리소스·엔딩을 중심으로 명시했다. 폰트 측정은 9bd49eb의 과거 기록이며 재측정하지 않았다.
- MAKEGROUND: 원격 README·package.json·community/router.ts에서 Express·MongoDB와 접근 범위 검사를 확인했다. 공개 초안의 기능 설명은 저장소 문서 범위이고 DB 통합 검증 미완료를 남긴다. 저장소 공개 범위·기간·역할 추가 확인이 필요하다.
- 쇼츠: 로컬 README·studio.py·youtube_upload.py에서 Python·FFmpeg, 생성·검수·승인 업로드와 중복 방지를 확인했다. 실제 OAuth 파일·토큰은 읽거나 복사하지 않았다. 댓글 수동 처리와 업로드 4개 경험을 코드로 검증한 통계로 표시하지 않았다. GitHub 링크를 만들지 않았다.
- Portfolio: 실제 코드의 발견·분석·큐·비용·수동 보호·관리자 게시와 기존 운영 기록을 확인했다. Mock 검사를 실제 AI 품질 검증으로 표현하지 않는다.

## 이미지와 이력서

기존 Voyager 게임 화면 3개 보존. 별빛 타로 첫 화면과 카드 선택 화면은 실제 배포에서 캡처했으며 API를 차단한 뒤 선택 화면만 열었다. AI 결과를 생성하지 않았다. Focus Hub는 기존 `focus-1440.png`, `focus-430.png` 로컬 캡처를 복사했으며 예시 데이터 화면이라고 명시했다.

증강 알까기 실제 게임 화면, Focus 캘린더·관리 화면, 타로 AI 결과·공유 이미지, CREW SPACE·MAKEGROUND·쇼츠 화면은 추가 자료 대기다. 기존 타로 카드 그림은 원본 리소스로 남기고 새 원고의 대표 이미지는 실제 화면으로 교체했다.

최신 잡코리아 이력서가 대상 저장소에서 확인되지 않아 `public/resume.pdf`를 그대로 유지했다. 최신성과 개인정보 공개 범위를 확인한 뒤 교체해야 한다. Contact의 기존 설정 링크만 유지한다.

## 운영 승인 및 반영 순서

1. `node --import tsx scripts/audit-refresh.ts artifacts/refresh/db-before.json`으로 읽기 전용 백업을 만든다.
2. `node --import tsx scripts/prepare-refresh-review.ts`는 파일만 생성한다. `artifacts/refresh/review/manifest.json`에 원본 해시·변경 필드·보호 필드와 변경안이 있으며 프로젝트별 JSON은 관리자 편집용이다. 공개 상태와 원래 slug를 유지한다. 이 명령은 DB를 쓰지 않는다.
3. 관리자에게 변경안과 근거·역할·이미지·공개 범위를 검토받는다. 현재 원본이 baseContent와 다르면 다시 비교한다. 수동 보호된 필드를 AI 초안 승인으로 우회하지 않는다.
4. **별도 운영 쓰기 승인 후** 기존 관리자 프로젝트 JSON 편집으로 확인된 문장만 반영한다. JSON의 slug를 바꾸거나 전체 DB를 SQL로 덮지 않는다. 기존 수정 API는 revision 충돌 검사, 수동 보호 추가 및 스냅샷 게시 트랜잭션을 수행한다. 공개·비공개와 순서는 관리자가 명시적으로 선택한다.
5. MAKEGROUND와 쇼츠는 아직 DB에 없다. 자동으로 공개 INSERT하지 않는다. MAKEGROUND는 기존 GitHub 발견→비공개 검토→승인 경로를 이용하되 저장소 공개 범위 정책을 우회하지 않는다. GitHub 없는 쇼츠는 별도 수동 등록 절차가 필요하다.
6. 배포도 별도 승인 후 진행한다. 승인 전에는 운영 사이트와 DB 콘텐츠가 그대로다. 실제 배포·운영 관리자 쓰기 검증은 완료로 보고하지 않는다.

신규 마이그레이션과 유료 AI 호출은 필요하지 않으며 실행하지 않았다. 기존 seed는 원래 3개 프로젝트만 대상으로 유지해 새 원고를 자동 게시하는 경로가 되지 않도록 했다.
