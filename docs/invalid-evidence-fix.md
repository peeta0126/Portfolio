# INVALID_EVIDENCE 원인 조사·수정 기록 (2026-11-07)

## 확인한 실패 조건

수정 전 `lib/automation/ai.ts` 48–49행은 `generatedSchema.parse(JSON.parse(output))` 이후 기본 설명의 `evidence[].sources`와 `troubleshooting[].evidence`를 모두 검사했다. 허용 목록은 실제 본문을 보낸 `source.files[].path`, 전달한 커밋의 `id`, 전달한 PR의 `id`뿐이었다. 하나라도 정확히 일치하지 않으면 `INVALID_EVIDENCE`로 전체 분석이 저장되지 않았다.

`./src/main.ts`, 역슬래시, 줄 번호를 붙인 참조도 정확히 일치하지 않는다. tree/manifest에만 있고 본문을 보내지 않은 파일, 존재하지 않는 파일도 같은 오류가 된다. 스키마 오류는 이 검사 전에 실패하므로, 제시된 `INVALID_EVIDENCE`의 직접 원인은 스키마 오류가 아니다.

기존 구현은 실패한 AI Evidence와 분석 파일 목록을 저장하지 않고 worker가 오류 코드만 로그에 남겼다. 따라서 08:42:56의 실제 응답을 복원해 특정 경로끼리 비교할 수 없으며, 표기 차이·미분석 파일·존재하지 않는 참조 중 무엇이었는지는 확정할 수 없다. 성공한 분석의 `analyzed_files`를 실패한 요청의 입력으로 대신할 수도 없다. 이번에는 실제 DB 연결이나 OpenAI 재호출로 재현하지 않았다.

## 수정 내용

- 실제 본문을 보낸 파일에 대응하는 `./`, 구분 문자, 줄 번호의 표기 차이만 허용한다. 줄 번호는 전송한 본문 범위 안인지 검사하고 정규화 후에도 보존한다. 대소문자, 파일명만 있는 참조, 저장소 접두사, 절대 경로, 경로 순회, 미제공 SHA/PR은 추측으로 보정하지 않는다.
- AI 입력에 `allowedEvidence`와 근거 규칙을 명시한다. tree/manifest에만 있는 파일은 근거로 사용할 수 없다.
- 기본 설명에 무효한 참조가 있으면 저장·공개하지 않는다. 기존 큐의 지연 재시도에 비교 결과를 전달해 AI가 현재 자료로 다시 생성하도록 한다. 같은 실행에서 추가 호출하지 않고, 매 시도 기존 비용 예약·월간 예산 제한을 적용한다. 3회 실패하면 멈춘다.
- 잘못된 JSON이나 기본 설명의 스키마 오류는 `AI_SCHEMA_INVALID`로 구분한다.
- Problem Solving은 항목별로 검사한다. 스키마 오류, 무효한 참조, 빈 문제/접근/결과, 코드 참조만 있는 항목은 제외한다. 기본 설명과 검증을 통과한 다른 항목은 보존하고 reviewNotes를 추가해 자동 공개를 막는다.
- 과거 문제 해결에는 제공된 커밋/PR 참조를 요구한다. 다만 참조의 실재가 문장 자체의 진실성을 증명하지는 않는다. 실제 내용의 의미와 인과관계는 관리자가 검토해야 한다.
- `sync_logs`의 `analysis_evidence_validation`에 project ID, commit, 분석 파일 path/SHA, 허용 참조, AI 제출 참조, 항목별 거부 이유를 기록한다. 본문이나 AI 전체 응답은 저장하지 않는다. 기본 근거 실패 진단은 job payload에도 저장해 다음 시도에 활용한다. DB 스키마 변경은 없다.

## 검증

- `npm test`: 14개 통과.
- `npm run test:integration`: 17개 시나리오 통과(Node 상위 테스트 포함 18개).
- `npm run typecheck` / `npm run lint`: 통과.
- Mock 비교: `src/nonexistent.ts`는 실제 입력 `src/main.ts` / `README.md`에 없어 거부했다. 다음 시도에서 반환한 `./src/main.ts:1`은 본문의 1행으로 검증해 `src/main.ts#L1`으로 정규화했다.
- 미분석 파일, 존재하지 않는 참조, 모호한 경로, 잘못된 줄 범위, 미제공 SHA/PR, 항목별 제외, 재시도 피드백, 3회 중단, 실패 분석의 미저장을 검증했다.
- 원본 `data/projects.ts`와 `data/problem-solving.ts`는 변경하지 않았다. 백업과 바이트 일치, 격리 DB의 프로젝트 3개·홈 Problem Solving 4개 내용 일치를 검증했다.
- 모든 GitHub/OpenAI 요청은 Mock이다. 실제 DB 쓰기, 실제 OpenAI 호출, 운영 재시도, 배포는 실행하지 않았다.
