import {
  backendURL,
  createToast,
  profile_picture,
  userId,
} from "../utils/utils.js";

const updateLogoForm = document.getElementById("update_logo_form");
const createPortoflioImgForm = document.getElementById(
  "create_portoflio_img_form"
);
const logoPreview = document.getElementById("logoPreview");
const uploadedImagesContainer = document.getElementById("uploadedImage");
const confirmationModal = document.getElementById("confirmationModal");

logoPreview.src = `${backendURL}/storage/${profile_picture}`;

const CACHE_NAME = "portfolio-cache";
const PORTFOLIO_URL = backendURL + "/api/provider/portfolio/index";
const SP_CACHE_NAME = "service-provider-cache";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";

async function fetchPortfolio(firstLoad = false) {
  const cache = await caches.open(CACHE_NAME);
  const spCache = await caches.open(SP_CACHE_NAME);

  const response = await fetch(PORTFOLIO_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  const spResponse = await fetch(SERVICE_PROVIDER_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! Status: ${response.status}`,
      await response.text()
    );
  }
  if (!spResponse.ok) {
    throw new Error(
      `HTTP error! Status: ${spResponse.status}`,
      await spResponse.text()
    );
  }

  const portfolioData = await response.json();
  const spData = await spResponse.json();
  await cache.put(PORTFOLIO_URL, new Response(JSON.stringify(portfolioData)));
  await spCache.put(SERVICE_PROVIDER_URL, new Response(JSON.stringify(spData)));

  if (firstLoad) {
    location.reload();
  } else {
    loadCachePortfolio();
  }
}

let portfolioData = [];

async function loadCachePortfolio() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(PORTFOLIO_URL);
    if (response) {
      portfolioData = await response.json();
      displayPortfolio(portfolioData);
    } else {
      await fetchPortfolio(true);
    }
  } catch (err) {
    console.error(err);
  }
}

// display porfolio
function displayPortfolio() {
  let html = "";

  for (let i = 0; i < portfolioData.length; i++) {
    html += `<div class="w-full relative group">
      <div
        class="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden relative"
      >
        <!-- Image -->
        <img
          class="w-full h-48 object-cover"
          src="${backendURL}/storage/${portfolioData[i].media_url}"
          alt="Portfolio Image"
        />

        <!-- Hover Overlay with Centered View Icon -->
        <a
          href="${backendURL}/storage/${portfolioData[i].media_url}"
          target="_blank"
          class="text-white text-sm font-semibold flex items-center opacity-100"
        >
          <div
            class="absolute inset-0 bg-black flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"
              />
            </svg>
          </div>
        </a>
      </div>

      <!-- Bottom Buttons -->
      <div class="p-2 flex justify-end space-x-3">
        <!-- Delete Button -->
        <button type="button" class="text-red-500 border py-1 px-3 rounded-md hover:text-white hover:bg-red-500 transition duration-200 deleteImage"
        data-id="${portfolioData[i].id}">
          Delete
        </button>
      </div>
    </div>`;
  }

  uploadedImagesContainer.innerHTML = html;
}

updateLogoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(updateLogoForm);

  updateLogoForm.querySelector("button").disabled = true;
  updateLogoForm.querySelector("button").innerText = "Applying...";

  formData.append("_method", "PUT");

  const response = await fetch(backendURL + "/api/user/" + userId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const newData = await response.json();

  console.log(newData);

  localStorage.setItem("profilePictureLink", newData.user.profile_picture);

  if (!response.ok) {
    throw Error(await response.text());
  }

  updateLogoForm.reset();
  updateLogoForm.querySelector("button").disabled = false;
  updateLogoForm.querySelector("button").innerText = "Apply Changes";
  document.getElementById("logoSubmitBtn").classList.add("hidden");
  document.getElementById("logoUploadBtn").classList.remove("hidden");
  createToast("Business logo has been successfully updated.");
  await fetchPortfolio();
});

createPortoflioImgForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(createPortoflioImgForm);

  createPortoflioImgForm.querySelectorAll("button")[1].disabled = true;
  createPortoflioImgForm.querySelectorAll("button")[1].innerText =
    "Uploading...";
  let count = 0;

  for (const [key, value] of formData.entries()) {
    count++;

    const uploadFormData = new FormData();
    uploadFormData.append("provider_id", userId);
    uploadFormData.append("media_url", value);

    const response = await fetch(backendURL + "/api/portfolio", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      throw Error(await response.text());
    }
  }

  createPortoflioImgForm.reset();
  createPortoflioImgForm.querySelectorAll("button")[1].disabled = false;
  createPortoflioImgForm.querySelectorAll("button")[1].innerText = "Upload";
  document.getElementById("gallery").classList.add("hidden");
  document.getElementById("updloadButton").classList.add("hidden");

  createToast(
    `${count > 1 ? `The images` : `The image`} has been successfully uploaded.`
  );
  await fetchPortfolio();
});

// delete
confirmationModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    confirmationModal.classList.add("hidden");
  }
});

document.getElementById("deleteButton").addEventListener("click", async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById("deleteButton").dataset.id);

  const response = await fetch(backendURL + "/api/portfolio/" + id, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });
  if (!response.ok) {
    throw Error(await response.text());
  }

  document.getElementById("confirmationModal").classList.add("hidden");
  await fetchPortfolio();
  createToast("The image has been successfully deleted.");
});

uploadedImagesContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("deleteImage")) {
    const id = parseInt(e.target.dataset.id);

    document.getElementById("confirmationModal").classList.remove("hidden");
    document.getElementById("deleteButton").dataset.id = id;
  }
});

loadCachePortfolio();
