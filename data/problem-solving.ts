import type { ProblemSolving } from "@/types";

export const problemSolving: ProblemSolving[] = [
  {
    project: "Voyager Atelier",
    title: "프레임마다 흔들리던 캐릭터 이동 개선",
    problem:
      "Workshop의 걷기 애니메이션에서 방향과 프레임마다 발 위치와 이미지 크기가 달라 캐릭터가 위아래로 튀거나 공중에 떠 있는 것처럼 보였습니다.",
    solution:
      "각 방향 시트의 프레임 크기, 발 위치와 기준점을 확인했습니다. 이미지 크기 변화가 게임 좌표에 영향을 주지 않도록 출력 기준을 일정하게 유지하고, 시각적 애니메이션을 기존 이동·충돌 로직과 분리했습니다.",
    result:
      "이동·충돌 시스템을 변경하지 않으면서 캐릭터가 동일한 지면을 기준으로 자연스럽게 걷도록 개선했습니다.",
  },
  {
    project: "Voyager Atelier",
    title: "1.2MB 폰트 리소스를 65KB로 최적화",
    problem:
      "한글 전체 glyph를 포함한 세 개의 폰트 파일이 모든 화면의 초기 정적 리소스에 포함되고 있었습니다.",
    solution:
      "빌드 과정에서 프론트엔드와 서버 소스의 실제 사용 문자를 수집하고 필요한 glyph만 포함한 WOFF2 서브셋을 생성하도록 자동화했습니다.",
    result:
      "저장소의 성능 측정 기록 기준 1,207KB에서 65KB로 줄여 전체 폰트 리소스 용량을 약 95% 절감했습니다.",
    metric: { before: "1,207 KB", after: "65 KB", change: "95% ↓" },
  },
  {
    project: "별빛 타로",
    title: "AI 응답과 사용자 입력을 구조화",
    problem:
      "자유 형식 AI 응답과 검증되지 않은 질문을 그대로 사용하면 결과 화면의 구조가 흔들리고 서비스 범위를 벗어난 요청이 전달될 수 있었습니다.",
    solution:
      "질문을 7개 결과 유형으로 사전 분류하고, Responses API 응답은 Zod Structured Outputs로 검증했습니다. 카드 원본 정보는 서버에서 다시 조회했습니다.",
    result:
      "프론트엔드는 검증된 필드를 기준으로 결과를 렌더링하고, AI에 전달되는 데이터와 입력 범위를 서버에서 통제할 수 있게 됐습니다.",
  },
  {
    project: "CrewSpace",
    title: "역할별 화면과 반복 UI 분리",
    problem:
      "관리자 기능과 일반 사용자 기능이 같은 흐름에 섞이고, 회원·일정·신청 화면의 유사한 UI가 반복됐습니다.",
    solution:
      "사용자 역할에 따라 기능의 표시와 실행 조건을 구분하고, 반복되는 카드와 목록 UI를 React 컴포넌트로 분리했습니다.",
    result:
      "역할별 기능 경계가 명확해졌고 공통 UI의 수정 지점을 한곳으로 모을 수 있게 됐습니다.",
  },
];
