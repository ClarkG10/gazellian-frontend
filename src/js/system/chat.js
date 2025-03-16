import {
  backendURL,
  formatTime,
  getBadgeMessage,
  profile_picture,
  userId,
} from "../utils/utils.js";

const message_form = document.getElementById("message_form");
const messages_container = document.getElementById("messages_container");
const conversationList = document.getElementById("conversationList");
const chatHeaderContainer = document.getElementById("chatHeaderContainer");

let selectedConversation = null;
const CACHE_NAME = "chats-cache";
const CHAT_MESSAGES_URL = backendURL + "/api/message/users/index";

const cache = await caches.open(CACHE_NAME);
let chatDataCached = [];

// Function to fetch and update cache
async function fetchChatDatas(firstLoad) {
  console.log("Fetching fresh data...");
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

  chatDataCached = await response.json();
  cache.put(CHAT_MESSAGES_URL, new Response(JSON.stringify(chatDataCached)));

  if (selectedConversation) {
    await getMessages(selectedConversation);
  } else if (firstLoad) {
    location.reload();
  }

  localStorage.setItem("chatDataLoaded", "true");
}

// Load from cache if available
const cachedChat = await cache.match(CHAT_MESSAGES_URL);
if (cachedChat) {
  chatDataCached = await cachedChat.json();
  getConversationList();
} else {
  let firstload;
  await fetchChatDatas((firstload = true));
}

// Scroll function
function scrollToBottom() {
  messages_container.scrollTop = messages_container.scrollHeight;
}

// Parse receiverId from URL
const urlParams = new URLSearchParams(window.location.search);
const receiverId = urlParams.get("receiverId");

if (receiverId) {
  updateChatHeader(receiverId);
  getMessages(receiverId);
}

// Handle message submission
message_form.onsubmit = async (e) => {
  e.preventDefault();

  if (!selectedConversation && !receiverId) {
    alert("Please select a conversation first.");
    return;
  }

  const formData = new FormData(message_form);
  const messageText = formData.get("message").trim();
  if (!messageText) return;

  message_form.querySelectorAll(".sendButton").disabled = true;

  formData.append("sender_id", userId);
  formData.append("receiver_id", selectedConversation || receiverId);
  formData.append("is_seen_by_sender", 1);

  const response = await fetch(backendURL + "/api/message", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  if (!response.ok) {
    console.error("Error sending message");
    return;
  }

  message_form.reset();

  messages_container.innerHTML += `
    <div class="flex items-start space-x-3 justify-end me-3">
      <div class="flex flex-col space-y-2 max-w-sm">
        <div class="customBg text-white p-3 rounded-lg shadow" style="width:fit-content">
          <p>${messageText}</p>
        </div>
        <span class="text-xs text-gray-500">${formatTime(Date.now())}</span>
      </div>
      <img src="${backendURL}/storage/${profile_picture}" class="w-10 h-10 rounded-full object-cover" alt="User"/>
    </div>`;

  message_form.querySelectorAll(".sendButton").disabled = false;
  fetchChatDatas();
  scrollToBottom();
};

// Server-Sent Events (SSE) for real-time updates
let previousLength = 0;
const eventSource = new EventSource(backendURL + "/api/message/stream", {
  withCredentials: true,
});

eventSource.onmessage = async (event) => {
  const updatedData = JSON.parse(event.data);
  const unreadCount = updatedData.filter(
    (msg) =>
      !msg.is_seen_by_receiver && parseInt(msg.receiver_id) === parseInt(userId)
  ).length;

  console.log(`New unread message(s): ${unreadCount}`);

  if (unreadCount !== previousLength) {
    previousLength = unreadCount;
    await fetchChatDatas();
    getConversationList();
    scrollToBottom();
  }
};

eventSource.onerror = () => {
  console.error("SSE error, closing connection");
  eventSource.close();
};

// Fetch messages for selected conversation
async function getMessages(receiver_id) {
  selectedConversation = receiver_id;

  if (!chatDataCached.length) {
    console.warn("No cached chat data available.");
    return;
  }

  const filteredMessages = chatDataCached.filter(
    (msg) =>
      msg.receiver_id === parseInt(receiver_id) ||
      msg.sender_id === parseInt(receiver_id)
  );

  messages_container.innerHTML = filteredMessages
    .map((message) => {
      const isSender = parseInt(message.sender_id) === parseInt(userId);
      return isSender
        ? `<div class="flex items-start space-x-3 justify-end me-3">
          <div class="flex flex-col space-y-2 max-w-sm">
            <div class="customBg text-white p-3 rounded-lg shadow" style="width:fit-content">
              <p>${message.message}</p>
            </div>
            <span class="text-xs text-gray-500">${formatTime(
              message.created_at
            )}</span>
          </div>
          <img src="${backendURL}/storage/${profile_picture}" class="w-10 h-10 rounded-full object-cover" alt="User"/>
        </div>`
        : `<div class="flex items-start space-x-3">
          <img src="${backendURL}/storage/${
            message.sender.profile_picture
          }" class="w-10 h-10 rounded-full object-cover" alt="User"/>
          <div class="flex flex-col space-y-2 max-w-sm">
            <div class="bg-gray-100 p-3 rounded-lg shadow" style="width:fit-content">
              <p class="text-gray-800">${message.message}</p>
            </div>
            <span class="text-xs text-gray-500">${formatTime(
              message.created_at
            )}</span>
          </div>
        </div>`;
    })
    .join("");

  scrollToBottom();
  // erase param receiverId
  window.history.replaceState({}, "", window.location.pathname);
}

// Update chat header
async function updateChatHeader(senderId) {
  try {
    const response = await fetch(`${backendURL}/api/user/${senderId}`, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user data");
      return;
    }

    const user = await response.json();
    console.log(user);
    chatHeaderContainer.innerHTML = `
      <img src="${backendURL}/storage/${
      user.profile_picture
    }" class="w-12 h-12 rounded-full object-cover mr-3" alt="Chat User"/>
      <h3 class="text-lg font-semibold text-gray-900">
        ${user.provider ? user.provider.business_name : user.fullname}
      </h3>`;
  } catch (error) {
    console.error("Error updating chat header:", error);
  }
}

// Fetch conversation list
async function getConversationList() {
  const uniqueConversations = new Map();

  chatDataCached.forEach((message) => {
    const conversationKey =
      parseInt(message.receiver_id) === parseInt(userId)
        ? message.sender_id
        : message.receiver_id;
    uniqueConversations.set(conversationKey, message);
  });

  renderConversationList(uniqueConversations);
}

function renderConversationList(conversations) {
  let avatarHTML = "";

  if (conversations.size === 0) {
    conversationList.innerHTML = `<p class="text-gray-500 text-center py-5">No conversations yet</p>`;
    return;
  }

  const sortedConversations = Array.from(conversations.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  console.log(sortedConversations);
  sortedConversations.forEach((message) => {
    const isSender = parseInt(message.sender_id) === parseInt(userId);
    const conversationPartner = isSender ? message.receiver : message.sender;

    console.log(conversationPartner.id);

    avatarHTML += `<div class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer " 
        data-user-id="${conversationPartner.id}" data-is-sender="${isSender}">
        <img src="${backendURL}/storage/${
      conversationPartner.profile_picture
    }" class="w-12 h-12 rounded-full object-cover" alt=""/>
        <div class="${isSender ? `` : `font-bold`}">
          <p class="text-gray-900">${
            conversationPartner.role == "customer"
              ? conversationPartner.fullname
              : message.provider == null
              ? message.provider_ext.business_name
              : message.provider.business_name
          }</p>
          <p class="text-gray-500 text-sm truncate">
            ${
              message.message
                ? message.message.substring(0, 35)
                : "No messages yet"
            }
          </p>
        </div>
      </div>`;
  });

  conversationList.innerHTML = avatarHTML;

  // Attach click event to each conversation
  document
    .querySelectorAll("#conversationList > div")
    .forEach((conversation) => {
      conversation.addEventListener("click", async (e) => {
        const senderId = e.currentTarget.getAttribute("data-user-id");
        const isSender = e.currentTarget.getAttribute("data-is-sender");
        selectedConversation = senderId;
        updateChatHeader(senderId);
        getMessages(senderId);
        if (!isSender) {
          markAllAsRead(userId, senderId);
        }
      });
    });
}

async function markAllAsRead(id, senderId) {
  const request = await fetch(
    backendURL + "/api/message/mark/read/" + `${id}/${senderId}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    }
  );

  console.log(id);
  if (!request.ok) {
    throw new Error(await request.text());
  }
  console.log("Marked all messages as read successfully");
  getBadgeMessage();
}

document.getElementById("messageInput").addEventListener("focus", async () => {
  const senderId = selectedConversation;
  if (senderId) {
    await markAllAsRead(userId, senderId);
  }
});

// Search input
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
  console.log("Searching...");
  const searchText = this.value.toLowerCase();
  console.log(searchText);
  document
    .querySelectorAll("#conversationList > div")
    .forEach((conversation) => {
      const name = conversation
        .querySelector("p.text-gray-900")
        .textContent.toLowerCase();
      conversation.style.display = name.includes(searchText) ? "flex" : "none";
    });
});

function removeUrlParam(param) {
  const url = new URL(window.location.href);
  url.searchParams.delete(param);
  window.history.replaceState({}, document.title, url.toString());
}
