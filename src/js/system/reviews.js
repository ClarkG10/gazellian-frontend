import { backendURL, createToast, formatDate } from "../utils/utils.js";

const reviewsTable = document.getElementById("reviewsTable");
const searchInput = document.getElementById("searchService");
const confirmationModal = document.getElementById("confirmationModal");
const replyModal = document.getElementById("replyModal");

const REVIEWS_CACHE_NAME = "reviews-cache";
const REVIEWS_URL = backendURL + "/api/provider/review/index";
const SERVICES_URL = backendURL + "/api/services/index";
const SERVICES_CACHE_NAME = "services-cache";
const SP_CACHE_NAME = "service-provider-cache";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";

const cache = await caches.open(REVIEWS_CACHE_NAME);
const serviceCache = await caches.open(SERVICES_CACHE_NAME);
const spCache = await caches.open(SP_CACHE_NAME);

let reviewsData = [];
let servicesData = [];
let filteredReviews = [];
let currentPage = 1;
const rowsPerPage = 10;

async function fetchReviews(firstLoad = false) {
  try {
    const response = await fetch(REVIEWS_URL, {
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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    if (!spResponse.ok) {
      throw new Error(`HTTP error! Status: ${spResponse.status}`);
    }

    const spData = await spResponse.json();
    reviewsData = await response.json();
    filteredReviews = [...reviewsData];

    await cache.put(REVIEWS_URL, new Response(JSON.stringify(reviewsData)));
    await spCache.put(SP_CACHE_NAME, new Response(JSON.stringify(spData)));

    if (firstLoad) {
      location.reload();
    } else {
      renderReviewsTable();
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

async function loadCachedReviews() {
  const cachedReviews = await cache.match(REVIEWS_URL);
  const cachedServices = await serviceCache.match(SERVICES_URL);
  if (cachedReviews) {
    reviewsData = await cachedReviews.json();
    servicesData = await cachedServices.json();

    filteredReviews = [...reviewsData];

    let serviceFilterOptions = `<option value="" >Sort by Service</option>`;
    for (let i = 0; i < servicesData.length; i++) {
      serviceFilterOptions += `<option value="${servicesData[i].service_name}">${servicesData[i].service_name}</option>`;
    }
    document.getElementById("sortService").innerHTML = serviceFilterOptions;
    renderReviewsTable();
  } else {
    fetchReviews(true);
  }
}

function renderReviewsTable() {
  let reviewHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedReviews = filteredReviews.slice(start, end);

  paginatedReviews.forEach((review) => {
    let ratingHTML = "";
    for (let i = 0; i < 5; i++) {
      ratingHTML += review.rating > i ? "&#9733;" : "&#9734;";
    }

    reviewHTML += `<tr>
        <td class="px-6 py-4">${review.customer.fullname}</td>
        <td class="px-6 py-4">${review.service.service_name}</td>
        <td class="px-6 py-4">${ratingHTML}</td>
        <td class="px-6 py-4">${review.review_text}</td>
        <td class="px-6 py-4">${formatDate(review.created_at)}</td>
        <td class="px-6 py-4 flex">
          <button
            type="button"
            data-id="${review.id}"
            class="font-medium text-blue-500 flex cursor-pointer replyReview "
          >
            Reply
          </button>
          <button
            type="button"
            data-id="${review.id}"
            class="ms-2 font-medium text-red-600 hover:underline cursor-pointer deleteReview"
          >
            Delete
          </button>
        </td>
      </tr>`;
  });

  if (filteredReviews.length === 0) {
    reviewHTML =
      "<tr><td colspan='6' class='text-center py-4'>No reviews found</td></tr>";
  }

  reviewsTable.innerHTML = reviewHTML;

  document.getElementById("startEntry").textContent =
    filteredReviews.length === 0 ? 0 : start + 1;
  document.getElementById("endEntry").textContent = Math.min(
    end,
    filteredReviews.length
  );
  document.getElementById("totalEntries").textContent = filteredReviews.length;

  updatePaginationButtons();
}

function updatePaginationButtons() {
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled =
    currentPage * rowsPerPage >= filteredReviews.length;
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderReviewsTable();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage * rowsPerPage < filteredReviews.length) {
    currentPage++;
    renderReviewsTable();
  }
});

// Sorting and filtering
function sortReviews(attr, value = "") {
  if (value === "none" || value === "") {
    filteredReviews = [...reviewsData];
  } else {
    filteredReviews = reviewsData.filter((review) => {
      if (attr === "service.service_name") {
        return review.service.service_name === value;
      }
      if (attr === "rating") {
        return review.rating == value;
      }
      return true;
    });
  }

  currentPage = 1;
  renderReviewsTable();
}

document.getElementById("sortService").addEventListener("change", function () {
  sortReviews("service.service_name", this.value);
});

document.getElementById("sortRating").addEventListener("change", function () {
  sortReviews("rating", this.value);
});

// search functionaality
searchInput.addEventListener("input", function () {
  const searchText = this.value.toLowerCase().trim();

  if (searchText === "") {
    filteredReviews = [...reviewsData];
  } else {
    filteredReviews = reviewsData.filter((review) =>
      review.customer.fullname.toLowerCase().includes(searchText)
    );
  }

  currentPage = 1;
  renderReviewsTable();
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

  const response = await fetch(backendURL + "/api/review/" + id, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });
  if (!response.ok) {
    throw Error(await response.text());
  }

  await fetchReviews();
  document.getElementById("confirmationModal").classList.add("hidden");
  createToast("The review has been successfully deleted.");
});

reviewsTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("deleteReview")) {
    const id = parseInt(e.target.dataset.id);

    document.getElementById("confirmationModal").classList.remove("hidden");
    document.getElementById("deleteButton").dataset.id = id;
  }
});

replyModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    replyModal.classList.add("hidden");
  }
});

// add reply api endpoint here and addEventListener to submit reply form
//
//

reviewsTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("replyReview")) {
    const id = parseInt(e.target.dataset.id);

    document.getElementById("replyModal").classList.remove("hidden");
    document.getElementById("replyButton").dataset.id = id;
  }
});

// Load cached
loadCachedReviews();
