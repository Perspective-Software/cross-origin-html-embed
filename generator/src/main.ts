import "./style.css";

import { generateIframeHtml, GenerateIframeHtmlOptions } from "../../src";

const errorMessageOutput = document.querySelector(
  "#errorMessage",
) as HTMLDivElement;

const outputTextarea = document.querySelector(
  "textarea#output",
) as HTMLTextAreaElement;

const nameInput = document.querySelector(
  "input[name='name']",
) as HTMLInputElement;

const originWhitelistInput = document.querySelector(
  "input[name='originWhitelist']",
) as HTMLInputElement;

const allowAllOriginsCheckbox = document.querySelector(
  "input[name='allowAllOrigins']",
) as HTMLInputElement;

const canonicalUrlInput = document.querySelector(
  "input[name='canonicalUrl']",
) as HTMLInputElement;

const hideBrandingCheckbox = document.querySelector(
  "input[name='hideBranding']",
) as HTMLInputElement;

let options: GenerateIframeHtmlOptions = {
  name: undefined,
  allowAllOrigins: false,
  originWhitelist: [],
  canonicalUrl: undefined,
  hideBranding: false,
};

function generateOutput() {
  try {
    errorMessageOutput.innerHTML = "";
    outputTextarea.value = generateIframeHtml(options);
  } catch (e) {
    errorMessageOutput.innerHTML = `${e}`;
    outputTextarea.value = "";
  }
}

function updateOption(updates: Partial<GenerateIframeHtmlOptions>) {
  options = {
    ...options,
    ...updates,
  } as GenerateIframeHtmlOptions;

  generateOutput();
}

generateOutput();

nameInput.addEventListener("change", () => {
  nameInput.value = nameInput.value.trim();
  updateOption({
    name: nameInput.value,
  });
});

originWhitelistInput.addEventListener("change", () => {
  const origins = originWhitelistInput.value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0)
    .map((part) => {
      try {
        return new URL(part).origin;
      } catch (e) {
        return part;
      }
    });

  originWhitelistInput.value = origins.join(",");

  updateOption({
    originWhitelist: origins.length > 0 ? origins : undefined,
  });
});

allowAllOriginsCheckbox.addEventListener("change", () => {
  updateOption({
    allowAllOrigins: allowAllOriginsCheckbox.checked,
  });
});

canonicalUrlInput.addEventListener("change", () => {
  const rawValue = canonicalUrlInput.value;

  try {
    updateOption({
      canonicalUrl: new URL(rawValue),
    });
  } catch (e) {
    updateOption({
      canonicalUrl: undefined,
    });
    errorMessageOutput.innerHTML = `You entered an invalid URL value: ${rawValue}`;
  }
});

hideBrandingCheckbox.addEventListener("change", () => {
  updateOption({
    hideBranding: hideBrandingCheckbox.checked,
  });
});
