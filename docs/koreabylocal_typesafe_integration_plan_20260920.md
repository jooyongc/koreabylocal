# Korea by Local — TypeSafe(Jev) 판정 API 적용 계획서

- 작성일: 2026-09-20
- 기준 코드: 이 저장소 `main` @ `01ca4f1` (2026-09-14). 작업 전 `git pull` 로 최신화할 것
- 티켓 접두어: `KT-`
- 상태: 계획만. 코드 변경 없음

## 0. 이 문서를 쓰는 법

이 저장소에서 Claude Code 를 열고 아래처럼 지시하면 된다.

```
docs/koreabylocal_typesafe_integration_plan_20260920.md 를 읽고 KT-00 부터 순서대로 구현해줘.
티켓 하나가 끝날 때마다 §9 형식으로 보고하고, 다음 티켓은 내가 확인한 뒤에 시작해.
```

권장 순서는 **KT-00 → KT-01 → KT-02 → KT-03** 이다. KT-04·KT-05 는 앞 단계 결과를 보고 결정한다.

**이 프로젝트가 TypeSafe 에 잘 맞는 이유**: 콘텐츠와 문의가 전부 **영어**다. Jev 는 영어에서 가장 정확하다고 공식 문서가 밝히고 있어, 한국어 프로젝트보다 위험이 작다.

## 1. TypeSafe 가 무엇인가 (구현자가 알아야 할 최소)

글을 **쓰는** AI 가 아니라 **판정하는** API 다. 텍스트(`state`)와 질문을 보내면 코드가 바로 쓸 수 있는 숫자가 온다.
Claude·Gemini 를 대체하지 않는다 — **기사는 계속 Claude 가 쓰고, Jev 는 고르고 걸러낸다.**

| 질문 유형 | 용도 | 응답 |
|---|---|---|
| `noul` | 예/아니오 | `noul`: 0~1 확률 |
| `choice` | 정해진 선택지 중 하나 | `choice`, 선택지별 `probabilities`, `confidence` |
| `score` | 단계별 기준으로 채점 | `score`(단계 사이 값 가능), `probabilities`, `confidence` |

```
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <TYPESAFE_API_KEY>
{ "state": <string|object|array>, "model": "jev-latest", "questions": { "<id>": { "type", "instructions", "criteria" } } }
→ { "model", "answers": { "<id>": {...} }, "usage": { "input_tokens", "output_tokens" } }
```

- 가격: 입력 100만 토큰당 $0.042, 출력 무료 (2026-09-20 문서 기준)
- 한도: 요청당 64k 토큰(그중 `state` + 가장 긴 질문 32k), 분당 1,200요청. 한도는 예고 없이 바뀔 수 있다고 명시돼 있다
- 한 요청에 질문을 수십 개 넣을 수 있고 병렬로 처리된다. **질문끼리는 서로의 답을 보지 못한다**
- 질문 id 는 모델에 전달되지 않는다 — 의미는 `instructions` 에 전부 써야 한다
- `state` 의 필드는 백틱 경로로 가리킨다: `` `candidates.t1` ``
- 오류: 401(키) · 422(본문 검증) · 429(한도) · 529(과부하). 429·529 는 지수 백오프로 재시도

**구현 전에 반드시 최신 문서를 읽을 것**(모델·한도가 자주 바뀐다):
색인 `https://docs.typesafe.ai/llms.txt` · API `https://docs.typesafe.ai/api.md` · 모델 `https://docs.typesafe.ai/models.md`
· 약점 목록 `https://docs.typesafe.ai/model-jaggedness/jev-1.13.md` · 재순위 예제 `https://docs.typesafe.ai/cookbooks/rerank_typesafe.md`

### 알려진 약점 — 설계에 반영할 것

1. **숫자 계산·날짜 비교·개수 세기를 못 한다** → 비교·합산은 코드가 한다. Jev 에는 의미 판단만 맡긴다
2. **글자 그대로 읽는다** → 조건·경계 사례를 `criteria` 에 명시한다
3. **`state` 가 크고 잡다하면 정확도가 떨어진다** → 질문에 필요한 것만 보낸다
4. **`state` 안의 악의적 문구에 흔들릴 수 있다** → 방문자가 쓴 문의를 판정할 때 결과를 자동 실행(자동 회신·자동 환불 등)에 쓰지 않는다
5. Noul 과 Choice 의 임계값은 서로 호환되지 않는다
6. `jev-latest` 는 예고 없이 다른 버전을 가리킬 수 있다 → 응답의 `model` 을 결과와 함께 저장한다

## 2. 실측 결과 (2026-09-20)

이 사이트의 실제 글 제목 6개와 가상 후보·문의로 시험했다.

**주제 중복 판정** (후보 6개를 한 요청에)

| 후보 제목 | 기대 | p(중복) |
|---|---|---|
| How to pay for buses in Korea without cash (T-money guide) | 중복 | 0.90 |
| Best eSIM and pocket WiFi options for Korea travelers | 중복 | 0.65 |
| What to buy at Daiso Korea: 15 traveler favorites | 중복 | 0.76 |
| Is it safe to join a DMZ tour as a foreigner? | 중복 | 0.73 |
| A local's guide to Busan's Haeridan-gil cafes | 신규 | 0.06 |
| How to take the KTX from Seoul to Busan | 신규 | 0.09 |

6/6 정답 · 624ms · 입력 897토큰. 중복과 신규 사이가 0.09 ↔ 0.65 로 넓게 벌어진다.

**문의 분류** (문의 4건 × 분류 + 긴급도)

| 문의 요지 | 분류 | 긴급(48시간 내 답 필요) |
|---|---|---|
| 내일 06시 인천 도착, 명동행 공항버스 운행 여부 | Transport (1.00) | 0.91 |
| 내년 봄 5인 가족 7일 일정 | Itinerary (1.00) | 0.02 |
| 팔로워 구매 광고 | Spam (1.00) | 0.02 |
| 홍대 근처 비건 한식 | Food (1.00) | 0.15 |

8/8 정답 · 659ms · 입력 1,154토큰.

**해석 주의**: 표본이 작고 쉬운 사례다. 운영 임계값은 KT-01·KT-02 에서 실제 데이터로 다시 맞춘다.
문서의 "100ms" 와 달리 서울에서는 0.6~0.7초가 나왔다.

통과한 질문 문구(그대로 출발점으로 쓴다):

```jsonc
// state: { "existing_posts": ["title", ...], "candidates": { "t1": "title", ... } }
"t1": {
  "type": "noul",
  "instructions": "Would an article titled `candidates.t1` substantially duplicate the topic of any article in `existing_posts`?",
  "criteria": {
    "true": "An existing post already covers the same topic and reader intent",
    "false": "No existing post covers this topic, or it only shares a broad theme"
  }
}
// state: { "messages": { "m1": "text" } }
"m1_urgent": {
  "type": "noul",
  "instructions": "Does `messages.m1` need an answer within 48 hours because the traveler's trip is imminent or already underway?"
}
```

## 3. 이 저장소에서 찾은 적용 지점

| # | 지점 | 현재 상태 | 문제 |
|---|---|---|---|
| A | `supabase/functions/suggest-topics/index.ts` | 기존 글 제목을 **80개까지만** 프롬프트에 넣고 "겹치지 말라"고 당부한다 | 글이 80개를 넘으면 나머지는 보지 못한다. 겹쳤는지 확인하는 단계가 없다 |
| B | `supabase/functions/polar-webhook` → `send-inquiry-notification` | 결제된 Ask a Local 문의를 관리자에게 메일로 알린다 | **유료 서비스인데** 어떤 문의가 급한지, 이미 답한 글이 있는지 알 수 없다 |
| C | `supabase/functions/generate-article/index.ts` | `body.publish` 가 참이면 **검수 없이 바로 `published`** 로 저장한다. 프롬프트에 "Do not invent precise figures" 한 줄뿐 | 지어낸 요금·운영시간이 그대로 발행될 수 있다. 여행 정보라 틀리면 독자가 실제로 손해를 본다 |
| D | 블로그 ↔ 스팟·상품·체험 연결 | 글과 `products`·`experiences`·스팟 사이의 추천 연결이 없다 | 트래픽이 상점으로 흐르지 않는다 |
| E | `blog_posts.category` | 기본값 `'general'`. 아임웹에서 옮긴 글의 분류 상태 미확인 | 분류가 비면 카테고리 페이지·내부 링크가 약해진다 |

참고: 아임웹 옛 주소(`?idx=`) → 새 slug 301 은 `functions/_middleware.ts` 에 id 기준으로 이미 구현돼 있다. TypeSafe 가 할 일이 없다.

## 4. 설계 원칙

1. **판정 결과는 제안이다.** 자동 발행·자동 회신에 직접 연결하지 않는다. 사람이 보는 화면에 근거(확률·confidence)와 함께 보여준다
2. **TypeSafe 가 죽어도 본 기능은 돈다.** 키가 없거나 오류가 나면 판정 필드를 `null` 로 두고 기존 동작을 그대로 한다. 결제·알림 흐름을 절대 막지 않는다
3. **개인정보를 보내지 않는다.** 문의의 `name`·`email` 은 보내지 않고 `message` 본문만 보낸다. TypeSafe 의 데이터 미보관(ZDR)은 엔터프라이즈 요금제만 해당한다. 고객 데이터를 학습에 쓰지 않는다고는 명시돼 있다
4. **키는 Edge Function 에만.** `VITE_` 접두어 변수나 브라우저 코드에 넣지 않는다
5. **모델 버전을 저장한다.** 임계값을 고정한 뒤에는 `TYPESAFE_MODEL` 로 버전을 고정한다

## 5. 티켓

### KT-00 · 준비 — 비밀값과 공용 모듈

**할 일**
- `supabase/functions/_shared/typesafe.ts` 신설(`_shared/gmail.ts` 와 같은 관례, Deno)
  - `judge(state, questions, opts?)` → `{ answers, usage, model, ms } | { error, message }`
  - `fetch` 로 직접 호출. 타임아웃 8초, 429·529 는 최대 2회 지수 백오프, 401·422 는 즉시 실패
  - `TYPESAFE_API_KEY` 가 없으면 `{ error: 'not_configured' }` — 호출부가 조용히 건너뛸 수 있게
  - 질문 빌더 3개(`noul`·`choice`·`score`)와 응답 타입을 같이 둔다
- 환경변수: `TYPESAFE_API_KEY`(필수) · `TYPESAFE_MODEL`(선택, 기본 `jev-latest`)

**키 등록 — 값을 직접 다루지 않고 환경변수에서 넘긴다**

이 맥에는 키가 macOS 키체인(서비스명 `TYPESAFE_API_KEY`)에 있고, `~/.zshrc` 가 새 셸마다 환경변수 `TYPESAFE_API_KEY` 로 올린다(2026-09-20 설정).
구현자(Claude Code)는 **값을 출력·기록하지 않고** 변수에서 바로 넘긴다. 사람이 붙여넣을 필요가 없다.

```bash
# 0) 변수가 잡혔는지 길이만 확인 (값은 찍지 않는다). 0 이면 zsh -ic '…' 로 감싸 새 셸에서 실행
echo "len=${#TYPESAFE_API_KEY}"

# 1) Supabase Edge Function secret — 셸이 변수를 풀어 넘기므로 기록에는 변수 이름만 남는다
supabase secrets set TYPESAFE_API_KEY="$TYPESAFE_API_KEY"

# 2) 확인 — 이름과 해시만 나온다
supabase secrets list
```

지켜야 할 것
- `echo $TYPESAFE_API_KEY` · `env | grep` 처럼 **값이 화면이나 로그에 찍히는 명령을 쓰지 않는다**
- 키를 소스 파일·`.env*`(특히 `VITE_` 접두어)·커밋 메시지·문서에 적지 않는다
- 로컬에서 함수를 띄울 때는 `supabase functions serve --env-file <(printf 'TYPESAFE_API_KEY=%s\n' "$TYPESAFE_API_KEY")` 처럼 파일을 남기지 않는다
- 권한 확인 단계에서 막히면 우회하지 말고, 사용자에게 위 명령을 `! ` 접두어로 직접 실행해 달라고 요청한다
- 맥미니 등 다른 기기에는 키체인 항목이 없다. 거기서는 애플 패스워드 `Jev API` 항목에서 복사해 `security add-generic-password -a "$USER" -s TYPESAFE_API_KEY -w` 로 한 번 등록한다

**완료 기준**: 임시 함수에서 `judge()` 호출이 200 을 받는다. 키를 지우면 `not_configured` 가 온다.

### KT-01 · 주제 중복 필터 (적용 지점 A)

**할 일**
- `suggest-topics` 에서 AI 가 주제를 돌려준 **뒤** 한 단계를 더한다
  1. `blog_posts` 의 제목을 **전부** 가져온다(80개 제한 없이, `status` 무관 — 초안과 겹쳐도 중복이다)
  2. 후보마다 §2 의 noul 질문을 만들어 한 요청으로 보낸다. 제목이 많아 32k 를 넘으면 제목을 묶음으로 나눠 묶음별 최댓값을 쓴다
  3. `p ≥ 0.5` 인 후보에는 두 번째 요청으로 "어느 글과 겹치는가"를 choice 로 묻는다(선택지 = 기존 제목, 많으면 상위 묶음만)
  4. 응답의 각 topic 에 `duplicate: { probability, of_title, of_slug } | null` 을 덧붙인다. **후보를 지우지는 않는다**
- `src/components/admin/studio/TopicIdeas.tsx` — 겹침 표시와 "겹치는 글 보기" 링크. 겹친 후보는 아래로 내린다
- 프롬프트에 제목 80개를 넣는 기존 부분은 그대로 둔다(생성 단계의 1차 회피)

**임계값 맞추기**: 실제 제목 전체로 후보 30개를 돌려 사람이 정답을 달고 0.5 가 맞는지 본다. §2 에서는 신규 ≤ 0.09, 중복 ≥ 0.65 였다.

**완료 기준**: 기존 글과 같은 주제의 후보에 겹침 표시가 붙고 원본 글로 이동할 수 있다. TypeSafe 를 끄면 표시 없이 기존처럼 동작한다.

### KT-02 · Ask a Local 문의 분류 (적용 지점 B)

결제까지 끝난 문의라 스팸 위험은 낮다. 가치는 **긴급도**와 **이미 답한 글 찾기**에 있다 — 유료 서비스의 응답 속도를 올린다.

**할 일**
- 마이그레이션: `inquiries` 에 `ai_triage jsonb` 컬럼 추가(`{ category, category_confidence, urgent, related: [{slug,title,score}], model, at }`)
- `polar-webhook` 에서 결제 확정 직후, 알림을 보내기 **전에** `message` 만으로 판정한다(`name`·`email` 제외)
  - 분류(choice): Transport · Itinerary · Food · Shopping · Culture · Other — 폼에서 고른 `category` 와 다르면 둘 다 보여준다
  - 긴급(noul): §2 문구
  - 관련 글(score): 발행된 글 제목+요약을 후보로 "이 글이 이 질문에 답하는가"를 3단계로 채점. 상위 3개
    - 후보가 많으면 먼저 코드로 좁힌다(제목·요약의 단어 겹침 상위 30개) — `state` 를 작게 유지(약점 3)
- 판정은 `try/catch` 로 감싸고 **실패해도 결제 기록·알림은 그대로 진행**한다. 웹훅 응답 시간을 늘리지 않도록 알림 직전에 한 번만 호출하고 타임아웃은 5초로 줄인다
- `send-inquiry-notification` — 긴급이면 제목 앞에 `[URGENT]`, 본문에 관련 글 링크 3개
- `src/pages/admin/AdminInquiriesPage.tsx` · `AdminInquiryDetailPage.tsx` — 긴급 표시, 관련 글 링크, 분류 불일치 표시
- 개인정보처리방침(`src/pages/legal`)에 문의 본문이 자동 분류를 위해 외부 처리 업체로 전송될 수 있음을 추가할지 PM 확인(§10)

**완료 기준**: 시험 결제 문의에 `ai_triage` 가 채워지고 알림 메일에 반영된다. TypeSafe 키를 빼도 결제·알림이 정상 동작한다.

### KT-03 · 발행 전 기사 검수 (적용 지점 C)

**설계**: 수치가 든 문장을 **코드가 찾고**, Jev 가 문장마다 판정한다.

1. `supabase/functions/_shared/claims.ts` — HTML 을 문장으로 나누고, 숫자·통화·시간·거리 표현이 든 문장만 고르는 순수 함수(정규식)
2. `generate-article` 에서 글이 만들어진 뒤, 저장하기 전에 판정한다
   - 문장별(noul): 이 문장이 특정 요금·운영시간·거리·소요시간·전화번호를 **확정된 사실로** 말하는가
   - 문장별(noul): 시점이 지나면 틀리게 되는 내용인가(축제 날짜, 행사, "올해")
   - 글 전체(noul): 첫 문단의 Quick answer 가 제목의 질문에 직접 답하는가
   - 글 전체(score 3단계): 현지인 1인칭 목소리가 유지되는가
3. **`body.publish` 가 참이어도 확정 수치 문장이 1개 이상이면 `draft` 로 저장**하고 응답에 `review_required: true` 와 문장 목록을 넣는다
4. 마이그레이션: `content_jobs` 에 `review jsonb` 컬럼 추가. 결과·모델 버전을 저장한다
5. `src/components/admin/studio/NewDraftForm.tsx` — 검수 결과를 보여주고, 해당 문장을 편집 화면에서 강조한다

**주의**: Jev 는 그 수치가 **맞는지는 모른다**. "확인이 필요한 문장"을 찾아줄 뿐이다. 사실 확인은 사람이 한다.

**완료 기준**: 요금이 든 글이 `publish: true` 로 요청돼도 `draft` 로 저장되고 확인할 문장이 표시된다.

### KT-04 · 글 ↔ 스팟·상품·체험 추천 — 수익화 연결 (적용 지점 D)

트래픽을 상점으로 보내는 장치다. 발행 시점에 한 번 계산해 저장하므로 방문자 응답 속도에 영향이 없다.

- 마이그레이션: `blog_posts` 에 `related jsonb`(`{ products:[], experiences:[], spots:[], posts:[], model, at }`)
- `supabase/functions/build-related` 신설 — 글 1편에 대해 후보(이름 + 한 줄 설명)를 50개씩 묶어 score 3단계("이 글을 읽는 여행자에게 이 항목이 쓸모 있는가")로 채점, 유형별 상위 3개 저장
- 발행·수정 시 호출하고, 기존 글은 `scripts/` 의 일괄 스크립트로 한 번 돌린다
- `src/pages/blog` 상세 하단에 추천 영역. **점수가 임계값 미만이면 아무것도 보여주지 않는다**(억지 추천 금지)
- 먼저 글 10편으로 결과를 사람이 보고 임계값을 정한다

### KT-05 · 카테고리 정리 (적용 지점 E) — 분포 확인 후 결정

먼저 분포를 본다.
```sql
select category, count(*) from koreabylocal.blog_posts group by 1 order by 2 desc;
```
`general` 이 많으면 일회성 스크립트로 choice(City Guide · Food · Itinerary · Culture · Transport · Nature · K-pop · News) 분류를 돌린다.
confidence 가 낮은 글은 바꾸지 않고 목록으로 뽑아 사람이 정한다. **DB 를 바로 고치지 말고 제안 CSV 를 먼저 만든다.**

## 6. 비용 추정

| 작업 | 1회 토큰(입력) | 1회 비용 | 월 예상 |
|---|---|---|---|
| 주제 중복 필터(후보 6 × 제목 200) | 약 4,000 | $0.0002 | 무시 가능 |
| 문의 분류(관련 글 후보 30 포함) | 약 3,000 | $0.0001 | 100건 → $0.01 |
| 기사 검수(수치 문장 20개) | 약 3,000 | $0.0001 | 무시 가능 |
| 추천 일괄 계산(글 100편 × 후보 200) | 약 120만 | $0.05 | 최초 1회 |

월 $1 을 넘기 어렵다.

## 7. 시험과 검증

- **이 저장소에는 시험 도구가 없다**(`package.json` 에 test 스크립트 없음). 순수 함수(`claims.ts`, 질문 빌더, 묶음 나누기)는 Deno 내장 시험(`deno test`)으로 `supabase/functions/_shared/*.test.ts` 에 둔다. Vitest 도입은 이 작업 범위 밖이다
- `typesafe.ts` 는 `fetch` 를 주입받게 만들어 200·401·429·529·타임아웃을 단위 시험한다
- 실제 API 를 부르는 평가 스크립트는 `scripts/typesafe-eval.ts` 로 분리한다
- 화면 변경은 Playwright 실브라우저로 어드민 동선을 돌리고 콘솔 에러 0건까지 확인한다
- `npm run lint && npm run build` 통과

## 8. 배포

- Edge Function: `supabase functions deploy <name>` — 바뀐 함수만. `_shared` 를 고치면 그것을 쓰는 함수를 전부 다시 배포한다
- 마이그레이션은 기존 파일 관례(`supabase/migrations/2026MMDD_*.sql`, idempotent `add column if not exists`)를 따른다. 스키마는 `koreabylocal`
- 프론트는 기존 Cloudflare Pages 흐름(`origin` = `jooyongc/koreabylocal` 의 `main`)
- 바깥 폴더 `~/@Github/jooyongc/koreabylocal` 은 25커밋 뒤처진 옛 복제본이다. **거기서 작업하지 않는다**

## 9. 완료 보고 형식

```
완료 티켓: KT-0X 이름
변경 내용: 사용자에게 보이는 변화 / 데이터·API 변화
변경 파일: 경로
검증: 실행 명령 / 통과·실패 결과
수동 확인: URL과 확인 방법
남은 항목: 결정 필요 사항, 외부 계정, 후속 작업
```

## 10. 결정이 필요한 것

| # | 질문 | 이 문서의 가정 |
|---|---|---|
| 1 | 문의 본문을 외부 분류 API 로 보내는 것을 개인정보처리방침에 적을지 | 적는다(KT-02 에 포함) |
| 2 | 확정 수치 문장이 있으면 `publish: true` 를 무시하고 `draft` 로 돌릴지 | 돌린다 |
| 3 | 추천 영역(KT-04)에서 상품을 글보다 먼저 보여줄지 | 글 → 스팟 → 상품 순 |

## 부록 — 작업 중 발견한 별개 문제

`suggest-topics` 의 Gemini 대체 경로 기본 모델이 `gemini-2.0-flash` 다. utopmarina 프로젝트의 2026-09-15 기록에 따르면 이 모델은 **서비스가 종료됐다.**
`ANTHROPIC_API_KEY` 가 설정돼 있으면 영향이 없지만, 빠지는 순간 주제 제안이 전부 실패한다. `GEMINI_MODEL` 기본값을 현행 모델로 바꾸는 것을 권한다(TypeSafe 와 무관한 별도 수정).
