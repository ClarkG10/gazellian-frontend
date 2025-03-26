import { backendURL, createToast, userId } from "../utils/utils.js";

const updateBusinessForm = document.getElementById("update_info_form");
const updatePasswordBtn = document.querySelectorAll("button.mt-4")[1];

console.log(updatePasswordBtn);

let data = [];

async function fetchUserData() {
  const response = await fetch(backendURL + "/api/user/" + userId, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw error(await response.text());
  }

  data = await response.json();

  console.log(data);

  if (response.ok) {
    document.getElementById("fullname").value = data.fullname;
    document.getElementById("email").value = data.email;
    document.getElementById("phone_number").value = data.phone_number;

    document.getElementById("display_image").src =
      backendURL + "/storage/" + data.profile_picture;
  }
}

updateBusinessForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateBusinessForm.querySelector("button").disabled = true;
  updateBusinessForm.querySelector("button").innerText = "Saving...";

  const formData = new FormData(updateBusinessForm);

  // check data sent in loop
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  formData.append("_method", "PUT");

  const response = await fetch(backendURL + "/api/user/" + userId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const json_data = await response.json();

  if (!response.ok) {
    console.error("Error updating information");
    updateBusinessForm.querySelector("button").disabled = false;
    updateBusinessForm.querySelector("button").innerText = "Save Changes";
    createToast(`${json_data.message}`, "failed");
    return;
  }

  updateBusinessForm.querySelector("button").disabled = false;
  updateBusinessForm.querySelector("button").innerText = "Save Changes";
  createToast("Persoanl information has been updated successfully!");
  await fetchUserData();
});

updatePasswordBtn.addEventListener("click", async function () {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("password").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  // Validate input fields
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert("All fields are required!");
    return;
  }

  if (newPassword.length < 8) {
    alert("New password must be at least 8 characters long.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New password and confirmation do not match!");
    return;
  }

  updatePasswordBtn.textContent = "Updating...";
  updatePasswordBtn.disabled = true;

  try {
    const response = await fetch(
      backendURL + "/api/user/update-password/" + userId,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmNewPassword,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      alert("Password updated successfully!");
      document.getElementById("currentPassword").value = "";
      document.getElementById("password").value = "";
      document.getElementById("confirmNewPassword").value = "";
    } else {
      alert(
        result.message || "Failed to update password. Please check your input."
      );
    }
  } catch (error) {
    console.error("Error updating password:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    // Re-enable button
    updatePasswordBtn.textContent = "Update Password";
    updatePasswordBtn.disabled = false;
  }
});

fetchUserData();
