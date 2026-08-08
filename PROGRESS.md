# SuperJogger 진행상황

> 구현 현황의 단일 요약 문서다. 기능을 완료·변경하면 이 파일을 함께 갱신한다.  
> 제품 요구사항의 기준은 `README.md`다. 이 문서는 진행 상태만 기록한다.

최종 갱신: 2026-08-08

## 요약

| Phase | 이름 | 상태 |
|------:|------|------|
| 0 | 프로젝트 기반 | 완료 |
| 1 | 인증과 프로필 | 완료 |
| 2 | 운동 기록 핵심 | 완료 |
| 3 | 주간 목표와 홈 | 완료 |
| 4 | AI 분석 | 완료 |
| 5 | 크루 | 완료 |
| 6 | 품질 점검과 배포 | 완료 |

### 관리자 사이트 (기준 문서: `ADMIN.md`)

| Phase | 이름 | 상태 |
|------:|------|------|
| A1 | 관리자 기반 (계정·권한·접이식 셸·비밀번호 변경) | 완료 |
| A2 | 대시보드·회원 관리·크루 관리 | 완료 |
| A3 | 약관·개인정보처리방침 (버전 관리, 사용자 공개 페이지, 가입 동의) | 완료 |
| A4 | 문의하기 (사용자 작성, 관리자 답변) | 완료 |
| A5 | 설정 (AI 설정 DB화, 관리자 계정 관리)·품질 | 완료 |

## 알려진 이슈 / 수정

- **Google 로그인 세션 유실 (2026-08-07 수정)**: 서버 액션 OAuth로 PKCE 쿠키가 브라우저에 남지 않던 문제를, 브라우저 클라이언트 OAuth + 콜백에서 리다이렉트 응답에 세션 쿠키를 명시적으로 설정하는 방식으로 수정.
- **온보딩 profiles permission denied (2026-08-07 수정)**: `authenticated` 역할에 테이블 GRANT가 없어 발생. `20260807020000_fix_table_grants.sql`로 권한·insert 정책을 보강하고, 프로필 행이 없을 때 upsert하도록 온보딩을 수정.
- **한글 폰트 깨짐 (2026-08-07 수정)**: 라틴 전용 Bricolage를 한글 UI에 쓰던 문제와 `--font-display` 순환 참조를 수정. UI는 Noto Sans KR, 영문 워드마크만 Outfit.

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

## Phase 3 — 주간 목표와 홈

- 홈: 이번 주 진행도, 다음 운동 방향(규칙 기반), 기록 CTA, 최근 운동, 조거 등급
- 조거 등급: 진행 중 주 제외, 첫 2주 산정 중, 이후 임시→8주 정식
- 프로필: 이번 주 목표 확인, 다음 주 목표 추천·확정(주중 하향 변경 없음)
- 단위 테스트: `src/features/goals/grade.test.ts`
- 추가 마이그레이션 없음(기존 테이블 활용)

## Phase 4 — AI 분석

- 서버 전용 OpenAI 호환 Chat Completions + Zod 구조화 JSON 검증
- 하루 총 3회 원자적 슬롯(`reserve_ai_analysis_slot` RPC)
- 저장 직후 `after()` 자동 분석 / `다시 분석하기`
- 컨텍스트: 최근 5개, 최근 4주 요약, 통증·목표·직전 추세
- 핵심 필드 수정 시 `STALE`, 실패 시 기존 활성 분석 유지
- 단위 테스트: `src/features/analysis/schema.test.ts`
- 마이그레이션: `supabase/migrations/20260807030000_phase4_ai_analysis.sql`
  - `workout_analyses`, `ai_analysis_usage`, `user_trend_state` + RLS/RPC

## Phase 5 — 크루

- 크루 생성·초대 코드 가입·나가기·소유자 내보내기
- 다대다 멤버십, 복수 크루 전환
- `get_crew_board` 보안 함수로 주간 집계만 공개(운동 상세·통증·AI 비공개)
- 현황 정렬: 목표 달성 → 진행 중 → 시작 전, 동일 상태 닉네임 오름차순
- 단위 테스트: `src/features/crews/board.test.ts`
- 마이그레이션: `supabase/migrations/20260807040000_phase5_crews.sql`
  - `crews`, `crew_members` + RLS/RPC

## Phase 6 — 품질 점검과 배포

- `npm run build` 통과, 모바일 viewport·themeColor
- 접근성: 본문 건너뛰기, 하단 내비 `aria-label`, 오류 `role="alert"`
- 분석 한도 동시성·4회차 자동분석 스킵 단위 테스트
- 크루 공개 필드 화이트리스트 테스트
- `.env.example`에 Vercel/Supabase OAuth 운영 체크리스트 반영
- 실제 Vercel 프로덕션 배포는 계정 연결 후 `vercel`/`git push`로 진행

## Phase A1 — 관리자 기반

- `admin_users` (SUPER/STAFF, 메뉴 권한 배열) + RLS(본인 select만)
- `/admin` 보호: 미로그인 → `/admin/login`, 비관리자 → `/admin/forbidden`
- 접이식 사이드바(데스크톱 접기, 모바일 오버레이) + 권한 기반 메뉴
- 내 계정 비밀번호 변경(현재 비밀번호 재확인 후 `updateUser`)
- 단위 테스트: `src/features/admin/permissions.test.ts`
- 마이그레이션: `supabase/migrations/20260807050000_phase_a1_admin_users.sql`
  - 첫 SUPER 관리자는 `ADMIN_ID` / `ADMIN_PASSWORD`로 `/admin/login` 부트스트랩

## Phase A2 — 대시보드·회원·크루

- 대시보드: 회원·운동·AI 사용 지표, 최근 가입 회원, 최근 문의
- 회원 목록/상세/닉네임 확인 후 탈퇴 처리 (`auth.admin.deleteUser`)
- 크루 목록/상세/초대 코드 재발급/이름 확인 후 삭제
- 파괴적 조치는 `admin_audit_logs`에 처리자·시각 기록
- 통증·메모·AI 분석 본문은 관리자 화면에 노출하지 않음
- 마이그레이션: `supabase/migrations/20260807060000_phase_a2_admin_ops.sql`

## Phase A3 — 약관·개인정보처리방침

- `legal_documents` (초안·게시·이력, 시행일 예약) + `user_consents`
- 공개 페이지 `/terms`, `/privacy` (현재 적용 버전·이전/예정 버전 목록)
- 회원가입 필수 동의 체크 + 동의 버전 기록 (이메일·Google)
- 관리자 콘텐츠 관리: 초안 작성·수정·시행일 지정 게시, 게시 후 수정 불가
- 회원 상세에서 동의 버전 확인, welcome/인증 화면 약관 링크
- 단위 테스트: `src/features/legal/publish.test.ts`
- 마이그레이션: `supabase/migrations/20260807070000_phase_a3_legal.sql`
  - `docs/legal/` 초안을 버전 1로 시드(`[운영자 입력 필요]`는 운영 전 확정)

## Phase A4 — 문의하기

- `inquiries` (OPEN/ANSWERED/CLOSED) + RLS(본인 조회·작성만, 답변은 service role)
- 프로필 문의 작성·내 문의 목록, `/profile/inquiries/[id]` 상세·답변 확인
- 관리자 문의 목록(상태 필터)·상세·답변 작성/수정(상태 ANSWERED 자동 전환)
- 대시보드 최근 문의 5건 바로가기
- 단위 테스트: `src/features/inquiries/status.test.ts`
- 마이그레이션: `supabase/migrations/20260807080000_phase_a4_inquiries.sql`

## Phase A5 — 설정·품질

- `app_settings` (`ai_model`, `ai_daily_limit`, `ai_base_url`) + RLS(인증 사용자 조회, 쓰기는 service role)
- AI 설정 화면: env보다 DB 값 우선, API 키는 env 전용
- `reserve_ai_analysis_slot`이 `ai_daily_limit`을 읽어 한도 검증
- SUPER 전용 관리자 계정 관리(추가·역할·권한·해제), 마지막 SUPER 보호
- 단위 테스트: `src/features/settings/resolve.test.ts`
- 마이그레이션: `supabase/migrations/20260807090000_phase_a5_settings.sql`

## 다음에 할 일

- `app_settings` / A3·A4 마이그레이션 적용 및 약관 플레이스홀더 확정
- `admin_users` / `admin_audit_logs` 마이그레이션 적용 후 `.env.local`에 `ADMIN_ID` / `ADMIN_PASSWORD` 설정하고 `/admin/login`으로 SUPER 부트스트랩
- Vercel 프로젝트 연결 및 운영 환경변수 등록
- Supabase Site URL / Redirect URLs를 프로덕션 도메인으로 설정
- Phase 4·5·A1–A5 마이그레이션이 원격 DB에 적용됐는지 확인

## 로컬 확인

```bash
npm run dev
npm test
npm run lint
npm run build
```

Supabase SQL Editor에서 Phase 1·2·4·5·A1·A2·A3·A4·A5 마이그레이션을 순서대로 적용한다.  
환경변수는 `.env.example`을 참고해 `.env.local`(및 Vercel)에 설정한다.

## 문서 갱신 규칙

1. Phase 또는 의미 있는 기능을 끝낼 때마다 이 파일의 표·해당 절·최종 갱신일을 수정한다.
2. README 범위 밖 기능을 임의로 완료 처리하지 않는다.
3. 커밋에 코드 변경과 함께 이 문서 갱신을 포함한다.
