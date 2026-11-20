# Portfolio 2차 UI/UX 개선 결과

이 문서는 해당 개편 시점의 작업·검증 기록입니다. 미배포·이메일 미설정 등 당시 상태를 현재 상태로 해석하지 않습니다. 현재 실행·데이터 경계는 [README](../README.md)를 참고하세요.

2026-11-18. 기존 1차 개편 작업 트리 위에 적용했습니다. `ui-ux-pro-max`의 문장 길이·행간·반응형 이미지·클릭 영역·대비 기준을 사용하고 React 구성도 점검했습니다. 운영 DB 게시, 마이그레이션, 배포, commit/push, 유료 AI 호출은 실행하지 않았습니다.

이번 대화에서 첨부 스크린샷 10장은 전달되지 않아 직접 검토할 수 없었습니다. 저장소의 기존 캡처와 새 로컬 브라우저 캡처를 검토했습니다.

## 1. UI 변경 전후

| 영역 | 변경 전 | 변경 후 |
| --- | --- | --- |
| Hero | 높은 검정 성과 카드와 긴 측정 설명 | 중립 배경의 작은 성과 요약, 이름·Portfolio 정렬, 소개 문장 축약, 대표 3개 행 전체 링크 |
| About | 본문 전체를 큰 글씨로 표시하는 긴 3문단 | 핵심 소개만 강조, 개발 계기·방식 2문단, 학력·직무 방향 유지 |
| 대표 카드 | 빠진 이미지, 제목 반복, 소개·설명·역할 중복 | 대표 3개 실제 이미지, 제목 1회, 소개·역할 각 최대 2줄, 스택 4개 이하, 하단 링크 정렬 |
| 추가 프로젝트 | 대표와 같은 3열, 마지막 카드 오른쪽 큰 공백 | 2열의 낮은 이미지·작은 제목 카드, 4개를 2×2로 구성, 빈 카드 없음 |
| 기간 | 미확인 값이 공개 카드·상세에 노출 | 공개 표시에서만 숨김. 원본 기간과 관리자 검토 데이터는 유지 |
| Problem Solving | 전체 10개 사례의 긴 3열 설명 | 메인 4개를 2열 요약으로 표시, 전체 10개 원문 페이지 추가, 상세 연결 유지 |
| Tech Stack | 5개 분류를 3열에 배치한 회색 빈 칸 | 데스크톱 3+2, 태블릿 2+2+1로 채우는 유연한 배치와 관련 프로젝트 링크 |
| AI Workflow | 비슷한 강조의 카드 5개 | 번호·화살표로 이어지는 5단계, 실제 프로젝트 경험과 개인 검증 역할 설명 |
| Contact | 큰 제목과 긴 공백, GitHub·Blog | 작은 제목, 44px 이상 클릭 영역, 이력서 링크 추가. 미설정 이메일은 숨김 유지 |
| 대표 상세 | 구조 설명과 자료 누락 | 실제 화면, 역할·기여, 연결 화살표가 있는 기술 구조, 테스트 근거와 한계 |

이미지는 `object-contain`으로 비율을 보존합니다. 카드의 요약은 줄 수를 제한하고 전체 설명은 상세·전체 사례 페이지에서 제공합니다. 흑백·회색 테마와 라이트·다크 모드를 유지했습니다.

## 2. 프로젝트 이미지 확보

| 프로젝트 | 상태 | 출처·한계 |
| --- | --- | --- |
| 별빛 타로 | 기존 실제 화면 2장 유지 | 배포 서비스 시작·카드 선택 화면. AI 결과 화면은 추가 자료 필요 |
| Focus Hub | 기존 실제 화면 2장 유지 | 로컬 데스크톱·모바일 대시보드. 예시 데이터임을 상세 캡션에 명시 |
| 증강 알까기 | **실제 게임 화면 신규 확보** | 원본을 바꾸지 않은 격리 복사본에서 Godot 경기 보드·HUD 렌더링. 온라인 대전 캡처로 표시하지 않음 |
| CrewSpace | **실제 서비스 화면 신규 확보** | https://crew-space-nine.vercel.app/ 공개 로그인 화면. 계정 로그인·회원 정보 접근 없음 |
| Developer Portfolio | **기존 실제 프리뷰 화면 연결** | 1차 개편의 로컬 Hero 캡처. 캡션에 이전 버전임을 명시 |
| Voyager Atelier | 기존 게임 화면 3장 유지 | 기존 베이스캠프·숲·작업장 이미지 |
| MAKEGROUND | 미확보 | 비공개 검토 초안만 유지. 공개 데이터에 새로 추가하거나 사설 자료를 게시하지 않음 |
| 쇼츠 자동화 | 대체 레이아웃 | 화면이 없는 로컬 도구. 실제 UI로 오인할 합성 이미지를 사용하지 않음 |

신규 공개 이미지 파일: `public/projects/alkkagi-game.png`, `crewspace-screen.png`, `portfolio-screen.png`.

게임 격리 실행에는 GD-Sync 초기화·리소스 종료 경고가 있습니다. 실제 보드 이미지 생성은 확인했지만, 온라인 연결 성공이나 게임 회귀 테스트 통과로 해석하지 않습니다. 원본 게임 저장소 코드는 수정하지 않았습니다.

## 3. 문제 해결 사례와 근거

메인 순서:

1. **별빛 타로:** 평균 15.39초 → 10.28초, 약 33.2% 단축. 로컬 `docs/performance.md`의 전후 각 6회 평균과 [측정 커밋 fb55066](https://github.com/peeta0126/tarot-card/commit/fb55066)을 비교했습니다. 당시 호출 통합·reasoning 설정·응답 이후 DB 저장을 적용했습니다. 개선 후 수치에는 DB 저장 대기가 포함되지 않습니다.
2. **Focus Hub:** 로그인 세션·보호 경로 정리. [인증 문서](https://github.com/peeta0126/Focus-Hub/blob/main/docs/auth-setup.md)와 [브라우저 테스트](https://github.com/peeta0126/Focus-Hub/blob/main/tests/auth.spec.ts) 기록을 연결했습니다. 기존 로컬 fixture 검증을 운영 SMTP·RLS 검증으로 표현하지 않습니다.
3. **증강 알까기:** 참가자 대상 선택 중 호스트 스냅샷 충돌. 로컬 `game_manager.gd`의 `SKILL_TARGETING` 보존과 `network_manager.gd`의 요청 순서·호스트 검증을 확인했습니다. [변경과 회귀 단언](https://github.com/peeta0126/AugmentAlkkagi/commit/ed2086c42a8977a2fb554fe0c70168838dcb41a2)을 연결했습니다.
4. **Voyager Atelier:** WOFF2 폰트 3종 합계 1,207KB → 65KB, 약 95% 절감. GitHub 연결로 [측정 커밋](https://github.com/peeta0126/monster-rpg/commit/9bd49eb8535b8513ea2fd7ed2b7a795f1410caf3)의 메시지·`design/PERF.md`·서브셋 스크립트 변경을 확인했습니다. CDN 배포 WOFF2와 빌드 생성 서브셋 WOFF2를 비교한 용량입니다. 현재 재측정 수치가 아닙니다.

**타로 구조 차이 발견:** 현재 로컬 HEAD `89cdb7d`는 질문이 있으면 분류 API를 별도 호출하고, 빈 질문일 때 분류를 생략합니다. 측정 커밋 fb55066의 단일 호출 구조와 다릅니다. 상세의 기술 구조·API·개발 과정·한계를 수정해 역사적 33.2% 성과를 현재 버전의 측정값으로 오인하지 않도록 했습니다.

전체 사례는 `/problem-solving`에 10개 모두 남아 있습니다. 증강 알까기의 발사력 UI 초기화·동결 상태 턴 진행 및 회귀 테스트 근거, 기존 Voyager·타로·CrewSpace 사례도 삭제하지 않았습니다. 공개 스냅샷에서 숨긴 프로젝트의 사례를 복원하지 않습니다.

## 4. 실제 화면 캡처

- 변경 전 참고: 기존 Hero (`artifacts/refresh/preview-hero-1440.png`, 로컬 전용), 기존 프로젝트 영역 (`artifacts/refresh/preview-projects-1440.png`, 로컬 전용)
- 변경 후 전체: 데스크톱 라이트 (`artifacts/second-pass/home-1440-light.png`, 로컬 전용), 모바일 라이트 (`artifacts/second-pass/home-375-light.png`, 로컬 전용), 태블릿 라이트 (`artifacts/second-pass/home-768-light.png`, 로컬 전용)
- 다크 전체: 데스크톱 (`artifacts/second-pass/home-1440-dark.png`, 로컬 전용), 모바일 (`artifacts/second-pass/home-375-dark.png`, 로컬 전용), 태블릿 (`artifacts/second-pass/home-768-dark.png`, 로컬 전용)
- 부분 확대: Hero 데스크톱 (`artifacts/second-pass/hero-desktop.png`, 로컬 전용), Hero 모바일 (`artifacts/second-pass/hero-mobile.png`, 로컬 전용), 프로젝트 (`artifacts/second-pass/section-projects.png`, 로컬 전용), 문제 해결 (`artifacts/second-pass/section-problem-solving.png`, 로컬 전용), 스택 (`artifacts/second-pass/section-skills.png`, 로컬 전용)
- 대표 상세 3개 × 375·1440px × 라이트·다크 총 12장: `artifacts/second-pass/detail-{slug}-{width}-{theme}.png`
- 전체 문제 해결 기록 모바일 다크 (`artifacts/second-pass/all-problems-mobile-dark.png`, 로컬 전용)

`00-visual.spec.ts`에서 관리자 변경 테스트보다 먼저 깨끗한 격리 데이터로 캡처했습니다. 메인 이미지 6개·대표 상세 이미지의 실제 로딩 완료를 확인한 후 전체 페이지를 저장합니다. 게임·기술 스택·Hero·프로젝트·문제 해결 캡처는 직접 열어 검토했습니다.

## 5. 테스트 결과

| 검사 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run build:verify` | Production Build 통과, `.next-verify` 격리 출력 |
| `npm test` | **29개 통과** |
| `npm run test:integration` | **26개 하위 시나리오 통과**, 상위 포함 집계 27개 |
| `npm run test:e2e` | **9개 통과 (최종 37.2초)** |
| 반응형·테마 | 375·768·1440px × 라이트·다크, 가로 넘침 없음 |
| 공개 화면 | 대표 순서·7개 프로젝트 보존·6개 카드 이미지 로딩·3개 상세 구조도·이미지·전체 사례 10개·상세 링크·이력서 PDF·키보드·테마 전환 |
| 카드 정렬 | 데스크톱 대표 카드 높이 차이 2px 미만 검사 |
| 관리자 회귀 | 격리 DB 로그인·수정·승인·정렬·공개 전환·보호 필드·이미지 업로드·초안 수정·권한·CSRF·충돌·큐 보존 검사 |
| 기존 데이터 | 원문·백업 보존, 거절·비공개·스냅샷·GitHub 수집·Mock AI 초안·예산·재시도 통합 검사 |
| `git diff --check` | 통과 |
| 로컬 검토 URL | http://127.0.0.1:3108/ HTTP 200 |

초기 브라우저 검사의 기존 "메인 사례 10개" 단언은 새 요구사항에 맞게 4개로 변경했고, 전체 기록 페이지에 10개가 보존되는 검사를 추가했습니다. TypeScript의 Reveal className 지원 오류와 캡처 스크립트 lint 오류도 수정 후 재검사했습니다.

브라우저·통합 테스트의 DB 쓰기는 PGlite 메모리 DB에만 수행했습니다. GitHub·OpenAI 자동화는 Mock이며 실제 비용 발생 요청을 실행하지 않습니다. 원래 `.env.local`과 운영 자격 증명은 수정하지 않았습니다.

## 6. 이번 2차 작업에서 변경·추가한 파일

- 화면: `sections/hero.tsx`, `about.tsx`, `projects.tsx`, `problem-solving.tsx`, `skills.tsx`, `ai-experience.tsx`, `contact.tsx`
- 컴포넌트·스타일: `components/project-card.tsx`, `project-detail.tsx`, `reveal.tsx`, `app/globals.css`
- 페이지: `app/projects/[slug]/page.tsx`, **`app/problem-solving/page.tsx` 신규**
- 콘텐츠·표시: `data/profile.ts`, `data/ai-experience.ts`, `data/project-content.ts`, `lib/presentation.ts`
- 검증: `tests/presentation.test.ts`, `tests/e2e/admin.spec.ts`, **`tests/e2e/00-visual.spec.ts` 신규**
- 이미지: `public/projects/alkkagi-game.png`, `crewspace-screen.png`, `portfolio-screen.png`
- 재현 도구: `scripts/capture-references-v2.mjs`, `capture-game-v2.gd`, `capture-game-v2.ps1`, `preview-local.mjs`
- 결과 문서: `docs/portfolio-second-pass-results.md`

다른 기존 변경 파일은 1차 작업에서 이미 수정된 상태였습니다. 관리자 API·수집·승인·보호·이미지 업로드·DB 스냅샷 구현을 이번 2차 작업에서 변경하지 않았습니다.

## 7. 로컬 프리뷰와 운영 반영 대기

`node scripts/preview-local.mjs`로 http://127.0.0.1:3108/ 를 열 수 있습니다. 먼저 `npm run build:verify`를 실행해야 합니다. 이 프리뷰는 DATABASE_URL·관리자·GitHub·OpenAI·Cron 자격 증명을 빈 값으로 덮어 로컬 정적 원고만 표시합니다. 운영 데이터를 읽거나 쓰는 프리뷰가 아닙니다.

운영 반영에는 별도 콘텐츠 검토·게시 승인과 Vercel 배포 승인이 남아 있습니다. DB 공개 조회에 새 정적 원고를 덧씌우지 않았으므로 코드 배포만으로 이번 원고·이미지가 운영 스냅샷에 게시되지는 않습니다. 기존 관리자 보호 필드·승인 경로로 검토한 콘텐츠만 반영해야 합니다.

추가 검토 자료: 타로 최신 구조의 성능 재측정과 AI 결과 화면, CrewSpace 로그인 후 서비스 화면, 증강 선택·실제 온라인 대전 화면, MAKEGROUND 공개 범위. 이메일은 미설정으로 유지했고 전화번호·생년월일은 추가하지 않았습니다. 기존 이력서 파일은 교체하지 않았습니다.
