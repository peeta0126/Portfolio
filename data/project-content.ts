import type { Project } from "../types";

const gh = "https://github.com/peeta0126/";
const evidence = (label: string, url: string) => ({label, url});
const latency = {
  title: "AI 평균 응답시간 33.2% 단축",
  problem: "질문 검증과 타로 해석에 OpenAI를 각각 호출하고 DB 저장까지 기다려, 측정한 평균 전체 처리시간이 15.39초였습니다.",
  solution: "질문 검증과 해석을 단일 Structured Output 요청으로 합쳐 호출을 2회에서 1회로 줄였습니다. DB 저장은 Next.js after()로 응답 이후에 처리하고 전후 시간을 측정했습니다.",
  result: "전후 각각 6회 평균 15.39초 → 10.28초로 약 33.2% 단축했습니다. 기록된 조건의 결과이며 운영 전체 요청의 성능을 보장하는 수치는 아닙니다.",
  evidence: [evidence("최적화 커밋과 측정 기록", gh+"tarot-card/commit/fb55066"), evidence("성능 측정 문서", gh+"tarot-card/blob/main/docs/performance.md")],
};

// Local editorial proposals. Never merge these into the DB public snapshot at read time.
export function refreshProject(project: Project): Project {
  const repo = project.github?.toLowerCase().replace(/\/$/, "");
  const next = structuredClone(project);
  next.featured = false;
  next.detail ??= {};
  if (repo === (gh+"tarot-card").toLowerCase()) {
    next.featured = true;
    next.tech = ["Next.js", "React", "TypeScript", "OpenAI API", "Structured Outputs", "Prisma", "PostgreSQL", "Zod", "Vercel"];
    next.cardTech = ["Next.js", "TypeScript", "OpenAI API", "PostgreSQL"];
    next.description = "질문과 카드 방향을 반영하는 AI 타로 서비스. API 호출과 DB 저장 흐름을 개선해 평균 응답시간을 약 33.2% 줄였습니다.";
    next.thumbnail = "/projects/starlight-selection.png";
    Object.assign(next.detail, {
      overview: "78장 카드와 OpenAI API를 연결한 개인 타로 리딩 서비스입니다. 분야와 질문을 정하고 카드를 선택하면 방향과 위치를 반영한 해석을 확인할 수 있습니다.",
      problem: "카드 선택과 해석을 하나의 서비스에서 제공하면서, 긴 AI 대기시간과 자유 형식 응답을 개선하고 결과를 쉽게 저장·공유할 필요가 있었습니다.",
      roleSummary: "개인 프로젝트로 서비스 방향과 요구사항을 정리하고 AI 도구를 활용해 구현했습니다. 직접 화면과 API 흐름을 확인하며 입력 검증, 응답시간과 결과 저장 기능을 개선했습니다.",
      architecture: "Next.js UI → 서버 입력·카드 원본 검증 → OpenAI Structured Outputs → 응답 검증 → 결과 화면으로 이어집니다. 현재 로컬 소스는 질문이 있으면 분류 API를 먼저 호출하고, 빈 질문은 분류를 생략합니다. Prisma·PostgreSQL 저장은 after()로 응답 이후 처리합니다.",
      api: "성능 측정 커밋 fb55066에서는 질문 검증과 해석을 단일 요청으로 통합했습니다. 현재 로컬 HEAD는 질문 분류를 다시 분리한 구조이므로 33.2%는 해당 측정 시점의 성과입니다. 서버의 카드 ID·방향·위치 및 응답 검증과, 응답 이후 DB 저장 경로는 유지됩니다.",
      architectureLayers: [{name:"사용자 → Next.js API",items:["분야·질문·카드 입력", "서버 원본 카드 검증"]},{name:"OpenAI API → 검증",items:["질문 입력 시 별도 분류", "구조화된 해석·카드 일치 검사"]},{name:"결과 화면 → 저장",items:["검증된 필드 렌더링", "after(): Prisma·PostgreSQL"]}],
      features: ["타로 카드 78장", "카드 선택과 방향·위치 반영", "분야별 AI 해석", "서버 입력과 응답 검증", "해석 결과 이미지 저장", "A4 요약 리포트와 PDF 저장", "반응형 UI"],
      implementation: ["서버에서 카드 ID로 원본 데이터를 재조회", "질문 검증·해석을 단일 Structured Output 요청으로 통합", "Zod 스키마로 응답과 카드 일치 여부 검증", "after()로 DB 저장을 응답 경로에서 분리", "이미지·PDF 저장에 사용할 요약 리포트 구성"],
      process: "측정 당시 Before: 질문 분류 API → 해석 API → DB 저장 대기 → 응답\n측정 당시 After (fb55066): 통합 Structured Output 1회 → 응답 → after()에서 DB 저장\n현재 로컬 HEAD: 질문이 있으면 분류 API → 해석 API → 응답 → after()에서 DB 저장. 과거 측정값을 현재 버전의 재측정 결과로 해석하지 않습니다.",
      troubleshooting: [latency, ...(next.detail.troubleshooting ?? []).filter(t=>t.title!==latency.title)],
      metrics: [{label:"평균 응답시간",before:"15.39초",after:"10.28초",change:"33.2% ↓",evidence:"docs/performance.md · 전후 각각 6회 평균. DB 저장은 개선 후 사용자 응답시간에서 제외. 이번 개편에서 재측정한 결과는 아닙니다."}],
      gallery: [{src:"/projects/starlight-selection.png",alt:"별빛 타로의 실제 분야 선택과 리딩 시작 화면",caption:"실제 배포 서비스 · 리딩 시작 화면"},{src:"/projects/starlight-cards.png",alt:"별빛 타로의 실제 카드 선택 화면",caption:"실제 배포 서비스 · 연애운 카드 선택 화면, AI 호출 없이 캡처"}],
      userFlow: ["분야와 선택적 질문을 입력합니다.", "안내를 확인하고 스프레드에 맞는 수의 카드를 선택합니다.", "카드 방향·위치를 포함한 AI 해석을 요청합니다.", "결과를 확인하고 이미지·PDF로 저장합니다."],
      result: "78장 카드 선택과 분야별 AI 해석, 이미지·PDF 저장 흐름을 구현했습니다. 기존 측정 기록에서 평균 응답시간 단축을 확인했습니다.",
      limitations: ["측정 표본은 전후 각 6회입니다. 현재 로컬 HEAD는 질문 분류 경로가 달라, 최신 버전의 성능은 추가 계측이 필요합니다.", "AI 해석 결과 화면과 공유 이미지의 추가 화면 자료는 업로드 대기입니다."],
    });
  } else if (repo === (gh+"CrewSpace").toLowerCase()) {
    next.title = "CREW SPACE";
    next.tech = ["React", "TypeScript", "Vite", "Tailwind CSS"];
    next.cardTech = ["React", "TypeScript", "Vite"];
    next.description = "동아리 운영에서 경험한 공지·부원 관리의 불편함을 회원 신청·승인·일정·투표 화면으로 정리한 교과목 프로젝트입니다.";
    next.thumbnail = "/projects/crewspace-screen.png";
    Object.assign(next.detail, {
      overview: "동아리 운영 중 흩어진 공지사항과 부원 정보를 관리하는 불편함에서 시작한 서비스입니다. 크로스플랫폼 교과목 텀프로젝트로 제출했으며 실제 동아리 운영에는 도입하지 못했습니다.",
      architecture: "React·TypeScript·Vite 기반 SPA입니다. App과 기능별 훅·UI 컴포넌트를 나누고 회원·신청·일정·투표 및 관리자 화면의 상태와 표시 조건을 연결했습니다.",
      roleSummary: "서비스 기획과 요구사항 정리, AI 활용 화면 구현, 역할별 흐름 확인과 UI 개선을 진행했습니다.",
      process: "운영에서 겪은 문제를 기능 목록과 화면 흐름으로 정리하고 AI 도구를 활용해 구현했습니다. 회원과 관리자 관점에서 신청·승인·일정·투표 동작을 확인하며 수정했습니다.",
      result: "교과목 제출용 결과물을 제작했습니다. 실제 운영 도입이나 참여율 개선을 이 서비스의 성과로 주장하지 않습니다.",
      limitations: ["실제 동아리 운영 도입 및 다중 사용자 운영 검증은 완료하지 못했습니다."],
      gallery: [{src:"/projects/crewspace-screen.png",alt:"CrewSpace 실제 배포 서비스의 로그인 화면",caption:"실제 배포 서비스 · 로그인 시작 화면 (회원 데이터 접근 없이 캡처)"}],
    });
  } else if (repo === (gh+"monster-rpg").toLowerCase()) {
    next.detail.roleSummary = "팀 졸업작품에서 게임 아트, 캐릭터 스프라이트와 UI 리소스, 엔딩 관련 작업을 중심으로 참여했습니다. 기존 React·Phaser 구조를 이해하며 담당 화면을 개선했습니다.";
    const font = next.detail.troubleshooting?.find(t=>t.title.includes("폰트"));
    if (font) font.evidence = [evidence("폰트 최적화와 측정 커밋",gh+"monster-rpg/commit/9bd49eb8535b8513ea2fd7ed2b7a795f1410caf3")];
  } else if (repo === (gh+"Focus-Hub").toLowerCase()) {
    next.featured = true;
    next.period = "2026.10 — 현재";
    next.kind = "Personal Project";
    next.cardTech = ["Next.js", "TypeScript", "Supabase", "PostgreSQL"];
    next.thumbnail = "/projects/focus-dashboard.png";
    next.description = "일정·할 일·목표·습관·프로젝트를 한 작업 공간에서 관리하는 생산성 웹 앱입니다.";
    Object.assign(next.detail, {
      overview: "여러 서비스에 나뉜 일정·할 일·목표·습관과 프로젝트를 대시보드와 캘린더에서 함께 살펴보는 개인 작업 공간입니다.",
      problem: "일정과 할 일, 장기 목표를 각각 다른 서비스에서 관리하면 오늘 해야 할 일과 전체 진행 상황을 한 번에 확인하기 어려웠습니다.",
      goal: "분리된 기록을 한 작업 공간으로 연결하고 데스크톱과 모바일에서 핵심 기능에 빠르게 접근하도록 구성했습니다.",
      roleSummary: "개인 프로젝트로 기능 범위와 데이터 흐름을 정리하고 AI를 활용해 구현했습니다. 인증 경로, 데이터 연동과 대시보드 배치를 직접 사용하며 수정했습니다.",
      responsibilities: ["기능·UI 요구사항 기획", "인증·데이터 연동 및 반응형 UI 검증"],
      architecture: "Next.js 서버에서 인증과 초기 데이터를 조회하고 React 화면이 입력·목록·모달을 담당합니다. 서버·브라우저 Supabase 클라이언트를 구분하며 PostgreSQL 스키마에 사용자별 RLS 정책을 정의했습니다. 운영 정책 적용 여부는 별도 검증이 필요합니다.",
      architectureLayers: [{name:"React 화면",items:["대시보드·캘린더", "관리 화면"]},{name:"Next.js 인증",items:["SSR 세션", "보호 경로·이메일 확인"]},{name:"Supabase",items:["Auth", "PostgreSQL·RLS 정의"]}],
      features: ["일정·캘린더 관리", "할 일과 프로젝트 연결 및 진행률", "목표·습관 관리", "회원가입·로그인·이메일 인증·계정 복구", "Supabase 데이터 연동", "데스크톱·모바일 반응형 UI"],
      implementation: ["인증 화면과 작업 공간의 접근 조건 및 세션 경계 분리", "일정·할 일·목표·습관을 대시보드 조회와 연결", "카드 높이·간격과 모바일 탐색 레이아웃 개선", "로그아웃 시 전체 이동으로 이전 계정 화면 상태 초기화"],
      troubleshooting: [{title:"로그인 세션과 보호 경로 정리",problem:"세션 확인과 로그인 전후 이동이 어긋나면 보호된 화면이나 계정 복구 흐름을 올바르게 이용할 수 없습니다.",solution:"서버 세션 검사와 인증 확인 경로를 나누고 로그인·로그아웃 시 화면 상태를 초기화했습니다. 독립 Supabase fixture로 보호 경로와 계정 전환을 검사했습니다.",result:"저장소 검증 문서에 Chromium 데스크톱·모바일 총 6개 통과가 기록되어 있습니다. 실제 이메일 발송과 운영 RLS 검증은 포함하지 않습니다.",evidence:[evidence("인증 설정·검증 기록",gh+"Focus-Hub/blob/main/docs/auth-setup.md"),evidence("Playwright 사용자 흐름",gh+"Focus-Hub/blob/main/tests/auth.spec.ts")]}, {title:"분리된 데이터와 대시보드 배치 개선",problem:"일정·할 일·프로젝트가 각각 표시되면서 진행 상황을 함께 살펴보기 어렵고 모바일 카드 배치를 조정할 필요가 있었습니다.",solution:"대시보드 조회와 관리 화면을 연결하고 카드 높이와 간격, 모바일 탐색을 정리했습니다.",result:"오늘의 할 일·목표·습관·주간 일정과 프로젝트 진행 상황을 한 화면에서 확인하도록 구성했습니다.",evidence:[evidence("서버 대시보드",gh+"Focus-Hub/blob/main/src/app/page.tsx")]}],
      gallery: [{src:"/projects/focus-dashboard.png",alt:"Focus Hub 데스크톱 대시보드의 목표·습관·할 일과 주간 일정",caption:"기존 로컬 캡처 · 예시 데이터가 표시된 대시보드"},{src:"/projects/focus-mobile.png",alt:"Focus Hub의 모바일 대시보드",caption:"기존 로컬 캡처 · 모바일 화면"}],
      result: "일정과 개인 작업 관리 기능을 하나의 작업 공간으로 연결했습니다. 인증·계정 전환·노트 저장 등 로컬 fixture 검증 기록을 확인했습니다.",
      limitations: ["실제 SMTP 메일 발송·수신과 운영 DB 복수 계정 RLS 검증은 미완료입니다.", "테스트 fixture의 계정 격리를 실제 PostgreSQL RLS 검증으로 간주하지 않습니다."],
    });
  } else if (repo === (gh+"AugmentAlkkagi").toLowerCase()) {
    next.featured = true;
    next.period = "2026.10 — 2026.11";
    next.kind = "Team Project";
    next.cardTech = ["Godot", "GDScript", "GD-Sync"];
    next.description = "물리 기반 알까기에 라운드별 증강 선택과 온라인 대전을 결합한 팀 게임 프로젝트입니다.";
    next.thumbnail = "/projects/alkkagi-game.png";
    Object.assign(next.detail, {
      problem: "증강 윷놀이를 플레이하며 얻은 아이디어를 바탕으로, 알까기의 단순한 조작에 매 라운드 다른 전략을 더하는 게임을 기획했습니다.",
      roleSummary: "초기 게임 콘셉트, 증강 아이디어와 규칙·알 배치를 기획했습니다. AI 활용 프로토타입과 온라인 멀티플레이 구성에 참여하고 팀원과 UI·기능 개선, 반복 플레이와 시연을 진행했습니다.",
      contributionNote: "게임 전체 기능은 팀 결과물입니다. 개인 기여는 기획·프로토타입·멀티플레이 구성 참여와 UI 개선·검증 범위로 구분합니다. 아래 커밋은 기술적 변경의 근거이며 모든 코드를 독립적으로 작성했다는 의미가 아닙니다.",
      responsibilities: ["게임 콘셉트·증강·규칙·알 배치 기획", "AI를 활용한 프로토타입 제작", "온라인 멀티플레이 구성 참여", "팀원과 UI·기능 개선", "반복 플레이·오류 확인과 사용자 시연"],
      result: "교수님과 주변 사용자에게 실제 게임을 시연하고 긍정적인 반응을 확인했습니다. 별도 이용자 수나 만족도 수치는 측정하지 않았습니다.",
      gallery: [{src:"/projects/alkkagi-game.png",alt:"증강 알까기 실제 Godot 로컬 경기 화면의 바둑판·흑백 돌·발사력 HUD",caption:"로컬 소스 격리 복사본 · 실제 경기 렌더링 (초기 보드·HUD, 온라인 대전 캡처 아님)"}],
      architectureLayers: [{name:"참가자 입력 → 요청",items:["증강 대상·발사 입력", "GD-Sync 요청·sequence"]},{name:"호스트 검증 → 확정",items:["턴·요청 순서 검사", "경기 상태·물리 판정"]},{name:"스냅샷 → 참가자",items:["확정 상태 동기화", "로컬 대상 선택 상태 보존"]}],
      limitations: ["초기 경기 보드·HUD를 실제 렌더링했습니다. 증강 선택과 온라인 대전 화면은 추가 자료가 필요합니다.", "캡처 실행 중 GD-Sync 초기화 경고가 있어 온라인 연결 검증으로 간주하지 않습니다. 이번 개편에서 Godot 회귀 테스트를 실행하지 않았습니다."],
    });
    const refs = ["ed2086c42a8977a2fb554fe0c70168838dcb41a2", "989b60c08816f7dacaa370e9e651aa43bf6684d5", "0b2f7cba2c8b3d9ff1418e2f8325ffef2a09963f"];
    next.detail.troubleshooting?.forEach((t,i)=> {if(refs[i]) t.evidence=[evidence("변경 코드와 회귀 테스트",gh+"AugmentAlkkagi/commit/"+refs[i])];});
  } else if (repo === (gh+"Portfolio").toLowerCase()) {
    next.title = "Developer Portfolio";
    next.kind = "Personal Project";
    next.cardTech = ["Next.js", "TypeScript", "PostgreSQL", "OpenAI API"];
    next.tech = [...new Set([...next.tech,"PostgreSQL","OpenAI API","Playwright"])];
    next.description = "GitHub 저장소 발견·코드 분석·설명 초안을 관리자 검토와 공개 스냅샷으로 연결하는 포트폴리오입니다.";
    next.thumbnail = "/projects/portfolio-screen.png";
    Object.assign(next.detail, {
      overview: "공개 포트폴리오와 관리자 콘텐츠 작업 공간을 분리하고 GitHub 발견·AI 분석·검토·게시를 연결한 개인 웹 프로젝트입니다.",
      problem: "프로젝트가 늘어나도 설명을 최신 상태로 유지하면서, AI 제안이 직접 작성한 콘텐츠와 공개 여부를 임의로 바꾸지 않도록 관리할 필요가 있었습니다.",
      roleSummary: "기능 요구사항과 자동화 범위를 정리하고 AI를 활용해 구현했습니다. 관리자 검토·수동 보호·공개 경계를 확인하며 UI와 검증 흐름을 개선했습니다.",
      responsibilities: ["관리자 검토·보호 필드 흐름 설계", "격리 DB·브라우저 검증"],
      architecture: "Next.js 공개 화면은 PostgreSQL의 승인된 스냅샷을 조회합니다. GitHub 수집·분석은 별도 작업 큐에서 처리하고, AI 초안은 관리자 승인·편집 후 공개합니다. 수동 보호 필드와 프로젝트 공개 상태는 별도로 관리합니다.",
      features: ["GitHub 저장소 발견과 변경 감지", "코드 분석과 AI 설명 초안", "관리자 로그인·승인·거절·수동 편집", "보호 필드·정렬·공개 여부·이미지 업로드", "작업 큐·재시도·API 사용량 확인", "DB 공개 스냅샷 관리"],
      result: "공개 UI와 관리자 편집·검토, GitHub 분석 큐와 DB 게시 경로를 연결했습니다. 기존 문서에는 격리 DB·Mock·브라우저 검증과 운영 읽기 확인 기록이 있습니다.",
      limitations: ["Mock 검증은 실제 모델의 글쓰기 품질과 운영 동시성 검증을 대신하지 않습니다.", "이번 개편의 콘텐츠는 운영 관리자 검토 전이며 운영 DB를 변경하지 않았습니다."],
      gallery: [{src:"/projects/portfolio-screen.png",alt:"Developer Portfolio 실제 로컬 사이트의 첫 화면",caption:"기존 로컬 프리뷰 캡처 · 1차 개편의 실제 메인 화면"}],
    });
  }
  return next;
}

export const additionalProjects: Project[] = [
  {slug:"github-1407847850",title:"Focus Hub",subtitle:"일정과 목표를 연결하는 개인 작업 공간",period:"2026.10 — 현재",kind:"Personal Project",github:gh+"Focus-Hub",description:"",tech:["Next.js","React","TypeScript","Supabase","PostgreSQL","Tailwind CSS","Playwright"]},
  {slug:"github-1431052115",title:"증강 알까기",subtitle:"증강 선택과 온라인 대전을 결합한 물리 게임",period:"2026.10 — 2026.11",kind:"Team Project",github:gh+"AugmentAlkkagi",description:"",tech:["Godot","GDScript","GD-Sync"],detail:{overview:"Godot의 물리 기반 알까기에 다양한 증강 효과와 라운드별 선택, 턴 규칙 및 온라인 멀티플레이를 연결한 게임입니다.",architecture:"Godot·GDScript로 경기 상태와 물리 판정을 관리하고 GD-Sync로 호스트와 참가자 사이의 경기 상태와 입력을 동기화합니다.",features:["물리 기반 알까기", "다양한 증강 효과", "라운드별 증강 선택", "온라인 멀티플레이", "턴 기반 규칙"],troubleshooting:[{title:"참가자 대상 선택과 호스트 상태 동기화",problem:"참가자가 증강 대상을 고르는 중 호스트 스냅샷이 로컬 선택 단계를 덮을 수 있었습니다.",solution:"SKILL_TARGETING을 보존하는 분기와 요청·응답 순서 처리를 추가했습니다.",result:"수정 코드와 test_client_active_skill.gd 회귀 단언을 확인했습니다. 이번 작업에서 게임 테스트를 실행하지 않았습니다."},{title:"발사력 UI 초기화",problem:"초기 상태와 발사 취소·완료 이후에 이전 발사력 표시가 남는 경로가 있었습니다.",solution:"공통 초기화와 HUD 재생성 경로에서 게이지·텍스트·채움 패널을 함께 초기화했습니다.",result:"변경 diff와 test_shot_power_reset.gd의 검사 코드를 확인했습니다."},{title:"동결 상태에서 턴 진행",problem:"모든 돌이 동결된 차례의 넘기기 요청에서 중복·과거 요청을 구분할 필요가 있었습니다.",solution:"호스트 revision과 요청 순서를 확인하고 지연 스냅샷을 거부하도록 처리했습니다.",result:"변경 코드와 test_stasis_pass_turn.gd의 중복·과거 요청·타임아웃 검사를 확인했습니다."}]}},
  {slug:"github-1329454731",title:"Developer Portfolio",subtitle:"프로젝트 콘텐츠 관리와 자동화",period:"2026년",kind:"Personal Project",github:gh+"Portfolio",description:"",tech:["Next.js","React","TypeScript","Tailwind CSS"]},
  {slug:"tarot-shorts-automation",title:"유튜브 쇼츠 제작 자동화",subtitle:"타로 영상 생성부터 검수 후 선택적 업로드까지",period:"개발 기간 확인 중",kind:"Personal Project",tech:["Python","FFmpeg","YouTube Data API"],cardTech:["Python","FFmpeg"],description:"타로 주제와 카드 자료를 영상·BGM·메타데이터로 연결하고, 사람의 검수 이후 선택적으로 업로드하는 로컬 도구입니다.",detail:{overview:"Python 기반 타로 쇼츠 제작 도구입니다. 영상 생성과 검수, 선택적 YouTube 업로드를 연결하며 일부 댓글 해석·등록은 수동 작업으로 남겨 두었습니다.",problem:"반복되는 카드 영상 제작·오디오 합성과 업로드 준비 작업을 줄이면서 최종 내용과 공개 여부는 직접 검토하고자 했습니다.",roleSummary:"제작 흐름과 영상 규격을 정리하고 AI를 활용해 구현·수정했습니다. 생성된 영상은 직접 확인하고 업로드 여부를 결정했습니다.",features:["주제·카드 선택과 영상 생성", "FFmpeg BGM 합성", "영상 미리보기와 검수", "승인 후 선택적 업로드", "중복 업로드 검사"],architecture:"Python이 카드 자료와 영상 계획을 구성하고 렌더러·FFmpeg가 영상을 만듭니다. manifest와 검수 정보로 결과물을 확인한 뒤 YouTube API 업로드를 선택합니다.",implementation:["생성 결과별 manifest와 고유 폴더 관리", "검토한 파일·제목·공개 범위가 바뀌면 이전 승인 재사용 차단"],result:"로컬 코드와 README에서 생성·검수·선택적 업로드 흐름을 확인했습니다. 업로드 건수와 이용 통계는 검증되지 않아 기재하지 않습니다.",limitations:["공개 GitHub 저장소와 외부 데모 링크는 없습니다.","실제 업로드·렌더링 테스트는 이번 개편에서 실행하지 않았습니다."]}},
];

// The repository is private. This proposal is excluded from public static data.
export const privateProjectDraft: Project = {slug:"github-1446482634",title:"MAKEGROUND",subtitle:"창작물을 공유하고 피드백으로 개선하는 플랫폼",period:"개발 기간 확인 중",kind:"Project",github:gh+"makeground",tech:["React","TypeScript","Node.js","Express","MongoDB"],description:"게임·웹·앱·아이디어를 게시하고 댓글·피드백과 협업 신청으로 연결하는 창작자 커뮤니티입니다.",detail:{features:["작품 게시·수정·삭제", "탐색 필터", "댓글·피드백", "저장·협업 신청"],architecture:"React·Vite 클라이언트와 Node.js·Express API, MongoDB·Mongoose를 npm workspace로 구성합니다.",limitations:["README 기준 DB 통합 검증은 미완료입니다. UI fixture 결과를 DB 검증으로 간주하지 않습니다.","비공개 저장소이므로 공개 범위와 개인 역할 확인 후 별도 승인해야 합니다."]}};
