const defaultLinks = [
  {
    id: "portfolio-home",
    name: "Main Portfolio",
    url: "https://example.com",
    type: "Featured",
    status: "Live",
    note: "Replace this with the website you want people to visit first."
  },
  {
    id: "client-site",
    name: "Client Website",
    url: "https://example.com/client",
    type: "Client",
    status: "Updated",
    note: "A place for client work, case studies, or completed builds."
  },
  {
    id: "profile-link",
    name: "Professional Profile",
    url: "https://example.com/profile",
    type: "Profile",
    status: "Live",
    note: "Add LinkedIn, GitHub, Behance, Dribbble, or another public profile."
  }
];

const storageKey = "adelani-portfolio-links";
const linkForm = document.querySelector("#linkForm");
const linksGrid = document.querySelector("#linksGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const formStatus = document.querySelector("#formStatus");
const linkCount = document.querySelector("#linkCount");
const featuredCount = document.querySelector("#featuredCount");
const liveCount = document.querySelector("#liveCount");
const resetLinks = document.querySelector("#resetLinks");
const filterButtons = document.querySelectorAll(".filter-button");

let activeFilter = "All";
let links = loadLinks();

document.querySelector("#year").textContent = new Date().getFullYear();

function loadLinks() {
  const storedLinks = localStorage.getItem(storageKey);

  if (!storedLinks) {
    return defaultLinks;
  }

  try {
    const parsedLinks = JSON.parse(storedLinks);
    return Array.isArray(parsedLinks) ? parsedLinks : defaultLinks;
  } catch {
    return defaultLinks;
  }
}

function saveLinks() {
  localStorage.setItem(storageKey, JSON.stringify(links));
}

function normalizeUrl(url) {
  const trimmedUrl = url.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function getVisibleLinks() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  return links.filter((link) => {
    const matchesFilter = activeFilter === "All" || link.type === activeFilter;
    const searchableText = `${link.name} ${link.url} ${link.type} ${link.note}`.toLowerCase();
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });
}

function renderLinks() {
  const visibleLinks = getVisibleLinks();

  linksGrid.innerHTML = "";

  visibleLinks.forEach((link) => {
    const article = document.createElement("article");
    article.className = "link-card";
    article.dataset.type = link.type;
    article.innerHTML = `
      <div class="card-top">
        <span class="tag">${link.type}</span>
        <span class="status">${link.status}</span>
      </div>
      <h3>${escapeHtml(link.name)}</h3>
      <p>${escapeHtml(link.note || "A saved website from Adelani's portfolio.")}</p>
      <a class="link-url" href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">
        ${escapeHtml(formatUrl(link.url))}
      </a>
      <div class="card-actions">
        <a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">Visit</a>
        <button type="button" data-action="copy" data-id="${escapeAttribute(link.id)}">Copy</button>
        <button class="delete-link" type="button" data-action="delete" data-id="${escapeAttribute(link.id)}" title="Delete link" aria-label="Delete ${escapeAttribute(link.name)}">×</button>
      </div>
    `;
    linksGrid.append(article);
  });

  emptyState.classList.toggle("visible", visibleLinks.length === 0);
  linkCount.textContent = links.length;
  featuredCount.textContent = links.filter((link) => link.type === "Featured").length;
  liveCount.textContent = links.filter((link) => link.status === "Live").length;
}

function formatUrl(url) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `link-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

linkForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(linkForm);
  const link = {
    id: createId(),
    name: formData.get("siteName").trim(),
    url: normalizeUrl(formData.get("siteUrl")),
    type: formData.get("siteType"),
    status: formData.get("siteStatus"),
    note: formData.get("siteNote").trim()
  };

  links = [link, ...links];
  saveLinks();
  renderLinks();
  linkForm.reset();
  formStatus.textContent = "Saved.";
  window.setTimeout(() => {
    formStatus.textContent = "";
  }, 1800);
});

linksGrid.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const link = links.find((item) => item.id === actionButton.dataset.id);

  if (!link) {
    return;
  }

  if (actionButton.dataset.action === "copy") {
    await copyText(link.url);
    actionButton.textContent = "Copied";
    window.setTimeout(() => {
      actionButton.textContent = "Copy";
    }, 1400);
  }

  if (actionButton.dataset.action === "delete") {
    links = links.filter((item) => item.id !== link.id);
    saveLinks();
    renderLinks();
  }
});

searchInput.addEventListener("input", renderLinks);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    renderLinks();
  });
});

resetLinks.addEventListener("click", () => {
  links = defaultLinks;
  saveLinks();
  searchInput.value = "";
  activeFilter = "All";
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "All");
  });
  renderLinks();
  formStatus.textContent = "Reset.";
  window.setTimeout(() => {
    formStatus.textContent = "";
  }, 1800);
});

renderLinks();