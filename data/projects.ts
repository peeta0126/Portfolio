import type { Project } from "@/types";

// 프로젝트 객체를 추가하면 메인 목록과 /projects/[slug] 상세 페이지에 반영됩니다.
export const projects: Project[] = [
  {
    slug: "crewspace",
    title: "CrewSpace",
    subtitle: "동아리 운영을 위한 통합 관리 웹 서비스",
    period: "2026.03 — 2026.06",
    tech: ["React", "TypeScript", "Vite", "Tailwind CSS"],
    featured: true,
    description:
      "회원 관리, 가입 신청, 일정, 투표 등 동아리 운영에 필요한 기능을 한곳에서 관리할 수 있도록 만든 웹 애플리케이션입니다.",
    github: "https://github.com/peeta0126/CrewSpace",
    demo: "https://crew-space-nine.vercel.app/",
    detail: {
      overview:
        "동아리 운영 과정에서 회원, 가입 신청, 일정과 투표 정보를 하나의 화면에서 관리하기 위해 만든 웹 서비스입니다.",
      problem:
        "동아리 정보를 메신저, 문서, 스프레드시트 등 여러 곳에서 관리하면 정보가 분산되고 운영진이 같은 내용을 반복해서 확인하거나 정리해야 하는 문제가 생길 수 있습니다.",
      goal:
        "관리자와 회원이 각자의 역할에 맞는 회원 관리, 일정, 투표 기능을 한곳에서 사용할 수 있도록 만드는 것을 목표로 했습니다.",
      architecture:
        "React와 TypeScript 기반 SPA로 구현했으며, 인증·회원·일정·가입 신청 상태 로직은 useAuth, useMembers, useSchedules, useApplications Custom Hook으로 분리했습니다. 화면은 Sidebar, DashboardCards, MemberTable, ScheduleCards, SignupApplicationsPanel 등의 UI 컴포넌트로 나누었습니다.",
      api:
        "현재 버전은 별도의 백엔드 API 없이 프론트엔드 상태를 기반으로 동작합니다. 추후 실제 사용자 데이터 저장을 위해 인증 서버와 REST API, 데이터베이스 연동이 필요한 구조입니다.",
      features: [
        "로그인 및 회원가입",
        "관리자 모드 전환",
        "회원 정보 조회 및 관리",
        "가입 신청 승인 및 거절",
        "일정 생성 및 참석 여부 투표",
        "일반 투표 생성 및 참여",
        "동아리 현황 대시보드",
      ],
      process:
        "기능별 요구사항에 맞춰 화면을 구성한 뒤, 기능이 늘어나면서 화면 컴포넌트에 모이던 상태 로직을 Custom Hook으로 옮기고 반복되는 UI를 별도 컴포넌트로 분리했습니다. 관리자 모드에 따라 표시되는 기능도 구분했습니다.",
      troubleshooting: [
        {
          title: "기능별 상태와 로직 분리",
          problem:
            "회원, 일정, 인증, 가입 신청 상태와 기능이 화면 컴포넌트에 집중되면서 코드의 책임과 수정 범위가 커졌습니다.",
          solution:
            "useAuth, useMembers, useSchedules, useApplications Custom Hook으로 기능별 상태와 로직을 분리했습니다.",
          result:
            "컴포넌트의 책임이 명확해졌고 기능별 코드 수정 범위가 줄었습니다.",
        },
        {
          title: "관리자 기능 구분",
          problem:
            "회원 삭제와 가입 신청 처리 같은 관리자 기능을 일반 사용자 기능과 구분할 필요가 있었습니다.",
          solution:
            "관리자 여부와 관리자 모드 상태를 기준으로 관리 기능의 표시와 실행 조건을 나누었습니다.",
          result:
            "관리자와 일반 사용자가 사용할 수 있는 기능의 구분이 명확해졌습니다.",
        },
        {
          title: "화면 단위 UI 컴포넌트 분리",
          problem:
            "대시보드, 회원 목록, 일정, 가입 신청 UI가 한 화면에 모이면서 동일한 UI 로직이 반복되고 컴포넌트가 커졌습니다.",
          solution:
            "DashboardCards, MemberTable, ScheduleCards, SignupApplicationsPanel 등 화면의 역할에 따라 컴포넌트를 분리했습니다.",
          result:
            "동일한 UI 로직의 중복을 줄이고 각 화면의 수정 범위를 제한했습니다.",
        },
      ],
      performance:
        "기능별 Custom Hook과 UI 컴포넌트 분리를 통해 코드 중복을 줄이고, 각 기능의 수정 범위를 제한했습니다. 별도의 성능 측정이나 대규모 데이터 최적화는 진행하지 않았습니다.",
      retrospective:
        "기능이 늘어날수록 초기 구조 설계가 중요하다는 점을 배웠고, Custom Hook과 컴포넌트 분리를 직접 적용해 보았습니다. 현재는 프론트엔드 상태 기반이므로 실제 서비스화를 위해 백엔드, 데이터베이스, 인증 연동이 필요합니다. 다음 단계에서는 학습 중인 FastAPI와 PostgreSQL을 연결해 보고 싶습니다.",
    },
  },
  {
    slug: "starlight-tarot",
    title: "별빛 타로",
    subtitle: "Starlight Tarot",
    period: "2026.08",
    tech: ["Next.js", "React", "TypeScript"],
    featured: true,
    thumbnail: "/projects/starlight-tarot.webp",
    description:
      "78장의 타로카드 중 세 장을 선택해 분야별 운세를 확인하는 반응형 웹 서비스",
    github: "https://github.com/peeta0126/tarot-card",
    demo: "https://tarot-card-swart.vercel.app/",
    detail: {
      overview:
        "별빛 타로는 Rider–Waite–Smith 타로 체계를 기반으로, 사용자가 관심 있는 운세 분야와 카드 방향 모드를 선택한 뒤 78장의 카드 중 세 장을 직접 골라 결과를 확인할 수 있는 웹 서비스입니다. 선택한 세 장을 ‘현재의 흐름’, ‘주의할 점’, ‘앞으로의 방향’으로 구분하고, 각 카드의 기본 의미와 주요 상징, 분야별 해석, 종합 운세와 현실적인 행동 조언을 제공합니다.",
      architecture:
        "Next.js와 React, TypeScript로 구현했습니다. 카드 원본 데이터와 운세 분야·카드 위치·방향 상수는 data 디렉터리에 분리하고, 셔플·위치 배정·분야별 결과 생성 로직은 utils 모듈에서 담당합니다. 화면은 분야 선택, 모드 선택, 덱, 카드, 결과 및 카드별 해석 컴포넌트로 나누었습니다.",
      features: [
        "종합운·연애운·학업운·취업·직장운·금전운·인간관계운 선택",
        "모든 카드를 정방향으로 읽는 기본 모드",
        "정방향과 역방향을 함께 사용하는 심화 모드",
        "78장 전체 덱의 셔플과 중복 없는 세 장 선택",
        "현재의 흐름·주의할 점·앞으로의 방향별 결과",
        "카드 이미지·영문명·키워드·주요 상징·기본 의미 제공",
        "선택 분야의 카드별 해석과 세 장을 연결한 종합 운세",
        "같은 분야로 다시 보기 및 다른 분야 선택",
        "모바일과 데스크톱에 대응하는 반응형 UI",
        "선택 상태와 접근성 이름을 반영한 인터페이스",
      ],
      userFlow: [
        "운세 분야를 선택합니다.",
        "기본 모드 또는 심화 모드를 선택합니다.",
        "78장의 카드를 섞습니다.",
        "중복되지 않는 카드 세 장을 선택합니다.",
        "현재·주의·방향으로 나뉜 카드별 해석을 확인합니다.",
        "세 장을 연결한 종합 운세와 행동 조언을 확인합니다.",
        "같은 분야로 다시 진행하거나 다른 분야를 선택합니다.",
      ],
      implementation: [
        "78장의 이름, 이미지, 키워드, 상징, 기본 의미와 분야별 해석을 TarotCardData 타입에 맞춰 별도 데이터로 관리",
        "운세 분야·카드 위치·정방향과 역방향을 조합해 카드별 해석과 종합 결과를 생성",
        "Fisher–Yates 방식으로 전체 덱을 섞고 카드 ID 배열로 선택 상태를 관리해 같은 카드를 중복 선택하지 않도록 구성",
        "setup·select·result 세 단계와 선택 분야, 모드, 덱, 선택 카드, 결과를 React 상태로 관리",
        "분야 미선택, 세 장 미선택, 셔플 진행 여부에 따라 진행·선택 버튼의 disabled 상태를 제어",
        "분야·모드 선택기, 카드 덱, 개별 카드, 카드 해석, 결과 화면을 재사용 가능한 컴포넌트로 분리",
        "CSS 미디어 쿼리로 카드 그리드와 결과 화면을 모바일·데스크톱 크기에 맞게 조정",
        "fieldset·legend와 제목 연결, aria-pressed·aria-label·aria-busy를 사용해 선택과 진행 상태를 전달",
      ],
      process:
        "사용자 선택에 따라 전체 78장을 먼저 섞은 뒤 선택 화면에 22장을 펼칩니다. 선택한 세 장에는 선택 순서를 부여하고, 결과 단계에서 각각 현재의 흐름·주의할 점·앞으로의 방향에 배치합니다. 카드 방향과 분야별 데이터로 개별 문장을 만들고 카드 조합의 특징을 더해 종합 메시지와 행동 조언을 구성합니다.",
      retrospective:
        "콘텐츠가 많은 서비스를 카드 데이터, 해석 로직, 화면 컴포넌트로 나누어 각 영역의 책임을 분명하게 구성했습니다. 결과를 확정적인 예언으로 단정하지 않고 사용자가 현재를 돌아볼 수 있는 참고 정보와 현실적인 행동 조언으로 표현했습니다.",
    },
  },
];
