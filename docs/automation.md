# GitHub 자동 동기화·AI 프로젝트 관리

상세 콘텐츠 파이프라인은 이제 기술 사실 분석과 포트폴리오 글쓰기를 분리하고, 신규 설명은 항상 관리자 승인 대기 초안으로 저장한다. 저장된 기술 분석으로 설명만 재작성할 수 있다. 기존 분석·원문·수동 보호·비용 기록은 보존한다. 추가형 스키마·검증 범위·로컬 원고·실제 반영 전 단계는 [상세 설명 개선 보고서](editorial-upgrade.md)를 참고한다. 아래 이전 구현 기록의 자동 게시 설명은 새 상세 초안에는 적용하지 않는다.

작업 큐를 비우려면 관리자 **동기화 → 작업 큐 초기화**를 사용한다. 실행 중인 작업이 있으면 거부하며, 확인 후 discover/analyze의 대기·완료·실패 작업만 삭제한다. 프로젝트·분석 결과·수동 수정·공개 상태·사용량·기존 로그는 유지한다. 전체 큐 개수와 초기화 전후 결과를 표시하고 감사 로그를 추가한다. [초기화 결과와 검증 기록](queue-reset.md)을 참고한다.

## 기존 코드 분석과 보존

- 실제 시작 버전: Next.js 15.5.20, React 19, TypeScript, Tailwind 3, Framer Motion 12, lucide-react. App Router의 서버 컴포넌트 구조다. 인증·DB·관리자·자동 테스트·환경변수 예제·Cron 설정은 없었다.
- `data/projects.ts`: 기존 Project 3개. 제목, 부제, 기간, 유형, 기술, 링크, 이미지, 상세 설명을 포함한다. `data/problem-solving.ts`에는 홈 화면용 4개 항목이 별도로 있다.
- `sections/projects.tsx` → `components/project-card.tsx`, `app/projects/[slug]/page.tsx`가 카드와 상세를 렌더링한다. `sections/problem-solving.tsx`는 Problem / Approach / Result를 그린다.
- 문체: 부제는 기능을 압축한 명사형, 소개는 짧은 한 문장, 상세는 한국어 설명체다. 개요 → 구조 → 기능/구현 → 문제 해결 → 회고 순서이며 개인 작업 범위와 전체 기능을 구분한다. 새 AI 요청에는 기존 3개 프로젝트의 문체 예시와 사실성 제약을 함께 전달한다.
- 공개 화면의 CSS·폰트·레이아웃·애니메이션·이미지·원문은 유지한다. 조회 부분만 서버 DB 스냅샷으로 전환했다. 기존 데이터를 새 설명으로 덮어쓰지 않도록 이관 시 모든 기존 필드를 잠근다.
- 원문 백업: `backups/original/*.ts`. JSON 백업: `backups/legacy-data.json`. `npm test`에서 원본과 백업의 바이트 일치를 검사한다.
- 운영 사이트 URL은 웹 도구에서 열리지 않아 운영 화면과의 픽셀 비교는 하지 못했다. 로컬 코드와 브라우저 화면을 기준으로 검증한다.
- 기존 Next.js의 보안 취약점이 발견되어 같은 15 계열의 15.5.28 이상으로 패치했다. 이미지 처리와 PostCSS 등 종속성에도 패치 버전을 지정했다. 배포 전 `npm audit`를 다시 실행한다. [공식 보안 공지](https://nextjs.org/blog/nextjs-security-update-october-14-2026)

## 추가 구조

```text
app/admin/                       로그인·관리자 대시보드
app/api/admin/                   서버 권한 검사·수정·검토·설정·작업 실행
app/api/admin/session/           scrypt 검증·서명된 HttpOnly 세션
app/api/admin/upload/            이미지 형식·크기 검사 및 저장
app/api/images/[id]/             공개 프로젝트에서 참조하는 이미지 제공
app/api/cron/                    Cron 인증·수집 예약·작업 1개 처리
app/api/github/webhook/          원문 HMAC SHA-256 검증·수집 예약
lib/automation/                  DB·GitHub·분석·예산·큐·검증·인증
lib/portfolio.ts                 공개 조회 경계
db/001_portfolio.sql             추가형·재실행 가능한 DB 마이그레이션
scripts/                        마이그레이션·이관·비밀번호 해시·격리 검증 서버
tests/                          단위·Mock 통합·브라우저 테스트
.github/workflows/portfolio-sync.yml  선택적으로 활성화하는 큐 실행기
vercel.json                     하루 1회 수집 Cron
```

## 실행 및 DB 연결

새로운 **전용 PostgreSQL DB**를 만든다. Neon/Supabase의 PostgreSQL 또는 관리 중인 PostgreSQL을 사용할 수 있다. 기존 포트폴리오에는 DB가 없으므로 특정 공급자 가입이나 유료 리소스를 자동 생성하지 않는다. Supabase를 선택해도 브라우저 Supabase API는 사용하지 않으며 서버의 PostgreSQL 연결만 사용한다.

1. `.env.example`을 `.env.local`로 복사한다. 키를 Git에 커밋하지 않는다.
2. 서버용 `DATABASE_URL`에 공급자의 pooled PostgreSQL 연결 URL을 설정한다. 공급자의 SSL 설정을 따른다. prepared statement는 끄고 연결 수는 인스턴스당 최대 3개로 제한했다.
3. DB 생성용 계정으로 `npm run db:migrate`를 실행한다. 기존 테이블을 DROP/TRUNCATE하지 않는다. 테이블 이름이 충돌할 수 있는 다른 앱의 DB에 그대로 적용하지 않는다.
4. `npm run db:seed`를 실행한다. 기존 Project 객체 전체를 JSONB로 보존하고 공개 스냅샷을 생성한다. 기존 slug가 있으면 설명·공개 상태·순서를 덮어쓰지 않는다. 재실행 가능하다. DB를 설정하지 않은 상태에서는 JSON 백업만 생성한다.
5. `npm run dev`, `/`와 기존 프로젝트 상세 3개가 정상인지 확인한 후 `/admin`을 사용한다.

테이블은 `projects`, `project_problem_solving`, `project_analysis`, `sync_logs`, `portfolio_settings`, `portfolio_jobs`, `ai_usage`, `admin_attempts`, `portfolio_public_snapshot`, `portfolio_images`이다. 모든 테이블에 RLS를 켜고 익명 정책은 만들지 않는다. 서버 연결 역할은 테이블 소유자처럼 이 테이블에 접근 가능한 전용 역할이어야 한다. anon/public 클라이언트 키로 연결하면 안 된다. 외부에 DB 직접 접근을 공개하지 않는다.

`portfolio_home_problem_solving`에는 홈 화면용 원문 4개를 별도로 이관한다. 프로젝트 상세의 troubleshooting 6개와 목적과 문장이 달라 합치지 않는다. seed는 기존 홈 항목을 덮어쓰지 않으며, 공개 조회는 표시 중인 프로젝트에 속하는 항목만 반환한다.

기존 Project 타입과 호환되도록 제목·기술·상세·이미지 등은 `projects.content` JSONB에 저장한다. Repository ID는 nullable UNIQUE bigint이고 최초 연결 후 이름 변경과 무관하게 유지된다. 기존 프로젝트는 GitHub URL을 대소문자 없이 비교해 최초 한 번 연결한다. 문제가 생기면 DB 트랜잭션이 롤백되며 기존 게시 스냅샷을 바꾸지 않는다. `project_problem_solving`은 근거/출처 인덱스이고, 공개 화면의 실제 내용은 Project JSON과 공개 스냅샷이다. 분석 기록은 원본 제안을 보존한다.

## 환경변수

| 이름 | 용도 |
| --- | --- |
| `DATABASE_URL` | 서버 전용 PostgreSQL 연결 |
| `APP_URL` | 정확한 사이트 origin. 로컬은 `http://localhost:3000`, 운영은 실제 HTTPS 도메인. CSRF 검사 기준 |
| `GITHUB_OWNER` | 수집 계정. 기존 링크에 따라 기본 `peeta0126` |
| `GITHUB_TOKEN` | 선택. 공개 저장소 REST API 요청 한도 확대·읽기 인증 |
| `GITHUB_WEBHOOK_SECRET` | 선택. Webhook 원문 서명 검증용 독립 비밀값 |
| `OPENAI_API_KEY` | 서버 전용 OpenAI 프로젝트 키 |
| `OPENAI_MODEL` | 사용 가능한 Responses API + Structured Outputs 지원 모델 ID |
| `OPENAI_INPUT_USD_PER_MILLION` | 선택한 모델의 입력 100만 토큰당 USD 단가 |
| `OPENAI_OUTPUT_USD_PER_MILLION` | 출력 100만 토큰당 USD 단가 |
| `ADMIN_PASSWORD_HASH` | scrypt salt:hash. 원문 비밀번호를 설정하지 않음 |
| `ADMIN_SESSION_SECRET` | 최소 32자 독립 난수. 세션 서명용 |
| `CRON_SECRET` | 최소 32자 독립 난수. Cron/큐 실행기 인증 |

`NEXT_PUBLIC_`로 시작하는 비밀변수는 사용하지 않는다. 기본 월 한도는 $5 / 30회이며 `/admin`에서 0으로 낮추면 호출을 차단한다. 모델과 가격을 일부러 기본 지정하지 않았다. 사용 가능한 모델과 현재 단가를 확인해 입력하기 전에는 유료 요청을 실행하지 않는다. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [모델 가격](https://developers.openai.com/api/docs/pricing)

관리자 비밀번호 해시는 **비공개 로컬 터미널**에서 `npm run admin:password`로 만든다. 비밀번호는 최소 16자다. 입력은 터미널에 표시되므로 공유 화면에서 실행하지 않는다. 출력된 해시만 환경변수에 넣는다. 독립 비밀값은 다음 명령을 각각 실행해 생성한다.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

세션은 8시간, HttpOnly·SameSite=Strict이며 운영에서는 Secure다. 서명 키나 비밀번호 해시를 변경하면 기존 세션이 무효가 된다. 로그인은 DB 기반 15분당 5회 제한이다. Vercel 외부에서는 위조 가능한 IP 헤더 대신 공유 버킷을 사용한다. 초기 버전은 관리자 1명 전용이다.

## GitHub 설정과 동기화

공개 REST API는 토큰 없이도 사용 가능하다. 토큰을 쓸 경우 Fine-grained PAT를 만들고 필요한 공개 저장소만 선택한다. Contents: Read, Metadata: Read, PR을 수집하려면 Pull requests: Read 권한만 부여한다. 관리·쓰기 권한은 필요 없다. 기본 호출은 `/users/{owner}/repos?type=owner`여서 비공개 저장소는 수집하지 않는다.

관리자 → 동기화 → 수동 동기화 → 작업 1개 실행으로 수집한다. 저장소당 분석 작업이 큐에 추가된다. 저장소 ID와 작업 키의 UNIQUE 제약으로 중복을 막는다. 저장소 100개 단위 페이지네이션은 다음 수집 작업에 커서를 저장해 계속한다. 전체 페이지 수집 완료 후 목록에서 사라진 저장소를 숨겨 비공개 전환·삭제·계정 이전을 반영한다. 접근 가능한 커밋과 PR, 언어, topics, 날짜, 홈페이지, 이미지 후보를 저장한다. PR 접근 실패는 코드 분석을 막지 않는다.

이후 분석은 저장한 이름 대신 `/repositories/{id}`로 최신 메타데이터를 확인한다. 공개 여부와 계정 소유권을 다시 확인한다. 새 프로젝트는 기본 비공개·검토 대기다. Fork·archived·이름에 test/practice/tutorial/exercise가 포함된 저장소는 기본 자동 분석 제외다. 전체 목록은 관리자에서 확인할 수 있다. 전역 포함 정책과 저장소별 자동 분석 허용을 함께 설정한다. 미완성 여부는 코드만으로 판정하지 않으므로 관리자가 직접 제외한다.

Webhook은 선택 기능이다. `https://도메인/api/github/webhook`에 JSON 형식과 secret을 설정한다. 기존 저장소 push는 해당 저장소 Webhook으로 받을 수 있지만 **개인 계정의 새 저장소 전체를 기존 저장소 Webhook이 자동 구독하지는 않는다**. 계정 범위의 빠른 감지가 필요하면 적절한 저장소 범위를 가진 GitHub App의 repository / installation_repositories 이벤트를 연결한다. 이 구현은 수신 서명 검증을 제공하며 GitHub App 설치 토큰 자동 교체·설치 UI는 포함하지 않는다. 주기적인 계정 전체 수집이 누락 방지의 기본이다. [GitHub 이벤트 범위](https://docs.github.com/en/webhooks/webhook-events-and-payloads)

## 코드 분석과 비용 보호

기본 선별 규칙은 프레임워크와 무관하게 확장 가능한 경로 점수 기반이다. package.json·엔진 설정·스키마·README, 라우트·인증·서버·Scene·Player 등의 우선순위를 사용한다. Next/React/Node뿐 아니라 Godot GDScript·Scene, C#, Python, Rust, Go 등 텍스트 소스 확장자를 지원한다. 변경된 소스를 우선 포함해 고정된 상위 파일 밖의 변경도 분석 대상이 될 수 있다.

- 최대 18개 파일, 원본 30KB 이하 파일, 파일당 최대 10,000자·전체 소스 65,000자. 전체 요청의 UTF-8 크기 상한도 적용한다. 심볼릭 링크·비밀파일·산출물·바이너리를 제외하고 알려진 키 패턴을 마스킹한다.
- 저장소의 문자열은 신뢰하지 않는 데이터로 시스템 지침과 분리한다. 모델에 실행 도구·네트워크 도구를 제공하지 않고 `store:false`로 호출한다. 이것이 환각이나 모든 종류의 민감 문자열 제거를 보장하지는 않으므로 공개 저장소만 처리하고 기본 수동 승인을 유지한다.
- 전체 소스 manifest로 코드 변화 유무를 확인한다. README·CSS만 바뀌면 유료 호출을 생략한다. 선별된 내용의 정규화 해시로 서식 변화도 일부 생략한다. 모든 언어의 의미를 완전히 판정하는 AST 분석기는 아니므로 작은 TSX 스타일 수정 등이 보수적으로 재분석될 수 있다.
- 동일 프로젝트·커밋은 DB UNIQUE 제약과 저장소별 큐 키로 재분석을 막는다. 같은 커밋의 기존 결과는 재사용한다. 다른 모델/프롬프트로 같은 커밋을 강제 재분석하는 기능은 현재 없다.
- Structured Outputs와 Zod로 응답을 검증하고, 근거 경로·SHA·PR 번호가 실제 전달 목록에 있는지 검사한다. Problem / Approach / Result의 과정 증거가 부족하면 생략하도록 지시한다. 문장 자체의 진실성은 자동 증명할 수 없으므로 관리자 검토가 필요하다. 개발 기간·개인/팀 유형·직접 기여는 추정하지 않는다.
- API 요청 전 월간 행을 advisory lock으로 직렬화해 예산과 호출 횟수를 원자적으로 예약한다. 토큰 상한은 실제 프롬프트/스키마의 UTF-8 바이트와 출력 토큰 상한으로 보수적으로 계산한다. 비용은 설정 단가에 의한 추정이며 공급자 청구서가 아니다.
- 응답을 확인하지 못한 호출도 예약액을 유지한다. 타임아웃에서 실제 청구 여부를 모르는 상태로 예산을 풀지 않는다. OpenAI 요청 자체는 즉시 반복하지 않고 큐의 지수 백오프·최대 3회 재시도를 사용하며 매 시도 다시 예산 검증을 한다.
- GitHub 요청은 429/주요 rate-limit 403과 Retry-After를 처리한다. 네트워크·5xx는 제한적으로 재시도한다. 큐 상태·오류 코드는 저장하되 요청 헤더·비밀값·외부 오류 원문은 로그에 넣지 않는다.

장시간 작업은 DB 큐에 기록하고 HTTP 호출마다 1개만 처리한다. lease와 SKIP LOCKED로 실행 중복을 막고, 5분 lease 만료 시 복구하며 3회 실패 후에는 관리자 재시도 대기로 둔다. API 응답이 유실되는 분산 시스템에서 정확히 한 번의 외부 청구를 보장하지는 못한다. 비용 예약이 이 경우에도 상한을 보호한다. 대형 저장소에서 tree가 잘리거나 입력 상한을 초과하면 관리 검토 오류로 남긴다. 전체 저장소를 여러 AI 단계로 나누는 심층 분석은 아직 구현하지 않았다.

## 검토와 수동 수정

`/admin`의 프로젝트 탭은 제목·개요·링크·기술·기간·Problem Solving을 Project JSON으로 편집한다. 대표 이미지는 PNG/JPEG/WebP, 2MB까지 업로드하고 프로젝트 저장으로 반영한다. 이미지는 SHA-256 키로 중복 저장을 피한다. 외부 링크는 공개 HTTPS, 이미지 경로는 허용 형식만 받는다. 외부 이미지는 브라우저에서 로드해 서버 이미지 프록시의 외부 URL 요청을 피한다.

수동 변경은 최상위 필드 또는 detail 하위 필드별로 잠근다. 보호된 필드는 AI 제안 승인으로도 덮어쓰지 않는다. 배열(예: troubleshooting)은 배열 전체가 하나의 보호 필드다. 기존 데이터 이관 시 모든 필드를 수동 작성으로 보호한다. 편집 충돌은 updated_at으로 감지해 409를 반환한다. 새 UI에 잠금 해제 기능은 없으며 기존 설명 보호가 우선이다.

검토 탭에서 현재 내용과 보호 규칙 적용 후의 제안을 비교하고 원본 AI 결과·파일·커밋·PR·이미지 후보를 열 수 있다. 승인 후 게시, 승인하며 현재 공개 상태 유지, 거절을 선택한다. 자동 게시를 켜도 수동 보호 필드 또는 reviewNotes가 있는 결과는 검토 대기로 둔다. 상태는 AI 생성/업데이트 제안, 직접 수정, 검토 완료, 게시 완료, 거절과 작업 실행 상태로 구분된다.

## Vercel 설정

실제 배포와 운영 DB 수정은 이 작업에서 실행하지 않았다. 기존 Vercel 프로젝트에 변경을 배포하기 전에 다음을 확인한다.

1. 기존 프로젝트와 연결된 Git 저장소·Next.js 설정을 유지한다. Node 22 이상을 권장하며 build command는 `npm run build`다.
2. 먼저 별도의 개발 DB에 마이그레이션·seed를 검증한다. 운영에서는 백업을 보관하고 전용 DB에 동일 순서로 적용한다. DB 생성/운영 이관은 자동 배포 빌드에 넣지 않는다.
3. Vercel의 Production 환경변수에 `.env.example` 항목을 설정한다. Preview는 별도의 DB와 비밀값을 사용한다. `APP_URL`은 실제 접속 도메인과 일치해야 한다.
4. DB와 함수 리전을 가깝게 설정한다. 작업 API의 `maxDuration=60`이 실제 프로젝트 플랜/함수 설정에서 허용되는지 확인한다. 한 작업이 제한을 넘으면 lease 만료 후 재시도한다. 매우 느린 저장소는 수집 단계를 더 작은 작업으로 분할하는 확장이 필요할 수 있다.
5. `vercel.json`은 UTC 03:00, 한국 12:00의 일일 Cron을 등록한다. Vercel이 자동으로 `Authorization: Bearer CRON_SECRET`을 보낸다. Hobby의 일일 실행·시각 정밀도 제약에 맞춘 설정이며 실제 계정 플랜은 이 환경에서 조회하지 않았다. [Cron 제한](https://vercel.com/docs/cron-jobs/usage-and-pricing)
6. 일일 Cron 하나는 **작업 1개만 실행**한다. 신규 저장소 분석이 큐에 쌓이지 않도록 아래 실행기를 반드시 함께 활성화하거나 적절한 외부 스케줄러를 연결한다. 서버 메모리의 fire-and-forget 작업은 사용하지 않는다.

### 선택 실행기

포트폴리오 GitHub 저장소의 Actions를 활성화하고 다음을 설정한다.

- Actions repository variable: `PORTFOLIO_SYNC_ENABLED=true`
- Actions secret: `PORTFOLIO_URL=https://실제-운영-도메인`
- Actions secret: `PORTFOLIO_CRON_SECRET` = Vercel `CRON_SECRET`과 동일한 값

포함된 workflow는 15분마다 대기 작업 최대 5개를 순서대로 처리한다. 켜기 전까지는 실행 조건이 false라 동작하지 않는다. GitHub Actions 실행 시간·허용량은 계정 정책을 따르고 정각 실행은 보장되지 않는다. Actions의 유휴 저장소 예약 작업 비활성화도 확인한다. 다른 실행기를 쓴다면 인증 헤더를 넣어 `/api/cron?mode=work`를 호출한다. `/api/cron`은 수집도 예약하고, `mode=work`는 기존 큐만 처리한다.

공개 페이지는 방문 시 GitHub/OpenAI를 호출하지 않고 DB에 저장된 공개 스냅샷만 읽는다. 수정·승인·숨김과 스냅샷을 같은 트랜잭션에 반영하고 공개 페이지를 dynamic으로 제공해 별도 재배포나 CDN 재검증 없이 다음 요청에 반영한다. 방문자 DB 조회 비용은 발생한다.

## 장애 동작과 현재 제약

- GitHub/OpenAI 실패나 분석 실패는 기존 게시 스냅샷을 바꾸지 않는다. 미게시 항목이 공개 조회에 섞이지 않는다. DB 트랜잭션 실패도 직전 게시 데이터를 유지한다.
- DB 환경변수를 아직 설정하지 않았다면 기존 정적 데이터로 정상 표시한다. DB 설정 후 seed 전에는 원본을 표시한다. **DB 자체가 완전히 응답하지 않으면 숨긴 원본이 다시 노출되지 않도록 프로젝트 목록은 비워서 실패 처리**하고 나머지 사이트는 유지한다. 별도 장애용 공개 스냅샷 저장소/CDN 미러는 구현하지 않아 DB 장애 중 프로젝트 목록까지 계속 제공하지는 못한다.
- 이미지는 소규모 포트폴리오를 위해 DB에 저장하며 공개 참조 여부를 매번 검증한다. 대량 파일용 object storage·자동 최적화·고아 이미지 정리는 없다.
- 관리자 1명용 비밀번호 인증이며 OAuth·다중 관리자·2FA·GitHub App 설치 UI는 없다.
- 프로젝트 JSON 편집을 제공한다. 비개발자용 상세 폼·드래그 정렬·자동 스크린샷 촬영·정교한 문장별 diff·대형 저장소 다단계 심층 분석은 없다. 정렬은 숫자로 변경한다.
- API 키와 운영 서비스 연결이 없어 실제 OpenAI 설명 품질·실제 GitHub 계정 권한·Vercel Cron/리전/플랜/운영 캐시 동작은 아직 검증하지 않았다. 배포 후 소규모 저장소 1개로 연결 확인부터 진행해야 한다.

## 테스트 명령

```sh
npm test
npm run test:integration
npm run lint
npm run typecheck
npm run build:verify
npx playwright install chromium
npm run test:e2e
```

통합 검증은 PGlite의 격리된 메모리 PostgreSQL과 실제 PostgreSQL 드라이버를 사용하고, GitHub/OpenAI fetch를 Mock으로 대체한다. 운영 DB·유료 API를 사용하지 않는다. 이 환경은 PostgreSQL 멀티세션 잠금의 실제 운영 동시성/성능을 대체하지 않으므로 운영 부하 검증은 별도다.

브라우저 테스트도 독립 메모리 DB와 테스트 전용 관리자 비밀번호로 Next production server를 3107 포트에서 시작한다. `.next-verify` 빌드를 사용해 현재 개발 서버의 `.next`와 충돌하지 않는다. 스크린샷은 `artifacts/`, 실패 trace는 `test-results/`에 생성한다. 기본 `.env.local`의 실제 키로 외부 분석을 호출하지 않는다.

### 이번 작업의 검증 기록 (2026-11-07)

| 검증 | 결과 |
| --- | --- |
| 단위 테스트 | 11개 통과. 원문 바이트 보존, 소스 선별, 수동 필드 보호, URL, 이미지, scrypt/세션 검사 |
| Mock 통합 | 13개 시나리오 통과 (상위 테스트를 포함한 Node 집계는 14). 실제 마이그레이션/seed 반복 실행, 중복 방지, 코드 포함 분석 요청, 변경 캐시, 예산, 오류 복구, 신규 파일 선별, 101개 저장소 페이지네이션 |
| Playwright | 5개 통과. 공개/상세·관리자 수정/승인/숨김, 권한·CSRF·수정 충돌·업로드·로그인 제한, 375px/1440px와 다크 모드 |
| lint / typecheck | 통과 |
| Next production build | 기본 build 및 분리된 build:verify 실행. 최종 검증은 build:verify 사용 |
| npm audit | 최종 의존성 트리에서 0건 |
| 실제 운영 DB/계정 API/OpenAI 품질/Vercel 배포 | 미실행. API 키와 운영 연결 설정이 필요하며 실제 배포는 승인받지 않아 수행하지 않음 |

구현 상태는 운영 서비스 연결을 마친 배포 완료 상태가 아니다. 별도 개발 DB에서 환경변수·권한과 실제 계정의 소규모 저장소 1개를 먼저 확인한 뒤 운영 적용해야 한다.

### 실제 연결 사전 점검

`node --import tsx scripts/verify-live.ts env`는 `.env.local`의 변수 이름·존재·형식만 검사하고 비밀값을 출력하지 않는다. `db`는 읽기 전용으로 연결·테이블 충돌·생성 권한을 검사한다. `compare`는 이관 후 프로젝트 3개·홈 Problem Solving 4개·상세 항목·공개 스냅샷을 비교한다. 이 명령들은 마이그레이션을 자동 실행하지 않는다.

`github`는 저장소 메타데이터 최대 1건만 읽는다. `openai`는 설정 모델의 Responses API와 최소 JSON Schema 호환성을 출력 상한 64토큰·재시도 없이 1회 확인한다. 실제 프로젝트 설명 스키마·품질 검증과는 별개다. DB가 없으면 비용 예약을 무시된 `artifacts/openai-connect.reservation.json`에 보관하고 중복 호출을 차단한다. 월간 DB 예산을 검증할 수 없는 경우에도 이 연결 테스트의 추정 예약 상한은 $0.05다. 이 명령은 프로젝트 수집/분석 큐를 생성하지 않는다.

실행 결과는 비밀값 없이 `artifacts/live-check.json`에 기록한다. DB가 없으면 연결·충돌 검사·이관·비교는 진행할 수 없으므로 실제 PostgreSQL 연결 URL을 `DATABASE_URL`에 저장해야 한다.
