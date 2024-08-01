let stripe;
let apiKey;
document
  .querySelector("#submit-api-key")
  .addEventListener("click", function () {
    const apiKeyInput = document.getElementById("api-key");
    const button = document.getElementById("submit-api-key");
    apiKey = apiKeyInput.value;
    if (apiKey) {
      button.style.backgroundColor = "#4CAF50";
      setTimeout(function () {
        button.style.backgroundColor = "#6772e5";
      }, 500);
      stripe = Stripe(apiKey);
    } else {
      showMessage("Please enter a valid API key.");
    }
  });

const items = [{ id: "xl-tshirt" }];

let elements;

checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

let emailAddress = "";

const button = document.getElementById("myButton");
button.addEventListener("click", initialize);

async function initialize() {
  const clientSecret = document.getElementById("client-secret-input").value;

  const appearance = {
    theme: "stripe",
  };
  elements = stripe.elements({ appearance, clientSecret });

  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");

  linkAuthenticationElement.on("change", (event) => {
    emailAddress = event.value.email;
  });

  const paymentElementOptions = {
    layout: "tabs",
  };

  const paymentElement = elements.create("payment", paymentElementOptions);
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const isSetup = document.getElementById("toggleIsSetup").checked;

  let result;
  if (isSetup) {
    result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
        receipt_email: emailAddress,
      },
    });
  } else {
    result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
        receipt_email: emailAddress,
      },
    });
  }

  const { error } = result;

  if (error) {
    showMessage(error.message);
    const jsonContainer = document.getElementById("json-container");
    jsonContainer.innerText = JSON.stringify(error, null, 2);
  }

  setLoading(false);
}

async function checkStatus() {
  const clientSecret =
    new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    ) ||
    new URLSearchParams(window.location.search).get(
      "setup_intent_client_secret"
    );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent, setupIntent } =
    (await stripe.retrievePaymentIntent(clientSecret)) ||
    (await stripe.retrieveSetupIntent(clientSecret));

  const intent = paymentIntent || setupIntent;

  switch (intent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Your payment was not successful, please try again.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

function setLoading(isLoading) {
  if (isLoading) {
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}
