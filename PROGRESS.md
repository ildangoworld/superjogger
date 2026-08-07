# SuperJogger 진행상황

> 구현 현황의 단일 요약 문서다. 기능을 완료·변경하면 이 파일을 함께 갱신한다.  
> 제품 요구사항의 기준은 `README.md`다. 이 문서는 진행 상태만 기록한다.

최종 갱신: 2026-08-07

## 요약

| Phase | 이름 | 상태 |
|------:|------|------|
| 0 | 프로젝트 기반 | 완료 |
| 1 | 인증과 프로필 | 완료 |
| 2 | 운동 기록 핵심 | 완료 |
| 3 | 주간 목표와 홈 | 완료 |
| 4 | AI 분석 | 미착수 |
| 5 | 크루 | 미착수 |
| 6 | 품질 점검과 배포 | 미착수 |

## Phase 0 — 프로젝트 기반

- Next.js 16 + TypeScript + Tailwind CSS v4
- ESLint, Prettier, `.env.example`
- 디자인 토큰: fog / pine / dawn, 모바일 `max-w-md` 셸
- 라우트: `/` 홈, `/welcome` 소개, 하단 네비(홈·기록·기록하기·크루·프로필)

## Phase 1 — 인증과 프로필

- Supabase Auth: 이메일 가입/로그인, Google OAuth, 비밀번호 재설정
- `src/proxy.ts` 세션 갱신 및 보호 라우트
- 온보딩 4단계 + 주간 목표 최초 확정
- 프로필: 닉네임, AI 추천 상세도, 로그아웃, 회원 탈퇴
- 마이그레이션: `supabase/migrations/20260807000000_phase1_auth_profile.sql`
  - `profiles`, `user_preferences`, `weekly_goals` + RLS

## Phase 2 — 운동 기록 핵심

- 기록 생성/목록/상세/수정/삭제
- 카테고리: `RUNNING` / `WALKING` / `MIXED`
- 인정 규칙: 10분 이상 또는 1km 이상, 하루 최대 1회(최초 저장분 대표)
- 미래 날짜·시각 차단, 유사 기록 경고
- 주간 요약(`weekly_summaries`) 갱신
- 단위 테스트: `src/features/workouts/qualification.test.ts`
- 마이그레이션: `supabase/migrations/20260807010000_phase2_workouts.sql`
  - `workouts`, `weekly_summaries` + RLS
- AI 분석은 미연결(상세에 “분석 전” 안내)

## Phase 3 — 주간 목표와 홈

- 홈: 이번 주 진행도, 다음 운동 방향(규칙 기반), 기록 CTA, 최근 운동, 조거 등급
- 조거 등급: 진행 중 주 제외, 첫 2주 산정 중, 이후 임시→8주 정식
- 프로필: 이번 주 목표 확인, 다음 주 목표 추천·확정(주중 하향 변경 없음)
- 단위 테스트: `src/features/goals/grade.test.ts`
- 추가 마이그레이션 없음(기존 테이블 활용)

## 다음에 할 일 (Phase 4)

- 서버 전용 AI 호출 + 구조화 JSON 검증
- 하루 총 3회 원자적 분석 한도
- 저장 직후 자동 분석 / `다시 분석하기`
- 분석 컨텍스트(최근 5개, 4주 요약, 추세)
- 안전 안내·실패 처리, `STALE` 상태

## 로컬 확인

```bash
npm run dev
npm test
npm run lint
```

Supabase SQL Editor에서 Phase 1·2 마이그레이션을 순서대로 적용한다.  
환경변수는 `.env.example`을 참고해 `.env.local`에 설정한다.

## 문서 갱신 규칙

1. Phase 또는 의미 있는 기능을 끝낼 때마다 이 파일의 표·해당 절·최종 갱신일을 수정한다.
2. README 범위 밖 기능을 임의로 완료 처리하지 않는다.
3. 커밋에 코드 변경과 함께 이 문서 갱신을 포함한다.
