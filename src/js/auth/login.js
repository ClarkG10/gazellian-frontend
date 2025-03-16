import { backendURL, userlogged } from "../utils/utils.js";

const login_form = document.getElementById("login_form");

const headers = {
  Accept: "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
};

login_form.onsubmit = async (e) => {
  e.preventDefault();

  const loginButton = document.querySelector("#login_form button");
  loginButton.disabled = true;
  loginButton.innerHTML = `<div class="text-center">
    <div role="status">
        <svg aria-hidden="true" class="inline w-5 h-5 text-gray-200 animate-spin light:text-gray-600 fill-purple-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
        <span >Loading...</span>
    </div>
</div>`;
  document.getElementById("loader").classList.remove("hidden");

  const formData = new FormData(login_form);

  const loginResponse = await fetch(backendURL + "/api/login", {
    method: "POST",
    headers,
    body: formData,
  });

  const json_login = await loginResponse.json();

  if (loginResponse.ok) {
    localStorage.setItem("token", json_login.token);
    localStorage.setItem("type", json_login.role);

    const response = await fetch(backendURL + "/api/service-provider", {
      headers: {
        Accept: "application/json",
      },
    });
    // throw error
    if (!response.ok) {
      throw new Error("Failed to fetch service providers");
    }

    const data = await response.json();
    const profile = await userlogged();

    localStorage.setItem("id", profile.id);
    localStorage.setItem("profilePictureLink", profile.profile_picture);

    console.log(data);
    const type = localStorage.getItem("type");

    const isRegistrationComplete = data.some((sp) => sp.user_id === profile.id);

    console.log(isRegistrationComplete);

    if (isRegistrationComplete && type === "service provider") {
      window.location.href = "/service-provider/spDashboard.html";
    } else if (type === "customer") {
      window.location.href = "/customer/customerDashboard.html";
    } else if (!isRegistrationComplete && type === "service provider") {
      window.location.href = "/sp-post-registration.html";
    } else {
      window.location.href = "/home.html";
    }

    login_form.reset();
  } else {
    alert(json_login.message);
  }

  loginButton.disabled = false;
  loginButton.innerHTML = `Login`;
};
