(function () {
  const gallery = document.getElementById("gallery");
  const filters = document.getElementById("filters");
  const lightbox = document.getElementById("lightbox");
  const lightboxArt = document.getElementById("lightbox-art");
  const lightboxCaption = document.getElementById("lightbox-caption");

  function artNode(work) {
    if (work.image) {
      const img = document.createElement("img");
      img.src = "images/works/" + work.image;
      img.alt = work.title;
      img.loading = "lazy";
      return img;
    }
    const span = document.createElement("span");
    span.className = "art-text";
    span.textContent = work.text || work.title;
    return span;
  }

  function renderGallery(category) {
    gallery.innerHTML = "";
    WORKS.filter((w) => category === "전체" || w.category === category).forEach((work) => {
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
    const categories = ["전체", ...new Set(WORKS.map((w) => w.category))];
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
    POSTS.forEach((post) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = post.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = '<time></time><span></span>';
      a.querySelector("time").textContent = post.date;
      a.querySelector("span").textContent = post.title;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function openLightbox(work) {
    lightboxArt.innerHTML = "";
    lightboxArt.appendChild(artNode(work));
    lightboxCaption.textContent = work.title + " · " + work.category;
    lightbox.hidden = false;
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-close")) lightbox.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.hidden = true;
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  renderFilters();
  renderGallery("전체");
  renderPosts();
})();
