# 상세 설명 운영 반영 결과

2026-11-07 11:47 KST 실제 사이트 검증 완료.

- 운영 주소: https://portfolio-iota-sage-3jin175bbg.vercel.app/
- 증강 알까기: https://portfolio-iota-sage-3jin175bbg.vercel.app/projects/github-1431052115
- Vercel 프로젝트: portfolio / prj_r7sCHCSHUjSUqjSzoOwwfPuWs0Vl
- 운영 배포: dpl_H9VkMCyLp2XYDBiDzmSGhLnATXT2 (READY)
- Git commit/push 없이 검증한 로컬 소스 68개를 직접 배포했다. 현재 Git HEAD는 b411aaab6d0bfee5adab1c0e34de51732d5dcb69이며 작업 트리 변경은 아직 미커밋 상태다.

## 반영 내용

기존 Vercel 운영 프로젝트에는 환경변수가 없었다. 검증된 로컬 설정의 서버 전용 변수 12개를 Production에 등록하고 APP_URL을 실제 운영 도메인으로 맞췄다. 비밀값은 배포 소스에 넣지 않았다.

DB 백업 뒤 002_editorial.sql의 추가형 테이블 두 개를 생성했다. 새 코드가 READY가 된 후 사용자가 승인한 로컬 증강 알까기 원고를 수동 게시했다. 기술 사실과 별도 근거, 이전 본문, 승인된 초안을 함께 저장하고 변경 필드는 수동 보호 상태로 남겼다. 개인 동기·기간·프로젝트 구분·회고·이미지는 임의 확정하거나 교체하지 않았다.

- 기술 분석 ID: ba38948a-e269-439c-b803-e60f83f7d6cc
- 게시 초안 ID: 67ee0f0e-de24-40a4-a566-486e80371bf1
- 증강 알까기 상세 설명 및 실제 변경 이력에 근거한 Problem Solving 3개 반영.
- 설명 재작성 예약, 기술 근거 조회, 초안 미리보기·수정·버전 비교·승인/거절 UI 배포.
- Focus Hub와 Developer Portfolio는 기존 DB 공개 내용으로 표시되며 이번에 작성한 별도 원고로 교체하지 않았다.

## 실제 검증

메인과 프로젝트 상세 6개가 모두 HTTP 200이다. 이전에 404였던 신규 상세 페이지 3개도 정상 표시된다.

프로젝트 카드 6개, 홈 Problem Solving 7개를 확인했다. 홈의 기존 원문 4개는 그대로이고 증강 알까기의 사례 3개가 추가 표시된다.

관리자 조회는 유효한 세션에서 200, 인증 없이는 401이다. 실제 배포에서 기술 근거와 게시 초안이 조회되고 설명 재작성 버튼이 활성화되는 것을 확인했으며, 재작성이나 작업 실행 버튼은 누르지 않았다.

1440px와 375px 상세 화면, 375px 관리자 화면을 확인했다. 가로 넘침·브라우저 실행 오류가 없었고 공개 본문에 인라인 근거 표식이나 확인용 회고 초안이 노출되지 않았다.

DB 전후 비교 결과:

- 증강 알까기를 제외한 프로젝트 5개 내용·공개 상태·수동 보호 필드 보존.
- 기존 홈 원문 4개 보존.
- 기존 AI 분석 3개 보존.
- API 사용량 8건과 비용 합계 보존. 실제 OpenAI 호출 0회.

백업은 artifacts/release/db-before-migrate-*.json 및 db-before-publish-*.json, 게시 기록은 content-publication.json, 검증 결과는 verification.json에 보관했다. 이 파일들은 Git에서 제외된다.

실제 화면: artifacts/release/live-augment-1440.png, live-augment-375.png, live-admin-mobile.png.
