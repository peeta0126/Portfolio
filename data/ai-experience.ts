export const aiExperience = [
  {
    title: "Codex를 활용한 코드베이스 분석",
    description:
      "기존 구조를 먼저 파악하고 수정 대상 파일과 영향 범위를 찾는 데 Codex CLI를 활용합니다. 기능 요구사항과 변경하면 안 되는 범위를 함께 정의한 뒤 작업합니다.",
  },
  {
    title: "생성형 AI를 활용한 게임 Asset 제작",
    description:
      "방향별 캐릭터 스프라이트와 UI 시안을 반복 제작했습니다. 캐릭터 크기, 방향, 프레임 수와 발 위치 같은 실제 게임 규격을 정하고 결과를 직접 수정·검증해 적용했습니다.",
  },
  {
    title: "결과를 직접 검증하는 활용 원칙",
    description:
      "AI가 제안한 결과를 그대로 적용하지 않습니다. Git diff로 변경 범위를 확인하고 TypeScript 검사, 테스트, production build와 실제 화면을 기준으로 최종 결과를 검증합니다.",
  },
] as const;
