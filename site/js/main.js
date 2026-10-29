(function () {
  const gallery = document.getElementById("gallery");
  const filters = document.getElementById("filters");
  const lightbox = document.getElementById("lightbox");
  const lightboxArt = document.getElementById("lightbox-art");
  const lightboxCaption = document.getElementById("lightbox-caption");

  const rssPosts = window.RSS_POSTS || [];
  const rssWorks = rssPosts
    .filter((p) => p.image)
    .map((p) => ({ title: p.title, category: p.category || "블로그", src: p.image, url: p.url }));
  const localWorks = WORKS.map((w) => ({ ...w, src: w.image ? "images/works/" + w.image : "" }));
  let allWorks = [...localWorks, ...rssWorks];
  if (allWorks.length === 0) allWorks = SAMPLE_WORKS;

  const allPosts = [...POSTS, ...rssPosts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  function applyBlogInfo() {
    const blog = window.RSS_BLOG;
    if (!blog) return;
    if (blog.title) {
      document.querySelector(".logo").textContent = blog.title;
      document.title = blog.title;
      document.querySelectorAll(".js-blog-name").forEach((el) => (el.textContent = blog.title));
    }
    if (blog.description) document.querySelector(".hero-sub").textContent = blog.description;
  }

  function artNode(work) {
    if (work.src) {
      const img = document.createElement("img");
      img.src = work.src;
      img.alt = work.title;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer"; // 네이버 이미지는 외부 리퍼러를 차단합니다
      return img;
    }
    const span = document.createElement("span");
    span.className = "art-text";
    span.textContent = work.text || work.title;
    return span;
  }

  function renderGallery(category) {
    gallery.innerHTML = "";
    allWorks.filter((w) => category === "전체" || w.category === category).forEach((work) => {
      const item = document.createElement("button");
      item.className = "work";
      item.appendChild(artNode(work));
      const label = document.createElement("span");
      label.className = "work-label";
      label.textContent = work.title;
      item.appendChild(label);
      item.addEventListener("click", () => openLightbox(work));
      gallery.appendChild(item);
    });
  }

  function renderFilters() {
    const categories = ["전체", ...new Set(allWorks.map((w) => w.category))];
    categories.forEach((cat, i) => {
      const btn = document.createElement("button");
      btn.className = "filter" + (i === 0 ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        filters.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderGallery(cat);
      });
      filters.appendChild(btn);
    });
  }

  function renderPosts() {
    const list = document.getElementById("posts-list");
    if (allPosts.length === 0) {
      list.innerHTML = '<li class="posts-empty">아직 글이 없습니다.</li>';
      return;
    }
    allPosts.slice(0, 10).forEach((post) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = post.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = "<time></time><span></span>";
      a.querySelector("time").textContent = post.date || "";
      a.querySelector("span").textContent = post.title;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function openLightbox(work) {
    lightboxArt.innerHTML = "";
    lightboxArt.appendChild(artNode(work));
    lightboxCaption.textContent = work.title + " · " + work.category;
    if (work.url) {
      const link = document.createElement("a");
      link.href = work.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "lightbox-link";
      link.textContent = "블로그 글 보기";
      lightboxCaption.append(" ", link);
    }
    lightbox.hidden = false;
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-close")) lightbox.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.hidden = true;
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  applyBlogInfo();
  renderFilters();
  renderGallery("전체");
  renderPosts();
})();
