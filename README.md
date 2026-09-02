# Developer Portfolio

Next.js App Router 기반의 데이터 중심 개발자 포트폴리오입니다.

- 포트폴리오 소유자: 이민석
- 주요 프로젝트: CrewSpace

## 시작하기

```bash
npm install
npm run dev
```

## 내용 수정

- `data/profile.ts`: 이름, 역할, 소개, GitHub, 이력서 경로
- `data/skills.ts`: 기술 스택
- `data/projects.ts`: 프로젝트 목록과 상세 내용
- `data/problem-solving.ts`: 문제 해결 사례
- `data/contact.ts`: 연락처와 블로그 링크

실제 이메일을 공개하려면 `data/contact.ts`의 `email` 값에 입력하세요. 빈 문자열로
두면 이메일 버튼이 표시되지 않습니다.

## 프로젝트 추가

`data/projects.ts`의 `projects` 배열에 `Project` 타입을 따르는 객체를 추가합니다.
URL에 사용할 `slug`는 영문 소문자와 하이픈으로 작성하고, 메인 화면에 표시하려면
`featured: true`를 지정하세요. 프로젝트 객체를 추가하면 메인 목록과
`/projects/[slug]` 상세 페이지에 반영됩니다.

프로젝트 이미지를 사용할 경우 파일을 `public/`에 두고 `thumbnail` 필드에 경로를
지정할 수 있습니다.

