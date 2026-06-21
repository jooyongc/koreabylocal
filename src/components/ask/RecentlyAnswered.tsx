interface AnsweredQuestion {
  q: string;
  a: string;
  by: string;
}

const ANSWERED: AnsweredQuestion[] = [
  {
    q: "Is 4 days enough for Seoul + Busan?",
    a: "Yes — 2.5 days Seoul, fast train down, 1.5 in Busan. I’ll send a day-by-day.",
    by: "Answered by Minho · 2h",
  },
  {
    q: "Best area to stay for first-timers?",
    a: "Myeongdong or Euljiro for transit + food. Avoid being too far north.",
    by: "Answered by Jiwon · 5h",
  },
  {
    q: "Vegetarian-friendly local food?",
    a: "Temple cuisine, bibimbap, and Gwangjang market has great options.",
    by: "Answered by Soyeon · 1d",
  },
];

export default function RecentlyAnswered() {
  return (
    <section
      aria-labelledby="recently-answered-heading"
      className="mx-auto max-w-[1020px] px-4 pb-[clamp(48px,7vw,90px)] pt-[clamp(34px,5vw,64px)] sm:px-6 lg:px-8"
    >
      <h2
        id="recently-answered-heading"
        className="mb-6 text-center font-display text-[clamp(22px,3vw,32px)] font-extrabold tracking-[-0.01em] text-ink"
      >
        Recently answered
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ANSWERED.map((item) => (
          <article
            key={item.q}
            className="rounded-[18px] bg-white p-[22px] shadow-[0_8px_26px_rgba(16,15,44,0.07)]"
          >
            <h3 className="font-display text-[16px] font-bold leading-[1.3] text-ink">
              {item.q}
            </h3>
            <p className="my-3 mb-3.5 text-[14px] leading-[1.6] text-[#3a3730]">
              {item.a}
            </p>
            <p className="text-[12px] font-semibold text-accent">
              ✦ {item.by}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
