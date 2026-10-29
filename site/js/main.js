(function () {
  const PAGE_SIZE = 12;
  const $ = (id) => document.getElementById(id);

  const rssPosts = window.RSS_POSTS || [];
  const notice = rssPosts.find((p) => p.notice);

  // 직접 추가한 작품 + 이미지가 있는 블로그 글(공지 제외), 최신순
  const works = [
    ...WORKS.map((w) => ({ ...w, image: w.image ? "images/works/" + w.image : "" })),
    ...rssPosts.filter((p) => p.image && !p.notice),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  let category = "전체";
  let query = "";
  let shown = PAGE_SIZE;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function setLinks() {
    const set = (sel, url) => document.querySelectorAll(sel).forEach((a) => (a.href = url));
    set(".js-blog-link", SITE.blogUrl);
    set(".js-form-link", SITE.requestFormUrl);
    set(".js-kakao-link", SITE.kakaoUrl);
    if (notice) {
      const a = document.querySelector(".js-notice-link");
      a.href = notice.url;
      a.hidden = false;
    }
    document.querySelectorAll(".js-total").forEach((n) => (n.textContent = works.length));
    $("year").textContent = new Date().getFullYear();
  }

  function formatDate(d) {
    return d ? d.replace(/-/g, ".") : "";
  }

  function image(work) {
    const img = el("img");
    img.src = work.image;
    img.alt = work.title;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer"; // 원격 네이버 이미지일 때 외부 리퍼러 차단 대비
    img.addEventListener("error", () => img.closest(".card-media")?.classList.add("is-broken"));
    return img;
  }

  function card(work) {
    const article = el("article", "card");
    const media = el(work.url ? "a" : "div", "card-media");
    if (work.url) {
      media.href = work.url;
      media.target = "_blank";
      media.rel = "noopener";
      media.setAttribute("aria-label", work.title + " 블로그 글 보기");
    }
    media.appendChild(image(work));
    if (work.no) media.appendChild(el("span", "card-badge", "No. " + String(work.no).padStart(2, "0")));
    if (work.url) media.appendChild(el("span", "circle-btn circle-dark card-arrow", "↗"));

    const meta = el("div", "card-meta");
    meta.append(el("span", "", work.category || ""), el("time", "", formatDate(work.date)));

    const title = el("h3", "card-title");
    if (work.url) {
      const a = el("a", "", work.title);
      a.href = work.url;
      a.target = "_blank";
      a.rel = "noopener";
      title.appendChild(a);
    } else {
      title.textContent = work.title;
    }

    article.append(media, meta, title);
    if (work.summary) article.appendChild(el("p", "card-text", work.summary));
    if (work.tags && work.tags.length) {
      const tags = el("ul", "card-tags");
      work.tags.forEach((t) => tags.appendChild(el("li", "", t)));
      article.appendChild(tags);
    }
    return article;
  }

  function matches(work) {
    if (category !== "전체" && work.category !== category) return false;
    if (!query) return true;
    const hay = [work.title, work.fullTitle, work.category, work.summary, ...(work.tags || [])].join(" ").toLowerCase();
    return hay.includes(query);
  }

  function renderGrid() {
    const list = works.filter(matches);
    const grid = $("grid");
    grid.innerHTML = "";
    list.slice(0, shown).forEach((w) => grid.appendChild(card(w)));
    $("empty").hidden = list.length > 0;
    $("more").hidden = list.length <= shown;
    $("result-label").textContent = (category === "전체" ? "전체 작업 " : category + " ") + list.length;
  }

  function renderFilters() {
    const counts = new Map([["전체", works.length]]);
    works.forEach((w) => w.category && counts.set(w.category, (counts.get(w.category) || 0) + 1));
    const wrap = $("filters");
    counts.forEach((count, name) => {
      const btn = el("button", "filter" + (name === category ? " active" : ""));
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", name === category);
      btn.append(name, el("span", "filter-count", String(count).padStart(2, "0")));
      btn.addEventListener("click", () => {
        category = name;
        shown = PAGE_SIZE;
        wrap.querySelectorAll(".filter").forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn);
        });
        renderGrid();
      });
      wrap.appendChild(btn);
    });
  }

  // 첫 화면 오른쪽: 작업 이미지를 5초마다 바꿔 보여줍니다.
  function startScene() {
    const pool = works.filter((w) => w.image);
    if (pool.length === 0) return;
    const scene = $("scene");
    const img = $("scene-img");
    let index = 0;
    function show(i) {
      const w = pool[i];
      img.src = w.image;
      img.alt = w.title;
      img.referrerPolicy = "no-referrer";
      $("scene-count").textContent = String(i + 1).padStart(2, "0") + " / " + pool.length;
      $("scene-category").textContent = (w.category ? w.category + " · " : "") + "BLOG PORTFOLIO";
      $("scene-title").textContent = w.title;
      $("scene-link").href = $("scene-arrow").href = w.url || "#portfolio";
    }
    show(0);
    scene.hidden = false;
    if (pool.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(() => {
        if (document.hidden) return;
        index = (index + 1) % pool.length;
        scene.classList.add("is-fading");
        setTimeout(() => {
          show(index);
          scene.classList.remove("is-fading");
        }, 350);
      }, 5000);
    }
  }

  $("more").addEventListener("click", () => {
    shown += PAGE_SIZE;
    renderGrid();
  });
  $("search").addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    shown = PAGE_SIZE;
    renderGrid();
  });

  setLinks();
  renderFilters();
  renderGrid();
  startScene();
})();
