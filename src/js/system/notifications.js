import {
  backendURL,
  createToast,
  formatDate,
  getNotif,
  userId,
} from "../utils/utils.js";

const notificationsContainer = document.getElementById(
  "notifications_container"
);

const CACHE_NAME = "notification-cache";
const NOTIFICATION_URL = backendURL + "/api/notification/users/index";

const cache = await caches.open(CACHE_NAME);

async function fetchNotification(firstLoad) {
  // Fetch fresh data from API
  console.log("Fetching fresh data from API...");
  const response = await fetch(NOTIFICATION_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const notifData = await response.json();

  // Store new data in the cache
  cache.put(NOTIFICATION_URL, new Response(JSON.stringify(notifData)));

  // Mark data as loaded for this session
  localStorage.setItem("notifDataLoaded", "true");
  if (firstLoad) {
    location.reload();
  }
}

// Check if data is in cache
const cachedNotification = await cache.match(NOTIFICATION_URL);

if (cachedNotification) {
  const notifData = await cachedNotification.json();

  getNotification(notifData);
} else {
  let firstLoad;
  await fetchNotification((firstLoad = true));
}

async function getNotification(notifData) {
  let notificationHTML = "";

  console.log(notifData);

  notifData.forEach((notif) => {
    notificationHTML += `<div
          class="notification-card bg-white border border-gray-300 shadow-sm rounded-lg p-3 w-full cursor-pointer"
          data-type="${notif.type}"
          data-id="${notif.id}" 
        >
          <div class="flex items-start notification-item">
            <div class="customBg text-white p-1 rounded-lg mr-4 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 18a2.25 2.25 0 1 1-4.5 0m-4.5-2.25h13.5M18 15.75V11a6 6 0 1 0-12 0v4.75M5.25 15.75a1.5 1.5 0 0 1-1.5-1.5v-.75a1.5 1.5 0 0 1 1.5-1.5m13.5 3.75a1.5 1.5 0 0 0 1.5-1.5v-.75a1.5 1.5 0 0 0-1.5-1.5" />
              </svg>
            </div>
            <div class="flex-1 ${
              notif.status == false ? "font-semibold" : `opacity-75`
            }">
              <h6 class="text-sm">${notif.header_text}</h6>
              <p class="text-gray-700 text-xs">
                ${notif.message}.
              </p>
              <span class="text-xs text-gray-500">${formatDate(
                notif.created_at
              )}</span>
            </div>
          </div>
        </div>`;
  });

  if (notifData.length === 0) {
    notificationsContainer.innerHTML = `<div class="text-center text-gray-700 mt-4">No notifications found.</div>`;
    return;
  }

  notificationsContainer.innerHTML = notificationHTML;
  document.querySelector(".pagination").classList.remove("hidden");

  let currentPage = 1;
  const notificationsPerPage = 10;
  let allNotifications = document.querySelectorAll(".notification-card");

  function renderPagination() {
    let start = (currentPage - 1) * notificationsPerPage;
    let end = start + notificationsPerPage;
    allNotifications.forEach((notification, index) => {
      notification.style.display =
        index >= start && index < end ? "block" : "none";
    });

    document.getElementById("startEntry").textContent = start + 1;
    document.getElementById("endEntry").textContent = Math.min(
      end,
      allNotifications.length
    );
    document.getElementById("totalEntries").textContent =
      allNotifications.length;

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled =
      end >= allNotifications.length;
  }

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPagination();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage * notificationsPerPage < allNotifications.length) {
      currentPage++;
      renderPagination();
    }
  });

  document
    .getElementById("sortNotifications")
    .addEventListener("change", function () {
      let selectedType = this.value;
      allNotifications.forEach((notification) => {
        notification.style.display =
          selectedType === "all" ||
          notification.getAttribute("data-type") === selectedType
            ? "block"
            : "none";
      });
    });

  renderPagination();

  document
    .getElementById("notifications_container")
    .addEventListener("click", (event) => {
      // Find the closest notification item
      const notificationItem = event.target.closest(".notification-item");
      if (notificationItem) {
        const notificationId =
          notificationItem.closest(".notification-card").dataset.id;
        if (notificationId) {
          markAsRead(notificationId);
        }
      }
    });
}

// getNotification();

let previousLength = 0;

const eventSource = new EventSource(backendURL + "/api/notification/stream", {
  withCredentials: true,
});

eventSource.onmessage = async (event) => {
  const updatedData = JSON.parse(event.data);

  const updatedLength = Array.isArray(updatedData) ? updatedData.length : 1;

  if (updatedLength > previousLength && previousLength === 0) {
    previousLength = updatedLength;
    return;
  }

  if (previousLength === 0) {
    previousLength = updatedLength;
    return;
  }

  if (
    Array.isArray(updatedData) &&
    updatedData.some((data) => data.user_id === userId && data.status === 0)
  );

  if (updatedLength !== previousLength) {
    console.log("New notification received");
    await fetchNotification();
    if (updatedLength > previousLength) {
      createToast("New notification received", updatedData[0].type);
    }
    previousLength = updatedLength;

    return;
  }
};

eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  eventSource.close();
  window.reload();
};

async function markAsRead(notificationId) {
  const response = await fetch(
    backendURL + "/api/notification/mark/read/" + notificationId,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  await fetchNotification();
}

document
  .getElementById("markAllAsReadBtn")
  .addEventListener("click", async () => {
    const response = await fetch(
      backendURL + "/api/notifications/mark/read/" + userId,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    getNotif();
    await fetchNotification();
  });
