# 작업 큐 초기화 (2026-11-07)

## 실제 DB 초기화 결과

2026-11-07 08:58:55 KST에 완료했다. 초기 조회와 초기화 직전 조회 모두 실행 중인 작업은 0개였다.

| 작업 | 상태 | 초기화 전 | 초기화 후 |
| --- | --- | ---: | ---: |
| analyze | 대기 | 5 | 0 |
| discover | 완료 | 1 | 0 |
| 전체 | 모든 상태 | 6 | 0 |

삭제 전에 큐를 `artifacts/queue-before-reset-1794009534414.json`에 백업했다. 이 파일은 자동 복원하지 않는다. 상세 전후 개수와 해시 검증은 `artifacts/queue-reset.json`에 보관했다.

아래 테이블은 초기화 전후 전체 행의 개수와 SHA-256 해시가 일치했다. 비밀값이나 본문은 출력하지 않았다.

- projects: 6개. 기존 프로젝트 3개를 포함해 모든 프로젝트 정보·관리자 수정·보호 필드·공개 상태·분석 캐시를 보존했다.
- portfolio_home_problem_solving: 4개.
- project_problem_solving: 6개.
- project_analysis: 초기화 전부터 0개이며 이후에도 0개. 분석 결과 삭제는 하지 않았다.
- portfolio_public_snapshot: 1개.
- ai_usage: 4개. 비용·토큰·예약 기록을 보존했다.
- portfolio_settings: 1개.
- portfolio_images: 0개.

기존 sync_logs는 전체 행이 그대로 남았으며 queue_reset 감사 로그 1건만 추가했다. 실제 GitHub 동기화, OpenAI API 호출, 실제 수동 동기화 예약, Vercel 배포는 실행하지 않았다.

## 관리자 기능

동기화 메뉴에 ‘작업 큐 초기화’ 버튼을 추가했다. 목록 표시 제한 100개와 별도로 전체 큐의 종류·상태별 개수를 조회해 표시한다. 확인 창에서 삭제 범위와 보존 대상을 안내하며, 취소하면 요청하지 않는다. 실행 중인 항목이 보이면 버튼을 비활성화한다.

서버의 POST `/api/admin`은 기존 requireAdmin을 통해 세션과 Origin을 검사하고, `{action:"resetQueue",confirmed:true}`를 요구한다. 클라이언트 표시와 무관하게 트랜잭션에서 실행 중인 작업을 다시 확인해 있으면 HTTP 409로 거부한다. lease가 만료된 running도 임의 삭제하지 않는다.

초기화는 portfolio_jobs 테이블의 트랜잭션 잠금으로 enqueue·claim·retry와 직렬화한다. 잠금 대기는 5초로 제한하며 잠금 충돌은 재시도 안내를 반환한다. discover/analyze 중 queued/done/failed만 삭제한다. 다른 종류나 알 수 없는 상태는 보존한다. 전후 개수와 초기화 감사 로그를 같은 트랜잭션에 저장한다.

중복 방지용 dedupe_key는 삭제된 작업과 함께 정리돼 새 수동 예약이 가능하다. 프로젝트의 source_hash/source_manifest/last_commit과 project_analysis의 프로젝트·커밋 UNIQUE 제약은 보존하므로 기존 분석 재사용과 중복 분석 방지는 유지된다. 자동화 설정이나 외부 스케줄러는 변경하지 않았으므로 다음 정상 예약 시 새 작업은 생성될 수 있다.

## 검증

- 단위 테스트 14개 통과. 기존 원본 파일과 백업의 바이트 일치 포함.
- 격리 PostgreSQL + GitHub/OpenAI Mock 통합 시나리오 20개 통과(Node 상위 테스트 포함 21개).
- 브라우저 테스트 6개 통과. 초기화 확인 취소/승인, 인증 없는 요청 401, CSRF 403, 확인 누락 400, 전후 개수 표시, 데이터 보존, 새 수동 동기화 예약을 검증했다.
- 실행 중인 작업 및 lease 만료 running 차단, 큐만 삭제, 재예약·중복 방지, 빈 큐 재초기화를 검증했다.
- lint, typecheck, 분리 production build (`npm run build:verify`) 통과.

새 수동 동기화와 분석 예약은 격리된 테스트 DB에서만 확인했다. 예약 후 실제 작업 실행은 하지 않았고 외부 서비스 호출도 없었다. 기존 통합 시나리오의 분석 요청은 Mock으로만 실행했다.
