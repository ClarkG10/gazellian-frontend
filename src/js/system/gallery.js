import { backendURL } from "../utils/utils.js";

const urlParams = new URLSearchParams(window.location.search);
const spId = urlParams.get("spId");

const CACHE_NAME = "service-provider-cache";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";

const cache = await caches.open(CACHE_NAME);

const cachedSP = await cache.match(SERVICE_PROVIDER_URL);
const spDataCached = await cachedSP.json();

const spData = spDataCached.find((sp) => sp.id === parseInt(spId));

document.getElementById("details").innerHTML =
  spData.business_name + " Portfolio";

const portfolioContainer = document.getElementById("portfolio_container");

const portfolioData = spData.portfolio;

portfolioContainer.innerHTML = "";

document.querySelector(".portfolios").classList.remove("hidden");

// Create modal structure
const modal = document.createElement("div");
modal.id = "imageModal";
modal.className =
  "fixed inset-0 border border-gray-300 flex items-center justify-center hidden z-50";
modal.style.backgroundColor = "rgba(95, 95, 95, 0.5)";

modal.innerHTML = `
  <div class="relative">
    <span id="closeModal" class="absolute top-6 right-3 text-gray-400 hover:text-black text-2xl font-bold cursor-pointer ">&times;</span>
    <img id="modalImg" class="max-w-full max-h-screen py-5" />
  </div>
`;
document.body.appendChild(modal);

const modalImg = document.getElementById("modalImg");
const closeModal = document.getElementById("closeModal");

for (let i = 0; i < portfolioData.length; i++) {
  let img = document.createElement("img");
  img.src = backendURL + "/storage/" + portfolioData[i].media_url;
  img.className =
    "w-full h-full object-cover border border-gray-300 shadow-sm cursor-pointer";
  img.alt = `Portfolio ${i + 1}`;

  // Assign large image style every 3rd image
  if (i % 3 === 0) {
    img.classList.add("col-span-2", "row-span-2");
  }

  // Add click event to open modal
  img.addEventListener("click", () => {
    modalImg.src = img.src;
    modal.classList.remove("hidden");
  });

  portfolioContainer.appendChild(img);
}

// Close modal when clicking the close button
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Close modal when clicking outside the image
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});
