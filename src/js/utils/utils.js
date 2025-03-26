const backendURL = "http://gazellian.test";

async function userlogged() {
  const response = await fetch(backendURL + "/api/show/profile", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  // throw error
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  if (response.ok) {
    const data = await response.json();
    return data;
  }
}
const userId = localStorage.getItem("id");
const profile_picture = localStorage.getItem("profilePictureLink");

if (localStorage.getItem("token") !== null) {
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", async () => {
    document.getElementById("loader").classList.remove("hidden");
    try {
      const response = await fetch(backendURL + "/api/logout", {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      console.log("All cache storage deleted.");

      console.log("Logged out successfully");
      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/home.html";
    } catch (error) {
      console.error(error.message);
    }
  });
}

function formatTime(dateInput) {
  const date = new Date(dateInput);
  const options = { hour: "2-digit", minute: "2-digit", hour12: true };
  const time = date.toLocaleTimeString("en-US", options);

  return `${time}`;
}

function formatDate(created_at) {
  const date = new Date(created_at);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options).replace(",", ",");
}

async function getNotif() {
  const notifBadge = document.getElementById("notificationBadge");

  const response = await fetch(backendURL + "/api/notification/users/index", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  const data = await response.json();

  const notifBadgeCount = data.filter((notif) => !notif.status).length;

  console.log(notifBadgeCount);

  notifBadge.innerHTML = `<span 
    class="absolute top-3 right-82 bg-red-50 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full border border-red-400">
    ${notifBadgeCount}
  </span>`;
}

async function getBadgeMessage() {
  const messageBadge = document.getElementById("messageBadge");

  const response = await fetch(backendURL + "/api/message/users/index", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  // throw error
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await response.json();

  const messageBadgeCount = data.filter(
    (message) =>
      !message.is_seen_by_receiver &&
      parseInt(message.receiver_id) === parseInt(userId)
  ).length;

  console.log(messageBadgeCount);

  messageBadge.innerHTML = `<span 
    class="absolute top-3 right-72 bg-red-50 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full border border-red-400">
    ${messageBadgeCount}
  </span>`;
}

function createToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed top-165 right-5 z-50 text-xs flex items-center w-auto max-w-xs p-4 mb-4 text-white rounded-lg shadow-lg transition-opacity duration-300 opacity-0 ${
    type === "booking"
      ? "bg-green-500"
      : type === "payment"
      ? "bg-red-500"
      : type === "reminder"
      ? "bg-yellow-500"
      : type === "failed"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;

  toast.innerHTML = `
    <div class="flex items-center">
      <span class="mr-2">${message}</span>
      <button class="ml-auto focus:outline-none" onclick="this.parentElement.parentElement.remove()">
        &times;
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Fade in effect
  setTimeout(() => {
    toast.classList.remove("opacity-0");
  }, 100);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300); // Smooth transition removal
  }, 3000);
}

if (localStorage.getItem("token") !== null) {
  async function fetchNotification() {
    const CACHE_NAME = "notification-cache";
    const NOTIFICATION_URL = backendURL + "/api/notification/users/index";

    const cache = await caches.open(CACHE_NAME);

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

    cache.put(NOTIFICATION_URL, new Response(JSON.stringify(notifData)));

    localStorage.setItem("notifDataLoaded", "true");
  }

  let previousLength = 0;

  const eventSource = new EventSource(backendURL + "/api/notification/stream", {
    withCredentials: true,
  });

  eventSource.onmessage = async (event) => {
    const updatedData = JSON.parse(event.data);

    // Count unread notifications
    const updatedLength = updatedData.filter((notif) => !notif.status).length;

    if (updatedLength > previousLength && previousLength === 0) {
      previousLength = updatedLength;
      getNotif();
      return;
    }

    if (previousLength === 0) {
      previousLength = updatedLength;
      return;
    }

    if (
      Array.isArray(updatedData) &&
      updatedData.some(
        (data) =>
          parseInt(data.user_id) === parseInt(userId) &&
          parseInt(data.status) === 0
      )
    ) {
      if (updatedLength !== previousLength) {
        getNotif();

        if (updatedLength > previousLength) {
          if (
            parseInt(updatedData[updatedData.length - 1].user_id) ===
              parseInt(userId) &&
            updatedData[updatedData.length - 1].header_text !==
              "New Booking Request"
          ) {
            createToast(
              "New notification received. Check your notifications.",
              updatedData[updatedData.length - 1].type
            );
            fetchNotification();
          } else if (
            updatedData[updatedData.length - 1].header_text ===
            "New Booking Request"
          ) {
            createToast(
              "New booking request received. Check your bookings.",
              "booking"
            );
          }
        }

        previousLength = updatedLength;
      }
    }
  };

  // Function to fetch and update cache
  async function fetchChatDatas() {
    const CACHE_NAME = "chats-cache";
    const CHAT_MESSAGES_URL = backendURL + "/api/message/users/index";

    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(CHAT_MESSAGES_URL, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch messages");
      return;
    }

    const chatDataCached = await response.json();
    cache.put(CHAT_MESSAGES_URL, new Response(JSON.stringify(chatDataCached)));
  }

  let prevMessageLength = 0;

  const messageEventSource = new EventSource(
    backendURL + "/api/message/stream",
    {
      withCredentials: true,
    }
  );

  messageEventSource.onmessage = async (event) => {
    const updatedData = JSON.parse(event.data);

    // console.log(updatedData);

    // Count unread messages
    const updatedLength = updatedData.filter(
      (message) =>
        !message.is_seen_by_receiver &&
        parseInt(message.receiver_id) === parseInt(userId)
    ).length;

    console.log(updatedLength, prevMessageLength);

    if (updatedLength > prevMessageLength && prevMessageLength === 0) {
      prevMessageLength = updatedLength;
      await getBadgeMessage();
      return;
    }

    if (prevMessageLength === 0) {
      prevMessageLength = updatedLength;
      return;
    }

    if (
      updatedData.some(
        (data) =>
          parseInt(data.receiver_id) === parseInt(userId) &&
          parseInt(data.is_seen_by_receiver) === 0
      )
    ) {
      if (updatedLength !== prevMessageLength) {
        fetchChatDatas();
        console.log("New Message received");
        getBadgeMessage();
        prevMessageLength = updatedLength;
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    eventSource.close();
  };

  if (localStorage.getItem("type") === "service provider") {
    async function fetchBooking() {
      try {
        const CACHE_NAME = "booking-cache";
        const SPBOOKING_URL = backendURL + "/api/booking/provider/index";

        const cache = await caches.open(CACHE_NAME);

        const response = await fetch(SPBOOKING_URL, {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const bookingData = await response.json();

        await cache.put(
          SPBOOKING_URL,
          new Response(JSON.stringify(bookingData))
        );
      } catch (error) {
        console.error("Error fetching booking data:", error);
      }
    }

    const eventSource = new EventSource(backendURL + "/api/booking/stream", {
      withCredentials: true,
    });

    let previousLength = 0;

    eventSource.onmessage = async (event) => {
      const updatedData = JSON.parse(event.data);
      const updatedLength = Array.isArray(updatedData) ? updatedData.length : 1;

      // if (updatedLength > previousLength && previousLength === 0) {
      //   previousLength = updatedLength;
      //   return;
      // }

      if (previousLength === 0) {
        previousLength = updatedLength;
        return;
      }

      if (
        Array.isArray(updatedData) &&
        updatedData.some(
          (data) =>
            parseInt(data.provider_id) === parseInt(userId) &&
            data.status === "pending"
        )
      ) {
        if (updatedLength !== previousLength) {
          await fetchBooking();
          previousLength = updatedLength;
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
      window.reload();
    };
  }
}

export {
  backendURL,
  userlogged,
  formatTime,
  formatDate,
  createToast,
  getNotif,
  getBadgeMessage,
  userId,
  profile_picture,
};
