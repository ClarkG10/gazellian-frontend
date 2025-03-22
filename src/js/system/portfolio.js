import { backendURL, formatDate, userId } from "../utils/utils.js";

const urlParams = new URLSearchParams(window.location.search);
const spId = urlParams.get("spId");

const CACHE_NAME = "service-provider-cache";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";
const CATEGORY_URL = backendURL + "/api/category";

const cache = await caches.open(CACHE_NAME);

// Check if data is in cache
const cachedSP = await cache.match(SERVICE_PROVIDER_URL);
const cachedCategory = await cache.match(CATEGORY_URL);

const spDataCached = await cachedSP.json();
const categoryDataCached = await cachedCategory.json();

const BOOK_CACHE_NAME = "booking-cache";
const CUSTOMERBOOKING_URL = backendURL + "/api/booking/customer/index";
const SPBOOKING_URL = backendURL + "/api/booking/provider/index";

const apiUrl =
  localStorage.getItem("type") === "customer"
    ? CUSTOMERBOOKING_URL
    : SPBOOKING_URL;

// Function to fetch and cache booking data
async function fetchBooking() {
  try {
    const cache = await caches.open(BOOK_CACHE_NAME);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const bookingData = await response.json();
    await cache.put(apiUrl, new Response(JSON.stringify(bookingData)));
  } catch (error) {
    console.error("Error fetching booking data:", error);
  }
}

// document.addEventListener("DOMContentLoaded", async () => {
const headerContainer = document.getElementById("header_container");

const spData = spDataCached.find((sp) => sp.id === parseInt(spId));

console.log(spData);

const businessTypes = spData.business_type.split(", ");

let businessTypeHTML = "";

for (let i = 0; i < businessTypes.length; i++) {
  businessTypeHTML += `<span class="text-xs mt-1 btn-sm px-3 py-1 me-1 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600">
              ${businessTypes[i]}
            </span>`;
}

let ratingHTML = "";
for (let j = 0; j < 5; j++) {
  if (j < parseInt(spData.average_rating)) {
    ratingHTML += `&#9733`;
  } else {
    ratingHTML += `&#9734`;
  }
}

headerContainer.innerHTML = ` <section
      class="max-w-6xl mx-auto pb-8 pt-3 px-6 bg-white shadow-sm rounded-lg mt-4 fade-up"
    >
      <div class="mb-4">
        <a href="serviceProviders.html" class="hover:text-blue-800">Back</a>
      </div>
      <div class="flex flex-col md:flex-row items-center md:items-start ps-8">
        <img
          src="${backendURL}/storage/${spData.user.profile_picture}"
          class="w-64 h-64 rounded-full border-2 border-gray-300 mb-6 md:mb-0 md:mr-6"
          alt="Provider Profile"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex justify-between">${
            spData.business_name
          } <a class="text-xs" href="${
  spData.website_url
}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
</svg>
</a></h1>
          <p class="text-gray-700 text-md mt-2 line-clamp-3">
            ${spData.description}
          </p>

          <div class="mt-2">
            <span class="text-gray-500 text-sm">${spData.location}</span
            ><br />
            <span class="text-gray-500 text-sm mt-1"> ${
              spData.user.phone_number
            }</span>
          </div>
          <div class="flex items-center mt-2">
            <span class="text-yellow-400 text-sm">${ratingHTML}</span>
            <span class="text-gray-600 text-sm ml-1"
              >(${spData.average_rating}/5 Based on ${
  spData.reviews.length
} Reviews)</span
            >
          </div>
          <div class="flex-wrap mt-2">
            ${businessTypeHTML}
          </div>
          <div class="flex" style="justify-content: right !important; width: 780px">
            ${
              localStorage.getItem("type") === "service provider" ||
              localStorage.getItem("token") === null
                ? `<a href="chat.html?receiverId=${spId}">
              <button
                class="mt-4 text-sm bg-gray-300 text-gray-500 px-4 py-2 rounded-lg flex me-2 cursor-not-allowed"
                disabled
              >
              
                message <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 ms-1"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
              </button>
            </a>
            <button
              class="mt-4 flex text-sm bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
              disabled
            >
              Request Booking <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 ms-1"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
            </button>`
                : `<a href="chat.html?receiverId=${spId}">
              <button
                class="mt-4 text-sm customBg text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex me-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-5 me-1"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                message
              </button>
            </a>
            <button
              class="mt-4 text-sm customBg text-white px-4 py-2 rounded-lg hover:bg-blue-700 openBookingModal"
            >
              Request Booking
            </button>`
            }
          </div>
        </div>
      </div>
    </section>
`;
// });

// document.addEventListener("DOMContentLoaded", async () => {
const serviceContainer = document.getElementById("service_container");
const serviceOptions = document.getElementById("servicesOptions");

const serviceData = spData.services;

let serviceHTML = "";

let serviceOptionsHTML = `<option value="">Select a service</option>`;

document.querySelector(".services").classList.remove("hidden");

for (let i = 0; i < serviceData.length; i++) {
  const category = categoryDataCached.find(
    (category) => category.id === serviceData[i].category_id
  );
  serviceHTML += `
      <div class="bg-white shadow-sm rounded-xl p-6 w-90 transition-all duration-300 hover:shadow-2xl hover:border-gray-600 fade-up">
        <h3 class="text-lg font-bold customTextColor flex items-center gap-2">
          <span class="customTextColor"><i class="fas fa-concierge-bell"></i></span> 
          ${serviceData[i].service_name}
        </h3>
        <p class="text-sm text-gray-500 flex items-center gap-2 mt-1">
          <span class="text-gray-400"><i class="fas fa-tag"></i></span>
          ${category.category_name}
        </p>
        <p class="text-gray-600 mt-2 ms-2 text-sm">
          ${serviceData[i].description}
        </p>
        <footer class="text-gray-800 font-semibold mt-3 flex items-center gap-2">
          <span class="text-green-600"><i class="fas fa-money-bill-wave"></i></span> 
          PHP ${serviceData[
            i
          ].price_range_min.toLocaleString()} - PHP ${serviceData[
    i
  ].price_range_max.toLocaleString()}
        </footer>
      </div>`;

  serviceOptionsHTML += `<option value="${serviceData[i].id}">${serviceData[i].service_name}</option>`;
}

serviceContainer.innerHTML = serviceHTML;
serviceOptions.innerHTML = serviceOptionsHTML;

// });

const portfolioContainer = document.getElementById("portfolio_container");

const portfolioData = spData.portfolio;

portfolioContainer.innerHTML = "";

document.querySelector(".portfolios").classList.remove("hidden");

for (let i = 0; i < portfolioData.length; i++) {
  let img = document.createElement("img");
  img.src = backendURL + "/storage/" + portfolioData[i].media_url;
  img.className =
    "w-full h-full object-cover rounded-lg shadow-sm customBorder";
  img.alt = `Portfolio ${i + 1}`;

  // Assign large image style every 3rd image
  if (i % 3 === 0) {
    img.classList.add("col-span-2", "row-span-2");
  }

  portfolioContainer.appendChild(img);
}

// document.addEventListener("DOMContentLoaded", async () => {
const reviewContainer = document.getElementById("review_container");

const reviewData = spData.reviews;

let reviewHTML = "";

document.querySelector(".reviews").classList.remove("hidden");
document.querySelector(".pagination").classList.remove("hidden");

for (let i = 0; i < reviewData.length; i++) {
  let ratingHTML = "";

  for (let j = 0; j < 5; j++) {
    if (j < parseInt(reviewData[i].rating)) {
      ratingHTML += `&#9733`;
    } else {
      ratingHTML += `&#9734`;
    }
  }

  const service = serviceData.find((s) => s.id === reviewData[i].service_id);

  reviewHTML += `<div
  class="review-card bg-white shadow-sm rounded-lg p-6 fade-up"
>
  <div>
    <div class="flex items-center">
     <img
    src="${backendURL}/storage/${reviewData[i].profile.profile_picture}"
    class="w-9 h-9 rounded-full me-3"
  />
      <h3 class="text-md font-semibold text-gray-900">${
        spData.user.fullname
      }</h3>
    </div>
    <div class="flex items-center mt-1">
      <span class="text-xs text-yellow-500">${ratingHTML}</span>
      <span class="text-xs text-gray-500 ml-2">Rated ${
        reviewData[i].rating
      }/5  (${service.service_name})</span>
    </div>
    <p class="text-sm text-gray-700 italic mt-2">
      "${reviewData[i].review_text}" 
    </p>
    <p class="text-xs text-gray-500 mt-2">
      Reviewed on ${formatDate(reviewData[i].created_at)}
    </p>
  </div>
</div>`;
}

reviewContainer.innerHTML = reviewHTML;

let currentPage = 1;
const reviewPerPage = 2;
let allreview = document.querySelectorAll(".review-card");

function renderPagination() {
  let start = (currentPage - 1) * reviewPerPage;
  let end = start + reviewPerPage;
  allreview.forEach((notification, index) => {
    notification.style.display =
      index >= start && index < end ? "block" : "none";
  });

  document.getElementById("startEntry").textContent = start + 1;
  document.getElementById("endEntry").textContent = Math.min(
    end,
    allreview.length
  );
  document.getElementById("totalEntries").textContent = allreview.length;

  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = end >= allreview.length;
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPagination();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage * reviewPerPage < allreview.length) {
    currentPage++;
    renderPagination();
  }
});

renderPagination();
// });

if (localStorage.getItem("token") !== null) {
  const bookingModal = document.getElementById("bookingModal");
  const openBookingModalButtons =
    document.querySelectorAll(".openBookingModal");

  openBookingModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // console.log("Booking modal opened");
      bookingModal.classList.remove("hidden");
    });
  });

  const booking_form = document.getElementById("booking_form");
  const confirmationModal = document.getElementById("confirmationModal");

  booking_form.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(booking_form);
    booking_form.querySelector("button").innerText = `Booking...`;

    // disable button until response
    booking_form.querySelectorAll("button").disabled = true;

    const bookingData = {
      provider_id: spId,
      customer_id: userId,
      event_id: formData.get("event_id"),
      service_id: formData.get("service_id"),
      booking_date: formData.get("event_date"),
      requested_amount: formData.get("requested_amount"),
      note: formData.get("note"),
    };

    const bookingResponse = await fetch(backendURL + "/api/booking", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(bookingData),
    });

    // throw error
    if (!bookingResponse.ok) throw new Error(await bookingResponse.text());

    booking_form.reset();

    booking_form.querySelector("button").innerText = `Book Now`;
    booking_form.querySelectorAll("button").disabled = false;
    closeBookingModal();
    await fetchBooking();
  };

  function closeBookingModal() {
    document.getElementById("bookingModal").classList.add("hidden");
    confirmationModal.classList.remove("hidden");

    setTimeout(() => {
      confirmationModal.classList.add("hidden");
    }, 2000);
  }

  const eventOptions = document.getElementById("eventOptions");
  const eventDate = document.getElementById("eventDate");

  const eventRequest = await fetch(backendURL + "/api/event/customer/index", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!eventRequest.ok) throw new Error(await eventRequest.text());
  const eventData = await eventRequest.json();

  console.log(eventData[0].event_name);

  let eventHTML = `<option value="">Select an event</option>`;

  for (let i = 0; i < eventData.length; i++) {
    eventHTML += `<option value="${eventData[i].id}">${eventData[i].event_name}</option>`;
  }

  eventOptions.innerHTML = eventHTML;

  eventOptions.addEventListener("change", () => {
    const eventId = parseInt(eventOptions.value);
    const event = eventData.find((e) => e.id === eventId);

    if (event) {
      console.log("Event ID:", eventId);
      console.log("Event:", event);
      eventDate.value = event.event_date;
    } else {
      console.log("Event not found");
      eventDate.value = "";
    }
  });
}
