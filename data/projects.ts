import type { Project } from "@/types";

// 프로젝트 객체를 추가하면 메인 목록과 /projects/[slug] 상세 페이지에 함께 반영됩니다.
export const projects: Project[] = [
  {
    slug: "voyager-atelier",
    title: "Voyager Atelier",
    subtitle: "브라우저 기반 몬스터 수집 JRPG",
    period: "2026.07 — 2026.09",
    kind: "Team Project",
    tech: [
      "React",
      "TypeScript",
      "Phaser",
      "Zustand",
      "Vite",
      "Tailwind CSS",
      "Express",
      "Prisma",
      "SQLite",
    ],
    cardTech: ["React", "TypeScript", "Phaser", "Zustand"],
    featured: true,
    thumbnail: "/projects/voyager-atelier-basecamp.png",
    description:
      "React UI와 Phaser 게임 Scene을 결합해 제작한 브라우저 기반 몬스터 수집 JRPG",
    github: "https://github.com/peeta0126/monster-rpg",
    detail: {
      overview:
        "Voyager Atelier는 React, TypeScript, Phaser를 기반으로 제작한 브라우저 기반 몬스터 수집 JRPG입니다. 베이스캠프에서 캐릭터를 조작하며 전투, 숲 탐험, 몬스터 관리, 공방 제작 등의 콘텐츠를 이용합니다. React 기반 UI와 Phaser 기반 게임 Scene이 하나의 애플리케이션에서 함께 동작합니다.",
      goal:
        "웹 UI와 게임 엔진이 함께 동작하는 기존 구조를 유지하면서 캐릭터 이동의 완성도, 주요 화면의 시각적 일관성, 엔딩 흐름과 정적 리소스 효율을 개선하는 데 집중했습니다.",
      roleSummary:
        "Frontend / Game UI 역할로 게임 화면과 UI를 개선하고, BaseCamp·Workshop의 플레이어 렌더링과 방향별 이동 애니메이션, 숲·무한의 탑 비주얼, 엔딩 시퀀스와 크레딧을 담당했습니다.",
      contributionNote:
        "전투·탐험·몬스터 관리·제작·저장 기능은 팀이 함께 만든 프로젝트 전체 범위입니다. 아래 담당 역할과 문제 해결 항목은 제가 직접 작업하거나 Git 기록과 코드로 확인한 범위만 정리했습니다.",
      architecture:
        "React가 라우팅, 메뉴와 정보 UI를 담당하고 Phaser가 캐릭터·Scene·상호작용을 렌더링합니다. 두 영역은 이벤트와 공유 상태를 통해 연결되며, Zustand가 플레이어 진행과 인벤토리 등 게임 상태를 관리합니다. Express·Prisma·SQLite 백엔드는 인증과 세이브 동기화를 담당하는 프로젝트 전체 구조입니다.",
      architectureLayers: [
        { name: "React", items: ["UI", "Routing", "Game Menu"] },
        { name: "Event / State", items: ["React ↔ Phaser", "Scene Events"] },
        { name: "Phaser", items: ["Character", "Scene", "Interaction"] },
        { name: "Zustand", items: ["Player Progress", "Inventory", "Game State"] },
        { name: "Backend", items: ["Express", "Prisma", "SQLite"] },
      ],
      features: [
        "Phaser 기반 베이스캠프 이동과 화면 전환",
        "층 기반 전투와 몬스터 성장",
        "숲 탐험과 몬스터 수집",
        "파티·보관함·도감 관리",
        "공방 제작과 미니게임",
        "계정 기반 세이브 동기화",
      ],
      responsibilities: [
        "BaseCamp와 Workshop의 캐릭터 렌더링 및 이동 표현 개선",
        "플레이어 스프라이트 시스템과 방향별 애니메이션 재구성",
        "숲과 무한의 탑 등 주요 화면 비주얼 개선",
        "5장의 이미지와 대사·크레딧을 연결한 엔딩 시퀀스 구성",
        "기존 React / Phaser 구조와 이동·충돌 로직을 유지하며 기능 개선",
        "실제 사용 문자를 기준으로 폰트 서브셋 빌드 과정 적용",
      ],
      collaboration: [
        "player-sprite, tower-background, ending-flow 등 기능 단위 브랜치에서 작업",
        "main 브랜치 변경사항을 작업 브랜치에 병합하고 merge conflict 해결",
        "원격 브랜치 push와 동기화, Git diff를 통한 변경 범위 검토",
      ],
      implementation: [
        "남·남동·동·북동·북 5개 방향 스프라이트와 좌우 반전을 조합해 8방향 표현 구성",
        "방향별 6프레임 시트에서 Idle과 Walking 상태를 분리해 이동 애니메이션 적용",
        "프레임 크기·발 위치·기준점을 측정하고 시각적 렌더링을 기존 이동·충돌 처리와 분리",
        "React UI와 Phaser Scene의 책임을 유지한 채 담당 화면의 렌더링 로직 개선",
        "빌드 시 소스에서 실제 사용 문자를 수집해 필요한 glyph만 포함하는 폰트 생성",
      ],
      troubleshooting: [
        {
          title: "프레임마다 흔들리던 캐릭터 이동 개선",
          problem:
            "Workshop에서 걷기 애니메이션을 재생할 때 프레임마다 발 위치와 이미지 크기가 달라 캐릭터가 위아래로 튀거나 공중에 떠 있는 것처럼 보였습니다.",
          solution:
            "애니메이션 속도만 조정하지 않고 방향별 시트의 프레임 크기, 발 위치와 렌더링 기준점을 확인했습니다. 출력 기준을 일정하게 유지하고 시각적 애니메이션을 이동·충돌 로직과 분리했습니다.",
          result:
            "기존 이동과 충돌 시스템을 바꾸지 않으면서 캐릭터가 동일한 지면을 기준으로 자연스럽게 걷도록 개선했습니다.",
        },
        {
          title: "1.2MB 폰트 리소스를 65KB로 최적화",
          problem:
            "한글 전체 glyph를 포함한 폰트 파일이 모든 화면의 초기 정적 리소스에 포함되고 있었습니다.",
          solution:
            "빌드 과정에서 프론트엔드와 서버 소스의 실제 사용 문자를 수집하고, 필요한 glyph만 포함한 WOFF2 서브셋 3종을 생성하도록 자동화했습니다.",
          result:
            "Git 성능 기록 기준 전체 폰트 리소스를 1,207KB에서 65KB로 줄여 약 95%의 용량을 절감했습니다.",
        },
      ],
      metrics: [
        {
          label: "Font resource",
          before: "1,207 KB",
          after: "65 KB",
          change: "95% ↓",
          evidence:
            "저장소의 scripts/subset-fonts.mjs와 design/PERF.md, perf 커밋의 측정 기록을 기준으로 했습니다.",
        },
      ],
      gallery: [
        {
          src: "/projects/voyager-atelier-basecamp.png",
          alt: "Voyager Atelier 베이스캠프에서 캐릭터와 NPC가 보이는 게임 화면",
          caption: "BaseCamp · Phaser 기반 캐릭터 이동과 상호작용",
        },
        {
          src: "/projects/voyager-atelier-workshop.png",
          alt: "Voyager Atelier 제작 공방 내부와 캐릭터가 보이는 게임 화면",
          caption: "Workshop · 캐릭터 렌더링과 제작 상호작용 UI",
        },
        {
          src: "/projects/voyager-atelier-forest.png",
          alt: "Voyager Atelier 숲 탐험 지역 선택 게임 화면",
          caption: "Forest · 탐험 지역과 진행 상태를 보여주는 React UI",
        },
      ],
      result:
        "방향별 캐릭터 표현과 주요 화면 비주얼, 엔딩 흐름을 프로젝트의 기존 구조 안에서 연결했습니다. 폰트 리소스는 측정 가능한 기준으로 줄이고, 작업 브랜치에서 main 변경사항을 병합하며 팀 개발 흐름을 경험했습니다.",
      retrospective:
        "게임 UI에서는 화면에 보이는 결과만이 아니라 스프라이트의 기준점, 물리 좌표, Scene 생명주기처럼 서로 연결된 원인을 함께 살펴야 한다는 점을 배웠습니다. 또한 팀 프로젝트에서는 내 작업 범위를 분리하고 기존 구조와 변경사항을 지속적으로 맞추는 과정이 중요했습니다.",
    },
  },
  {
    slug: "starlight-tarot",
    title: "별빛 타로",
    subtitle: "AI 기반 타로 리딩 웹 서비스",
    period: "2026.08 — 현재",
    kind: "Personal Project",
    tech: ["Next.js", "TypeScript", "React", "OpenAI API", "Zod", "Vercel"],
    cardTech: ["Next.js", "TypeScript", "OpenAI API"],
    featured: true,
    thumbnail: "/projects/starlight-tarot.webp",
    description:
      "78장 전체 카드 데이터와 구조화된 AI 응답을 연결해 분야별 리딩을 제공하는 웹 서비스",
    github: "https://github.com/peeta0126/tarot-card",
    demo: "https://tarot-card-swart.vercel.app/",
    detail: {
      overview:
        "별빛 타로는 Rider–Waite Tarot 78장 전체 데이터와 OpenAI Responses API를 연결한 AI 기반 타로 리딩 서비스입니다. 사용자가 연애·학업·금전·취업·종합 중 분야를 선택하고 카드를 직접 뽑은 뒤, 카드의 방향과 위치를 반영한 해석을 확인할 수 있습니다.",
      problem:
        "자유 형식 AI 응답은 화면에서 안정적으로 처리하기 어렵고, 사용자가 전달한 카드 정보나 서비스 목적과 무관한 질문을 그대로 신뢰하면 결과의 일관성을 유지하기 어렵습니다.",
      goal:
        "실제 타로 리딩에 가까운 선택 흐름을 제공하면서 AI 응답과 사용자 입력을 프론트엔드가 예측 가능한 구조로 다루는 것을 목표로 했습니다.",
      architecture:
        "Next.js App Router와 TypeScript를 기반으로 UI와 API 경계를 나눴습니다. 클라이언트는 카드 ID·방향·위치만 전달하고, 서버가 78장 원본 데이터를 다시 조회해 프롬프트를 구성합니다. AI 응답은 Zod Structured Outputs 스키마로 검증한 뒤 화면에 전달합니다.",
      api:
        "OpenAI Responses API를 사용하며 요청 전 사용자 질문을 서버에서 검증합니다. prompt_injection, category_mismatch, unsupported_request 등을 포함한 7개 결과 유형으로 분류해 AI에 전달되는 입력 범위를 통제합니다.",
      features: [
        "Rider–Waite Tarot 78장 전체 데이터",
        "연애·학업·금전·취업·종합 5개 리딩 분야",
        "정방향·역방향과 카드 위치를 반영한 해석",
        "카드 선택 → 뒤집기 → 키워드 → AI 해석 흐름",
        "서버 입력 검증과 7개 결과 유형 분류",
        "모바일과 데스크톱 반응형 UI",
      ],
      userFlow: [
        "리딩 분야와 질문을 입력합니다.",
        "셔플된 카드에서 중복 없이 세 장을 선택합니다.",
        "카드를 뒤집어 핵심 키워드와 방향을 확인합니다.",
        "서버 검증을 통과한 질문과 카드 정보로 AI 해석을 요청합니다.",
        "구조화된 카드별 해석과 종합 조언을 확인합니다.",
      ],
      implementation: [
        "78장 카드의 정방향·역방향 정보와 분야별 데이터를 별도 모듈로 관리",
        "OpenAI Responses API와 Zod Structured Outputs로 응답 형식을 고정",
        "질문을 7개 검증 유형으로 분류해 prompt injection과 범위 밖 요청을 차단",
        "클라이언트 입력을 신뢰하지 않고 서버에서 카드 원본 데이터를 재조회",
        "카드 선택, 뒤집기, 키워드 확인, AI 해석을 단계별 인터랙션으로 구성",
      ],
      troubleshooting: [
        {
          title: "AI 응답의 화면 처리 안정화",
          problem:
            "자유 형식 텍스트는 응답마다 구성이 달라 카드별 해석과 종합 조언을 일관된 UI에 배치하기 어려웠습니다.",
          solution:
            "Zod 스키마에 맞춘 Structured Outputs를 적용해 필요한 필드와 타입을 서버에서 검증했습니다.",
          result:
            "프론트엔드는 예외적인 문자열 파싱 없이 검증된 구조를 기준으로 결과 화면을 구성할 수 있게 됐습니다.",
        },
        {
          title: "클라이언트 카드 데이터 의존 제거",
          problem:
            "클라이언트가 카드 해석 원문까지 전달하면 변경되거나 조작된 값을 서버가 그대로 사용할 수 있었습니다.",
          solution:
            "클라이언트는 카드 ID·방향·위치만 보내고 서버가 ID를 기준으로 78장 원본 데이터를 다시 조회하도록 변경했습니다.",
          result:
            "AI 요청에 사용되는 카드 정보의 기준을 서버 데이터 한곳으로 통일했습니다.",
        },
      ],
      retrospective:
        "AI에 모든 결정을 맡기기보다 서비스 규칙과 원본 데이터는 서버에서 관리하고, 자연어 해석이 필요한 영역에만 AI를 적용하는 구조를 경험했습니다.",
    },
  },
  {
    slug: "crewspace",
    title: "CrewSpace",
    subtitle: "동아리 운영을 위한 통합 관리 웹 서비스",
    period: "2026.03 — 2026.06",
    kind: "Personal Project",
    tech: ["Next.js", "TypeScript", "React", "JavaScript", "HTML", "CSS", "Vercel"],
    cardTech: ["Next.js", "TypeScript", "React"],
    featured: true,
    description:
      "회원, 일정, 지원·신청, 관리자, 투표·회의 기능을 하나의 사용자 흐름으로 구성한 동아리 관리 서비스",
    github: "https://github.com/peeta0126/CrewSpace",
    demo: "https://crew-space-nine.vercel.app/",
    detail: {
      overview:
        "CrewSpace는 동아리 운영에 필요한 회원 관리, 일정, 지원·신청, 관리자, 투표·회의 기능을 하나의 웹 환경에서 사용할 수 있도록 기획하고 구현한 개인 프로젝트입니다.",
      problem:
        "동아리 정보가 메신저, 문서와 스프레드시트에 나뉘면 운영진과 회원이 필요한 정보를 찾고 같은 내용을 반복해서 정리해야 합니다.",
      goal:
        "관리자와 일반 사용자의 역할을 구분하고, 동아리 운영의 핵심 기능을 일관된 반응형 화면에서 사용할 수 있도록 만드는 것을 목표로 했습니다.",
      architecture:
        "Next.js App Router와 TypeScript를 기반으로 페이지와 기능을 구성하고, 반복되는 UI를 React 컴포넌트로 분리했습니다. 사용자 역할에 따라 화면과 기능의 표시 조건을 구분했습니다.",
      features: [
        "회원 정보 조회 및 관리",
        "가입 지원과 신청 처리",
        "일정 생성과 참석 여부 확인",
        "투표와 회의 기능",
        "일반 사용자와 관리자 화면 구분",
        "모바일·데스크톱 반응형 UI",
      ],
      process:
        "서비스 기획, 화면 설계, 프론트엔드 구현과 Vercel 배포를 단독으로 진행했습니다. 기능이 늘어나면서 반복 UI를 컴포넌트로 분리하고 역할별 화면 흐름을 정리했습니다. 인증은 기존 자체 로그인에서 OAuth 기반 방식으로 전환하는 방향으로 개선했습니다.",
      troubleshooting: [
        {
          title: "역할에 따른 화면과 기능 구분",
          problem:
            "회원 삭제와 가입 신청 처리 같은 관리자 기능이 일반 사용자 흐름과 같은 화면에 섞일 수 있었습니다.",
          solution:
            "사용자 역할을 기준으로 관리 기능의 표시와 실행 조건을 나누고, 각 역할의 주요 흐름을 별도로 정리했습니다.",
          result:
            "관리자와 일반 사용자가 접근하는 기능의 경계가 화면 구조에서도 드러나도록 개선했습니다.",
        },
        {
          title: "반복되는 화면 구조 분리",
          problem:
            "회원, 일정, 신청 화면에 유사한 카드와 목록 UI가 반복되면서 수정 지점이 늘어났습니다.",
          solution:
            "화면별 공통 요소를 React 컴포넌트로 분리하고 페이지는 데이터와 사용자 흐름 구성에 집중하도록 정리했습니다.",
          result:
            "반복되는 UI의 수정 범위를 공통 컴포넌트로 모을 수 있게 됐습니다.",
        },
      ],
      retrospective:
        "하나의 서비스에 여러 기능을 연결하면서 초기 화면 구조와 역할 구분의 중요성을 배웠습니다. 이후 프로젝트에서는 데이터와 UI, 서버 경계를 더 명확하게 나누는 방향으로 경험을 확장했습니다.",
    },
  },
];
