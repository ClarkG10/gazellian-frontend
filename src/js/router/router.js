const userType = localStorage.getItem("type");
const token = localStorage.getItem("token");

function setRouter() {
  const path = window.location.pathname;

  console.log(path);

  switch (path) {
    case "/home.html":
    case "/contactUs.html":
    case "/aboutUs.html":
    case "/termsAndPrivacy.html":
    case "/serviceProviders.html":
    case "/portfolio.html":
    case "/gallery.html":
      break;

    case "/index.html":
    case "/register.html":
      if (token !== null) {
        if (userType === "customer") {
          window.location.pathname = "home.html";
        } else if (userType === "service provider") {
          window.location.pathname = "home.html";
        }
      }
      break;

    case "/customer/customerDashboard.html":
    case "/customer/customerBooking.html":
    case "/customer/account.html":
    case "/customer/events.html":
    case "/customer/smartBudgeting.html":
      if (token === null || userType !== "customer") {
        window.location.pathname = "/home.html";
      }
      break;

    case "/service-provider/spDashboard.html":
    case "/service-provider/bookings.html":
    case "/service-provider/manage-portfolio.html":
    case "/service-provider/reviews.html":
    case "/service-provider/services.html":
    case "/service-provider/account.html":
      if (token === null || userType !== "service provider") {
        window.location.pathname = "/home.html";
      }
      break;

    case "/chat.html":
    case "/notifications.html":
    case "/sp-post-registration.html":
      if (token === null) {
        window.location.pathname = "/home.html";
      }
      break;

    default:
      break;
  }
}

export { setRouter };
