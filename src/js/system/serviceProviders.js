import { backendURL } from "../utils/utils.js";

const spCard = document.getElementById("serviceProviderCard");
const UPDATE_INTERVAL = 5 * 60 * 1000;

const CACHE_NAME = "service-provider-cache";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";
const CATEGORY_URL = backendURL + "/api/category";

const cache = await caches.open(CACHE_NAME);

async function fetchServiceProvider(firstLoad) {
  console.log("Fetching fresh data from API...");
  const response = await fetch(SERVICE_PROVIDER_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  const categoryResponse = await fetch(CATEGORY_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (!categoryResponse.ok) {
    throw new Error(await categoryResponse.text());
  }

  const spData = await response.json();
  const categoryData = await categoryResponse.json();

  console.log("Fetched fresh data:", spData);

  spData.sort((a, b) => b.average_rating - a.average_rating);

  // Store new data in the cache
  cache.put(SERVICE_PROVIDER_URL, new Response(JSON.stringify(spData)));
  cache.put(CATEGORY_URL, new Response(JSON.stringify(categoryData)));

  // Mark data as loaded for this session
  localStorage.setItem("spDataLoaded", "true");
  if (firstLoad) {
    location.reload();
  }
}

// Check if data is in cache
const cachedSP = await cache.match(SERVICE_PROVIDER_URL);
const cachedCategory = await cache.match(CATEGORY_URL);

if (cachedSP && cachedCategory) {
  const spData = await cachedSP.json();
  const categoryData = await cachedCategory.json();

  getServiceProviderHTML(spData, categoryData);
} else {
  await fetchServiceProvider(true);
}

// Update data every 5 minutes
setInterval(() => {
  console.log("Updating service provider data...");
  fetchServiceProvider().catch(console.error);
}, UPDATE_INTERVAL);

async function getServiceProviderHTML(spData, categoryData) {
  let serviceProviderHTML = "";

  spData.forEach((sp) => {
    let servicesHTML = "";
    let priceRangeMin = [];
    let priceRangeMax = [];

    for (let services of sp.services) {
      const category = categoryData.find((c) => c.id == services.category_id);
      servicesHTML += `<span
                    class="text-xs mt-1 btn-sm px-3 py-1 me-1 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 category-name"
                    >${category.category_name}</span
                  >`;
      // store into array
      priceRangeMin.push(services.price_range_min);
      priceRangeMax.push(services.price_range_max);
    }

    // sort lowest to highest
    priceRangeMin.sort((a, b) => a - b);
    priceRangeMax.sort((b, a) => a - b);

    // console.log(`${sp.id}:`, priceRangeMin, priceRangeMax);

    serviceProviderHTML += `<div
              onclick="window.open('portfolio.html?spId=${sp.id}', '_blank')"
              class="sp-card cursor-pointer flex flex-col md:flex-row items-center bg-white hover:bg-gray-50 transition duration-300 shadow-md rounded-lg mb-3 fade"
              style="width: 950px;">
            <!-- Card Content Here... -->
            <img
              class="aspect-square object-cover w-full md:w-54 md:h-59 rounded-t-lg md:rounded-none md:rounded-l-lg"
              src="${backendURL}/storage/${sp.user.profile_picture}"
              alt="Image"
            />
            <div
              class="flex flex-col justify-between p-4 leading-normal w-full"
            >
              <h5 class="mb-1 text-md font-bold text-gray-900">
                ${sp.business_name}
              </h5>

              <!-- Rating (Stars) -->
              <div class="text-sm flex items-center mb-1">
                <span class="text-yellow-500 ratings"
                  >★ ${
                    sp.average_rating == 0
                      ? `No rating yet`
                      : `${sp.average_rating}`
                  }
                  <span class="text-xs text-gray-400 location">
                    ${sp.location}</span
                  ></span
                >
              </div>
              <p class="text-sm text-gray-700 line-clamp-2">
              ${sp.description}. 
              </p>

              <!-- Service Details -->
              <div class="mt-3">
                <p class="text-sm text-gray-600 flex">
                  <strong>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      style="width: 20px"
                      class="me-1"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                      />
                    </svg>
                  </strong>
                  <span class="price-min">${priceRangeMin[0].toLocaleString()}</span> - <span class="price-max">${priceRangeMax[0].toLocaleString()}</span>
                </p>

                <!-- Service Tags -->
                <div class="flex-wrap mt-2">
                  ${servicesHTML}
                </div>
                <div class="mt-3 flex space-x-3 justify-end">
                ${
                  localStorage.getItem("type") === "service provider" ||
                  localStorage.getItem("token") === null
                    ? `<!-- Booking Button (Locked) -->
                  <button
                    class="flex text-sm px-4 py-2 bg-gray-300 text-gray-500 rounded-lg shadow cursor-not-allowed"
                    disabled
                  >
                    Request Booking
                    <svg
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
                    : `
                  <!-- Booking Button (Locked) -->

                  <button
  class="flex text-sm px-4 py-2 customBg text-white rounded-lg cursor-pointer booking"
  onclick="event.stopPropagation(); openBookingModal(${sp.id});" 
>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 me-1">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
  </svg>
  Request Booking
</button>
`
                }
                </div>
              </div>
            </div>
          </div>`;
  });

  if (spData.length === 0) {
    spCard.innerHTML = "No service providers found.";
    return;
  }

  spCard.innerHTML = serviceProviderHTML;

  let currentPage = 1;
  const spPerPage = 10;
  let allsp = document.querySelectorAll(".sp-card");

  function renderPagination() {
    let start = (currentPage - 1) * spPerPage;
    let end = start + spPerPage;
    allsp.forEach((notification, index) => {
      notification.style.display = index >= start && index < end ? "" : "none";
    });

    document.getElementById("startEntry").textContent = start + 1;
    document.getElementById("endEntry").textContent = Math.min(
      end,
      allsp.length
    );
    document.getElementById("totalEntries").textContent = allsp.length;

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = end >= allsp.length;
  }

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPagination();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage * spPerPage < allsp.length) {
      currentPage++;
      renderPagination();
    }
  });

  renderPagination();
}

if (localStorage.getItem("token") != null) {
  const eventOptions = document.getElementById("eventOptions");
  const eventDate = document.getElementById("eventDate");
  const CACHE_NAME = "events-cache";
  const EVENT_URL = backendURL + "/api/event/customer/index";
  const cache = await caches.open(CACHE_NAME);
  const cachedEvent = await cache.match(EVENT_URL);

  let eventData = [];

  if (cachedEvent) {
    eventData = await cachedEvent.json();
    populateEvents(eventData);
  } else {
    const eventRequest = await fetch(backendURL + "/api/event/customer/index", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!eventRequest.ok) throw new Error(await eventRequest.text());
    eventData = await eventRequest.json();
    populateEvents(eventData);
  }

  function populateEvents(eventData) {
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
}
