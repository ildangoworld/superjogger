-- Phase A3: legal documents and user consents

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('TERMS', 'PRIVACY')),
  version integer not null check (version >= 1),
  content text not null,
  status text not null check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  effective_date date,
  change_summary text,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_documents_doc_type_version_unique unique (doc_type, version),
  constraint legal_documents_published_requires_effective_date check (
    status = 'DRAFT'
    or (effective_date is not null and published_at is not null)
  )
);

create index legal_documents_doc_type_status_idx
  on public.legal_documents (doc_type, status);

create index legal_documents_doc_type_effective_date_idx
  on public.legal_documents (doc_type, effective_date desc);

create trigger legal_documents_set_updated_at
before update on public.legal_documents
for each row execute function public.set_updated_at();

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_type text not null check (doc_type in ('TERMS', 'PRIVACY')),
  version integer not null check (version >= 1),
  consented_at timestamptz not null default now(),
  constraint user_consents_user_doc_version_unique unique (user_id, doc_type, version)
);

create index user_consents_user_id_idx
  on public.user_consents (user_id);

alter table public.legal_documents enable row level security;
alter table public.user_consents enable row level security;

-- Anyone (including anon) may read published/archived documents for public pages.
create policy "legal_documents_select_public"
on public.legal_documents for select
to anon, authenticated
using (status in ('PUBLISHED', 'ARCHIVED'));

-- Users may read and insert their own consent rows.
create policy "user_consents_select_own"
on public.user_consents for select
to authenticated
using (auth.uid() = user_id);

create policy "user_consents_insert_own"
on public.user_consents for insert
to authenticated
with check (auth.uid() = user_id);

grant select on table public.legal_documents to anon, authenticated;
grant all on table public.legal_documents to service_role;

grant select, insert on table public.user_consents to authenticated;
grant all on table public.user_consents to service_role;

-- Seed version 1 as PUBLISHED from docs/legal drafts.
-- Replace [운영자 입력 필요] placeholders before production go-live.
insert into public.legal_documents (
  doc_type,
  version,
  content,
  status,
  effective_date,
  change_summary,
  published_at
) values
(
  'TERMS',
  1,
  $terms_v1$
# SuperJogger 서비스 이용약관

버전 1 · 시행일: [운영자 입력 필요]

## 제1조 (목적)

이 약관은 [운영자 입력 필요: 사업자명](이하 "회사")가 제공하는 SuperJogger 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제2조 (정의)

1. "서비스"란 회원이 달리기·걷기 등 운동 기록을 저장하고, 주간 목표 진행 확인, AI 기반 운동 분석, 크루 기능 등을 이용할 수 있도록 회사가 제공하는 웹 서비스를 말합니다.
2. "회원"이란 이 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.
3. "크루"란 회원들이 초대 코드를 통해 모여 주간 목표 진행 상황을 함께 확인하는 모임 기능을 말합니다.
4. "AI 분석"이란 회원의 운동 기록을 바탕으로 인공지능이 운동 강도 해석과 다음 운동 방향을 참고 정보로 제공하는 기능을 말합니다.

## 제3조 (약관의 게시와 개정)

1. 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 내에 게시합니다.
2. 회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
3. 회사가 약관을 개정할 경우에는 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 그 적용일자 7일 전부터 서비스 내에 공지합니다. 다만 회원에게 불리한 내용으로 변경하는 경우에는 최소 30일 전부터 공지합니다.
4. 회원이 개정약관의 적용일까지 거부 의사를 표시하지 않고 서비스를 계속 이용하는 경우 개정약관에 동의한 것으로 봅니다. 회원은 개정약관에 동의하지 않는 경우 이용계약을 해지(회원 탈퇴)할 수 있습니다.
5. 개정된 약관의 이전 버전은 서비스 내에서 계속 열람할 수 있습니다.

## 제4조 (이용계약의 체결)

1. 이용계약은 가입 신청자가 이 약관과 개인정보처리방침에 동의하고 회사가 정한 절차에 따라 가입을 신청하며, 회사가 이를 승낙함으로써 체결됩니다.
2. 회사는 다음 각 호에 해당하는 신청에 대하여 승낙을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
   - 타인의 명의 또는 정보를 도용한 경우
   - 허위 정보를 기재한 경우
   - 기타 관련 법령 또는 이 약관을 위반한 경우

## 제5조 (계정 관리)

1. 회원은 자신의 계정 정보(이메일, 비밀번호)를 스스로 관리할 책임이 있으며, 이를 제3자가 이용하도록 하여서는 안 됩니다.
2. 회원은 계정 정보가 도용되거나 제3자가 사용하고 있음을 인지한 경우 즉시 회사에 알려야 합니다.

## 제6조 (서비스의 내용)

1. 회사가 제공하는 서비스는 다음과 같습니다.
   - 운동(달리기·걷기·혼합) 기록의 저장 및 관리
   - 주간 목표 설정과 진행 상황 확인
   - AI 기반 운동 분석 및 다음 운동 방향 제안(일일 제공 횟수 제한이 있을 수 있음)
   - 크루 생성·가입과 크루원 주간 진행 현황 확인
2. 회사는 서비스의 품질 향상을 위해 서비스의 전부 또는 일부를 변경할 수 있으며, 중요한 변경은 사전에 공지합니다.

## 제7조 (AI 분석에 관한 특칙)

1. AI 분석 결과는 회원의 운동 기록에 근거한 참고 정보이며, 의학적 진단·처방·치료가 아닙니다.
2. 회사는 AI 분석 결과의 의학적 정확성을 보증하지 않습니다. 통증이 지속되거나 건강 이상이 의심되는 경우 회원은 의료 전문가와 상담해야 합니다.
3. AI 분석의 실패 또는 제공 횟수 제한은 운동 기록의 저장에 영향을 주지 않습니다.

## 제8조 (회원의 의무)

1. 회원은 다음 행위를 하여서는 안 됩니다.
   - 타인의 정보 도용 또는 허위 정보 등록
   - 크루 이름·소개 등에 욕설, 차별·혐오 표현, 음란물, 광고성 정보를 게재하는 행위
   - 서비스의 정상적인 운영을 방해하는 행위(비정상적 자동화 접근 포함)
   - 관련 법령, 이 약관, 회사의 공지사항을 위반하는 행위
2. 회사는 회원이 전항을 위반한 경우 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.

## 제9조 (서비스의 중단)

1. 회사는 시스템 점검, 장애, 천재지변 등 부득이한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있으며, 가능한 경우 사전에 공지합니다.
2. 회사는 무료로 제공되는 서비스의 일시 중단으로 발생한 손해에 대하여 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.

## 제10조 (계약 해지 및 회원 탈퇴)

1. 회원은 언제든지 서비스 내 회원 탈퇴 기능을 통해 이용계약을 해지할 수 있습니다.
2. 탈퇴 시 회원의 프로필, 운동 기록, AI 분석 등 개인 데이터는 개인정보처리방침에 따라 지체 없이 파기됩니다. 다만 관련 법령에 따라 보존 의무가 있는 정보는 해당 기간 동안 보존됩니다.

## 제11조 (손해배상 및 면책)

1. 회사와 회원은 상대방의 귀책사유로 손해가 발생한 경우 관련 법령에 따라 배상을 청구할 수 있습니다.
2. 회사는 회원이 서비스에 기록한 정보의 정확성에 대해 책임을 지지 않으며, 회원 간 크루 활동에서 발생한 분쟁에 개입할 의무를 지지 않습니다. 다만 신고가 접수된 경우 운영 기준에 따라 조치할 수 있습니다.

## 제12조 (준거법 및 재판관할)

1. 이 약관과 서비스 이용에 관하여는 대한민국 법령을 적용합니다.
2. 서비스 이용과 관련하여 회사와 회원 간에 분쟁이 발생한 경우 「민사소송법」에 따른 관할법원에 소를 제기할 수 있습니다.

## 부칙

이 약관은 [운영자 입력 필요: 시행일]부터 시행합니다.
$terms_v1$,
  'PUBLISHED',
  current_date,
  '초기 게시',
  now()
),
(
  'PRIVACY',
  1,
  $privacy_v1$
# SuperJogger 개인정보처리방침

버전 1 · 시행일: [운영자 입력 필요]

[운영자 입력 필요: 사업자명](이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.

## 1. 개인정보의 처리 목적

회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음 목적 이외의 용도로 이용되지 않으며, 목적이 변경되는 경우 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.

1. 회원 가입 및 관리: 회원제 서비스 제공, 본인 식별, 부정 이용 방지
2. 서비스 제공: 운동 기록 저장·관리, 주간 목표 진행 계산, AI 기반 운동 분석과 다음 운동 방향 제안, 크루 기능 제공
3. 고충 처리: 문의 접수·처리 결과 통보

## 2. 처리하는 개인정보의 항목 및 수집 방법

1. 회원 가입 시 (필수)
   - 이메일 주소, 비밀번호(암호화 저장), 닉네임
   - Google 계정으로 가입하는 경우: Google 계정 이메일, 프로필 정보(이름·프로필 이미지)
2. 온보딩 및 서비스 이용 과정에서 회원이 직접 입력 (해당 시)
   - 운동 경험 수준, 운동 목표, 운동 가능 요일, 시간대(타임존)
   - 운동 기록: 운동 종류, 일시, 시간, 거리, 체감 강도, 컨디션, 통증 여부·부위·내용, 평균 심박수, 케이던스, 걸음 수, 메모
   - 문의하기 이용 시: 문의 제목·내용
3. 자동으로 수집되는 항목
   - 서비스 이용 기록, 접속 로그, 쿠키(로그인 세션 유지 목적)

※ 운동 기록 중 통증·컨디션·심박수 등은 건강과 관련될 수 있는 정보입니다. 회사는 해당 정보를 서비스 제공 목적으로만 처리하고, 크루원 등 다른 회원에게 노출하지 않습니다.

## 3. 개인정보의 처리 및 보유 기간

1. 회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 동의받은 기간 내에서 개인정보를 처리·보유합니다.
2. 회원 정보와 운동 기록: 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.
3. 다만 다음의 경우에는 해당 기간 동안 보존합니다.
   - 관련 법령(통신비밀보호법 등)에 따라 보존이 필요한 접속 기록: 3개월
   - 분쟁 대응을 위해 보존이 필요한 경우: 해당 분쟁 해결 시까지

## 4. 개인정보의 제3자 제공

회사는 정보주체의 개인정보를 제1항의 처리 목적 범위에서만 처리하며, 정보주체의 동의 또는 법률의 특별한 규정 등 「개인정보 보호법」 제17조에 해당하는 경우를 제외하고는 제3자에게 제공하지 않습니다. 현재 회사는 개인정보를 제3자에게 제공하고 있지 않습니다.

## 5. 개인정보 처리의 위탁 및 국외 이전

회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있으며, 수탁자의 서버 소재지에 따라 개인정보가 국외에서 처리될 수 있습니다.

| 수탁자 | 위탁 업무 | 서버 소재지 |
|--------|-----------|------------|
| Supabase Inc. | 데이터베이스 및 인증 인프라 운영 | [운영자 입력 필요: 선택 리전] |
| Vercel Inc. | 웹 서비스 호스팅 | 미국 등 글로벌 리전 |
| [운영자 입력 필요: AI 제공자(예: OpenAI)] | 운동 기록 기반 AI 분석 처리 | 미국 등 |

AI 분석 시에는 분석에 필요한 운동 기록 요약 정보만 전송하며, 이메일 등 계정 식별 정보는 전송하지 않습니다. 회사는 위탁계약 시 개인정보 보호 관련 법령 준수, 재위탁 제한 등을 명확히 규정하고 수탁자를 감독합니다.

## 6. 개인정보의 파기 절차 및 방법

1. 회사는 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
2. 전자적 파일 형태의 정보는 복구할 수 없는 기술적 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다.

## 7. 정보주체와 법정대리인의 권리·의무 및 행사 방법

1. 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.
2. 회원은 서비스 내 프로필 화면에서 닉네임 등 정보를 직접 수정하거나 회원 탈퇴를 통해 개인정보를 삭제할 수 있으며, 문의하기 또는 아래 개인정보 보호책임자에게 서면·전자우편으로 권리 행사를 요청할 수 있습니다.
3. 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자를 통하여도 할 수 있습니다.

## 8. 개인정보의 안전성 확보 조치

회사는 「개인정보 보호법」 제29조에 따라 다음의 조치를 취하고 있습니다.

1. 관리적 조치: 개인정보 취급자 최소화, 내부 관리계획 수립
2. 기술적 조치: 비밀번호 일방향 암호화, 데이터베이스 행 수준 접근 통제(RLS), 전송 구간 암호화(HTTPS), 접근 권한 관리
3. 물리적 조치: 클라우드 인프라 제공자의 물리적 보안 체계 활용

## 9. 쿠키 등 자동 수집 장치의 설치·운영 및 거부

1. 회사는 로그인 세션 유지를 위해 필수 쿠키를 사용합니다. 광고·행태 분석 목적의 쿠키는 사용하지 않습니다.
2. 회원은 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.

## 10. 개인정보 보호책임자

| 구분 | 내용 |
|------|------|
| 개인정보 보호책임자 | [운영자 입력 필요: 성명/직책] |
| 연락처 | [운영자 입력 필요: 이메일] |

정보주체는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등을 개인정보 보호책임자에게 문의할 수 있습니다.

## 11. 권익침해 구제 방법

정보주체는 개인정보 침해로 인한 구제를 받기 위하여 다음 기관에 분쟁 해결이나 상담 등을 신청할 수 있습니다.

- 개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr
- 개인정보 분쟁조정위원회: 1833-6972 / kopico.go.kr
- 대검찰청 사이버수사과: (국번없이) 1301 / spo.go.kr
- 경찰청 사이버수사국: (국번없이) 182 / ecrm.police.go.kr

## 12. 개인정보처리방침의 변경

1. 이 개인정보처리방침은 시행일로부터 적용됩니다.
2. 내용의 추가·삭제·수정이 있는 경우 변경 사항의 시행 전에 서비스 내 공지사항을 통해 고지하며, 이전 버전은 서비스 내에서 계속 열람할 수 있습니다.

이 방침은 [운영자 입력 필요: 시행일]부터 시행합니다.
$privacy_v1$,
  'PUBLISHED',
  current_date,
  '초기 게시',
  now()
);
