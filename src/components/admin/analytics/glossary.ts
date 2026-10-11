// GA4 in plain Korean: what each number means and what to do with it.
// Shown in the "?" hints on the page and in the glossary drawer.

export interface Term {
  key: string;
  term: string;
  /** GA4's own name, to find the same thing in the GA4 console. */
  ga: string;
  /** One line, for hints. */
  short: string;
  /** A few lines, for the glossary. */
  long: string;
  /** How to use it for marketing. */
  use?: string;
}

export const GLOSSARY: Term[] = [
  {
    key: "users", term: "사용자", ga: "Active users",
    short: "사이트에 들어온 사람 수. 같은 사람이 여러 번 와도 1명입니다.",
    long: "기간 안에 사이트에 들어온 사람 수입니다. 같은 사람이 열 번 와도 1명으로 셉니다. 기준은 기기·브라우저라서, 휴대폰과 PC로 따로 오면 2명이 됩니다.",
    use: "얼마나 많은 사람에게 닿았는지를 보는 기본 숫자입니다. 이 사이트는 봇 방문이 많아서, 위쪽 '봇 의심 제외'를 켠 숫자가 실제에 가깝습니다.",
  },
  {
    key: "newUsers", term: "신규 사용자", ga: "New users",
    short: "이 기간에 처음 온 사람 수.",
    long: "이 기간에 사이트에 처음 들어온 사람 수입니다. 사용자 대비 신규 비율이 높으면 새로운 사람을 많이 데려오고 있다는 뜻입니다.",
  },
  {
    key: "sessions", term: "세션 (방문)", ga: "Sessions",
    short: "방문 횟수. 한 사람이 아침·저녁에 두 번 오면 2입니다.",
    long: "방문 횟수입니다. 한 사람이 아침과 저녁에 들어오면 세션은 2입니다. 30분 넘게 아무 동작이 없다가 다시 움직이면 새 방문으로 셉니다.",
  },
  {
    key: "engaged", term: "참여 세션", ga: "Engaged sessions",
    short: "'제대로 본' 방문: 10초 넘게 머물렀거나, 2페이지 이상 봤거나, 핵심 이벤트가 있었던 방문.",
    long: "세 가지 중 하나라도 해당하면 '제대로 본' 방문으로 셉니다. 10초 넘게 화면을 봤거나, 2페이지 이상 봤거나, 핵심 이벤트(예: 예약 버튼 클릭)가 있었던 방문입니다. 봇은 거의 여기에 들어오지 못해서, 실제 독자 수에 가장 가까운 숫자입니다.",
    use: "방문 수보다 이 숫자가 늘어야 진짜 성장입니다.",
  },
  {
    key: "engagementRate", term: "참여율", ga: "Engagement rate",
    short: "참여 세션 ÷ 세션. 들어온 사람 중 실제로 읽은 비율이며, 높을수록 좋습니다.",
    long: "참여 세션을 세션으로 나눈 값입니다. 들어온 방문 중 실제로 읽은 비율을 뜻합니다. 블로그·여행 가이드는 보통 40~60%면 괜찮은 편입니다.",
    use: "채널·페이지별로 비교하면 '어디서 온 사람이 진짜 독자인지', '어느 글이 사람을 붙잡는지' 보입니다.",
  },
  {
    key: "bounce", term: "이탈률", ga: "Bounce rate",
    short: "참여하지 않고 나간 방문의 비율(= 1 − 참여율). 낮을수록 좋습니다.",
    long: "참여하지 않고 나간 방문의 비율이며, 1에서 참여율을 뺀 값입니다. GA4의 이탈률은 예전 GA와 정의가 달라서, '한 페이지만 보고 나간 비율'이 아닙니다.",
  },
  {
    key: "views", term: "페이지 조회수", ga: "Views",
    short: "페이지가 열린 횟수. 새로고침도 1회로 셉니다.",
    long: "페이지가 열린 횟수입니다. 같은 사람이 같은 페이지를 다시 열거나 새로고침해도 셉니다. 세션당 조회수가 높으면 한 번 와서 여러 글을 읽는다는 뜻입니다.",
  },
  {
    key: "engagementTime", term: "사용자당 참여 시간", ga: "Average engagement time per active user",
    short: "화면을 실제로 띄워 놓고 본 시간의 평균. 다른 탭에 가 있던 시간은 빠집니다.",
    long: "사이트가 화면 맨 앞에 떠 있던 시간을 사람 수로 나눈 평균입니다. 창을 열어만 두고 다른 탭을 본 시간은 빠지므로 '실제로 읽은 시간'에 가깝습니다.",
    use: "글이 길고 유익하면 1~3분이 나옵니다. 몇 초에 그치는 글은 첫 화면이나 제목을 손봐야 합니다.",
  },
  {
    key: "channel", term: "채널 (유입 경로)", ga: "Session default channel group",
    short: "어디서 왔는지를 큰 묶음으로 나눈 것: 검색, SNS, 직접 방문, 다른 사이트 링크 등.",
    long: "방문이 어디서 시작됐는지를 GA4가 큰 묶음으로 나눈 것입니다. 검색(구글 등), SNS(인스타 등), 직접 방문, 다른 사이트 링크, 동영상, AI 챗봇 등으로 나뉩니다.",
    use: "참여율이 높은 채널이 '진짜 독자가 오는 길'입니다. 콘텐츠·홍보 노력을 그쪽에 더 씁니다.",
  },
  {
    key: "direct", term: "직접 방문", ga: "Direct",
    short: "주소를 직접 입력했거나 즐겨찾기, 또는 출처를 알 수 없는 방문.",
    long: "주소를 직접 입력했거나 즐겨찾기로 온 방문입니다. 출처가 안 남는 경우도 여기로 들어갑니다(카톡·메신저 링크, 일부 앱 안 브라우저). 봇도 대부분 '직접 방문'으로 잡힙니다.",
  },
  {
    key: "sourceMedium", term: "소스 / 매체", ga: "Session source / medium",
    short: "채널을 더 자세히 본 것. 예: google / organic = 구글 검색, instagram / social = 인스타그램.",
    long: "채널을 사이트 단위로 더 자세히 본 것입니다. 소스는 어디(google, instagram, facebook.com), 매체는 어떤 방식(organic=무료 검색, social=SNS, referral=링크, none=직접)입니다.",
  },
  {
    key: "campaign", term: "캠페인 (UTM)", ga: "Session campaign",
    short: "링크 끝에 붙인 ?utm_campaign=… 표시로, 어느 게시물·프로필 링크에서 왔는지 구분합니다.",
    long: "링크 끝에 ?utm_source=instagram&utm_campaign=koreastaylist처럼 꼬리표를 붙이면, 그 링크로 온 방문을 따로 셀 수 있습니다. 인스타 프로필 링크, 뉴스레터, 제휴 게시물마다 다른 이름을 붙이면 무엇이 효과 있었는지 비교됩니다.",
    use: "같은 캠페인은 글자 하나까지 같은 이름을 써야 합니다(대소문자 포함). 다르면 따로 집계됩니다.",
  },
  {
    key: "landing", term: "랜딩 페이지 (첫 페이지)", ga: "Landing page",
    short: "방문을 시작한 첫 페이지. 사람을 붙잡아야 하는 '입구'입니다.",
    long: "방문을 시작한 첫 페이지입니다. 검색이나 SNS에서 들어온 사람이 처음 보는 화면이라, 여기서 참여율이 낮으면 사람들이 바로 떠난다는 뜻입니다.",
    use: "참여율이 낮은 랜딩 페이지는 제목·첫 문단·첫 이미지가 검색어나 게시물의 기대와 맞는지 봅니다. 다음에 볼 글 링크도 둡니다.",
  },
  {
    key: "event", term: "이벤트", ga: "Event",
    short: "GA4가 기록하는 모든 행동: 페이지 조회, 스크롤, 링크 클릭, 검색 등.",
    long: "GA4는 모든 행동을 '이벤트'로 기록합니다. 페이지 조회(page_view), 끝까지 스크롤(scroll), 외부 링크 클릭(click), 사이트 검색(view_search_results), 사이트가 직접 보내는 예약 버튼 클릭(affiliate_click) 등이 있습니다.",
  },
  {
    key: "keyEvent", term: "핵심 이벤트 (예전 '전환')", ga: "Key event",
    short: "사업에 중요한 행동으로 지정한 이벤트. 예: 예약 버튼 클릭, 문의 제출.",
    long: "여러 이벤트 중 '이게 일어나면 성공'이라고 GA4에 지정해 둔 것입니다(예전 이름: 전환). 지정해야 채널·페이지별로 '누가 성과를 냈는지'가 계산됩니다.",
    use: "GA4 관리 → 이벤트에서 affiliate_click(예약 버튼)과 form_submit(문의 제출)을 핵심 이벤트로 표시해 두면 좋습니다.",
  },
  {
    key: "partner", term: "제휴사 클릭", ga: "click (outbound) by link domain",
    short: "Expedia·Trip.com·Agoda·Klook 같은 제휴 사이트로 나간 클릭 수. 수익의 첫 단계입니다.",
    long: "이 대시보드가 따로 계산하는 숫자입니다. GA4가 자동으로 기록하는 '외부 링크 클릭' 중에서 도착 주소가 제휴 프로그램(Expedia, Hotels.com, Trip.com, Agoda, Booking.com, Klook, Olive Young)인 것만 셉니다. 실제 예약·수익은 각 제휴사 대시보드에서 확인합니다.",
    use: "클릭률(클릭 ÷ 조회)이 높은 페이지가 '돈이 되는 글'입니다. 비슷한 글을 더 만들고, 클릭률이 낮은 글은 버튼 위치·문구를 손봅니다.",
  },
  {
    key: "scroll", term: "끝까지 읽음", ga: "scroll (90%)",
    short: "페이지를 90%까지 내려 본 비율.",
    long: "GA4는 페이지를 90%까지 내리면 scroll 이벤트를 남깁니다. 이 대시보드는 그 횟수를 조회수로 나눠 '끝까지 읽은 비율'로 보여줍니다. 짧은 페이지는 높게, 긴 가이드는 낮게 나오는 게 보통입니다.",
  },
  {
    key: "cohort", term: "재방문 (코호트)", ga: "Cohort exploration",
    short: "같은 주에 처음 온 사람들을 묶어, 몇 주 뒤 다시 왔는지 본 것.",
    long: "같은 주에 처음 온 사람들을 한 묶음(코호트)으로 보고, 1주 뒤·2주 뒤에 몇 %가 다시 왔는지 표로 봅니다. 여행 정보 사이트는 원래 낮지만, 뉴스레터나 연재 글로 올릴 수 있습니다.",
  },
  {
    key: "bots", term: "봇 의심 트래픽", ga: "(이 대시보드의 필터)",
    short: "사람이 아닌 프로그램의 방문. 대량으로 들어와 거의 머물지 않는 나라의 방문을 기본으로 뺍니다.",
    long: "검색 로봇, 크롤러, 광고 사기용 프로그램이 사이트를 열고 바로 닫는 방문입니다. 이 사이트에서는 싱가포르·중국·인도네시아에서 대량으로 들어와 1초 남짓 머무는 방문이 전체의 절반이 넘습니다. 조건은 세 가지입니다. 방문이 많고, 참여율이 8% 미만이고, 1인당 10초 미만인 나라를 자동으로 골라 뺍니다.",
    use: "실제 독자 수·참여율은 '봇 의심 제외'를 켠 숫자로 판단합니다. GA4 화면에서 보는 숫자는 이걸 빼지 않은 숫자라 더 큽니다.",
  },
  {
    key: "compare", term: "비교 기간", ga: "Comparison",
    short: "같은 길이의 바로 앞 기간, 또는 작년 같은 주와 비교합니다.",
    long: "증감(▲▼)은 같은 길이의 바로 앞 기간이나 작년 같은 주(요일까지 맞춤)와 비교한 값입니다. 비교 기간에 데이터가 거의 없으면 퍼센트 대신 '신규'로 표시합니다. 9월 중순 전에는 추적이 제대로 안 되던 때라 지금은 '신규'가 많이 보입니다.",
  },
  {
    key: "realtime", term: "실시간 사용자", ga: "Active users (last 30 minutes)",
    short: "최근 30분 안에 사이트에서 활동한 사람 수.",
    long: "최근 30분 안에 사이트에서 활동한 사람 수입니다. 인스타 릴스를 올린 직후 이 숫자가 뛰는지 보면 게시물 반응을 바로 알 수 있습니다.",
  },
];

const byKey = new Map(GLOSSARY.map((t) => [t.key, t]));
/** The one-line explanation for a "?" hint. */
export const hint = (key: string) => {
  const t = byKey.get(key);
  return t ? `${t.term} (${t.ga}): ${t.short}` : "";
};
