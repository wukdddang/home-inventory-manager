const features = [
  {
    title: "집·사무실·차량 등 공간 단위",
    desc: "Household(가구) 단위로 여러 거점을 등록하고 전환합니다.",
    tag: "다중 거점",
  },
  {
    title: "2D 집 구조도",
    desc: "방 박스를 배치해 StorageLocation과 연결하는 구조를 시각화합니다.",
    tag: "구조",
  },
  {
    title: "물품 스프레드시트",
    desc: "엑셀처럼 빠르게 재고(InventoryItem)를 조회·등록합니다.",
    tag: "목록",
  },
  {
    title: "만료·장보기 알림",
    desc: "가족/그룹과 알림 정책을 맞추고 유통기한을 놓치지 않습니다.",
    tag: "알림",
  },
];

export function LoginShowcaseSection() {
  return (
    <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-zinc-900 via-teal-950/40 to-zinc-950 px-8 py-12 lg:px-14 lg:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(45,212,191,0.25), transparent 45%),
              radial-gradient(circle at 80% 70%, rgba(99,102,241,0.2), transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-400/90">
          Home Inventory
        </p>
        <h1 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          집 안 재고를
          <br />
          구조와 표로 동시에
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          ERD 기반 도메인(Household, StorageLocation, InventoryItem)에 맞춘
          UI입니다. API 연동 전까지 브라우저에 로컬로 저장됩니다.
        </p>
      </div>

      <div className="relative z-10 mt-12 grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <span className="inline-block rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
              {f.tag}
            </span>
            <h3 className="mt-2 text-sm font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-10 hidden rounded-2xl border border-white/10 bg-black/30 p-4 sm:block">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          예시 화면 흐름
        </p>
        <div className="mt-3 flex gap-2 text-xs text-zinc-400">
          <span className="rounded-lg bg-teal-500/20 px-2 py-1 text-teal-200">
            로그인
          </span>
          <span aria-hidden>→</span>
          <span className="rounded-lg bg-zinc-800 px-2 py-1">거점 선택</span>
          <span aria-hidden>→</span>
          <span className="rounded-lg bg-zinc-800 px-2 py-1">구조 / 표</span>
          <span aria-hidden>→</span>
          <span className="rounded-lg bg-zinc-800 px-2 py-1">물품 등록</span>
        </div>
      </div>
    </section>
  );
}
