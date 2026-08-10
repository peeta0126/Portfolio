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
];
