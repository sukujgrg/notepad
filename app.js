import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  createEditor,
} from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import {
  $isListItemNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
  registerList,
} from "@lexical/list";
import { registerRichText } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";

const DEFAULT_MESSAGE = `Add your announcement, update, or notice here.

Use the toolbar to style the content before exporting the page.`;
const DEFAULT_HEADER_LABEL = (import.meta.env.VITE_HEADER_LABEL || "Brand Label").trim();
const DEFAULT_HEADER_TITLE = (import.meta.env.VITE_HEADER_TITLE || "Branded Notepad").trim();
const DEFAULT_FOOTER_TEXT = (import.meta.env.VITE_FOOTER_TEXT || "123 Example Street, Sydney NSW 2000").trim();
const DEFAULT_LOGO_URL = (import.meta.env.VITE_LOGO_URL || "").trim();
const DEFAULT_PLACE_TEXT = (import.meta.env.VITE_PLACE_TEXT || "Add a place").trim();
const DEFAULT_FONT_FAMILY = "manrope";
const DEFAULT_FONT_SIZE = "22px";
const DEFAULT_TEXT_COLOR = "#1f2430";
const DEFAULT_HEADER_COLOR = (import.meta.env.VITE_HEADER_COLOR || "#213547").trim();
const DEFAULT_FOOTER_COLOR = (import.meta.env.VITE_FOOTER_COLOR || "#2e4f3f").trim();
const DEFAULT_ACCENT_COLOR = "#9b4d2f";
const PREVIEW_PAGE_HEIGHT = 1754;

const FONT_FAMILY_PRESETS = {
  manrope: {
    label: "Manrope",
    style: "Manrope",
    css: '"Manrope", sans-serif',
  },
  inter: {
    label: "Inter",
    style: "Inter",
    css: '"Inter", sans-serif',
  },
  lora: {
    label: "Lora",
    style: "Lora",
    css: '"Lora", serif',
  },
  merriweather: {
    label: "Merriweather",
    style: "Merriweather",
    css: '"Merriweather", serif',
  },
  "source-serif": {
    label: "Source Serif",
    style: '"Source Serif 4"',
    css: '"Source Serif 4", serif',
  },
  fraunces: {
    label: "Fraunces",
    style: "Fraunces",
    css: '"Fraunces", serif',
  },
  playfair: {
    label: "Playfair Display",
    style: '"Playfair Display"',
    css: '"Playfair Display", serif',
  },
};

const headerLabelInput = document.querySelector("#headerLabelInput");
const headerTitleInput = document.querySelector("#headerTitleInput");
const footerTextInput = document.querySelector("#footerTextInput");
const logoUploadInput = document.querySelector("#logoUploadInput");
const headerColorInput = document.querySelector("#headerColorInput");
const footerColorInput = document.querySelector("#footerColorInput");
const dateInput = document.querySelector("#dateInput");
const placeInput = document.querySelector("#placeInput");
const previewPages = document.querySelector("#previewPages");
const printButton = document.querySelector("#printButton");
const fontFamilyButton = document.querySelector("#fontFamilyButton");
const fontFamilyButtonLabel = document.querySelector("#fontFamilyButtonLabel");
const fontFamilyMenu = document.querySelector("#fontFamilyMenu");
const fontFamilyOptions = Array.from(document.querySelectorAll(".font-family-option"));
const fontSizeInput = document.querySelector("#fontSizeInput");
const textColorInput = document.querySelector("#textColorInput");
const boldButton = document.querySelector("#boldButton");
const italicButton = document.querySelector("#italicButton");
const underlineButton = document.querySelector("#underlineButton");
const alignLeftButton = document.querySelector("#alignLeftButton");
const alignCenterButton = document.querySelector("#alignCenterButton");
const alignRightButton = document.querySelector("#alignRightButton");
const bulletListButton = document.querySelector("#bulletListButton");
const numberListButton = document.querySelector("#numberListButton");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");
const clearButton = document.querySelector("#clearButton");
const statusMessage = document.querySelector("#statusMessage");
const messageEditor = document.querySelector("#messageEditor");
const messageEditorShell = document.querySelector("#messageEditorShell");
const mobileToolbarToggle = document.querySelector("#mobileToolbarToggle");
const editorPlaceholder = document.querySelector("#editorPlaceholder");

const logoImage = new Image();
const userAgent = navigator.userAgent;
const isApplePdfBrowser = /iPad|iPhone|iPod/.test(userAgent)
  || (/Safari/i.test(userAgent) && !/Chrome|Chromium|Android/.test(userAgent));

const editor = createEditor({
  namespace: "lsc-notepad",
  nodes: [ListNode, ListItemNode],
  theme: {
    paragraph: "editor-paragraph",
    text: {
      bold: "editor-text-bold",
      italic: "editor-text-italic",
      underline: "editor-text-underline",
    },
  },
  onError(error) {
    throw error;
  },
});

registerRichText(editor);
registerHistory(editor, createEmptyHistoryState(), 300);
registerList(editor);
editor.setRootElement(messageEditor);

let currentMessage = DEFAULT_MESSAGE;
let currentLogoDataUrl = "";
let isFontFamilyMenuOpen = false;
const mobileToolbarMedia = window.matchMedia("(max-width: 640px)");
let isMobileToolbarCollapsed = mobileToolbarMedia.matches;

function setInitialMessage(text) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    for (const block of text.split(/\n\s*\n/)) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(block.trim()));
      root.append(paragraph);
    }
  });
}

function getMessageText(editorState = editor.getEditorState()) {
  let message = "";

  editorState.read(() => {
    const blocks = $getRoot()
      .getChildren()
      .map((node) => node.getTextContent().trim())
      .filter(Boolean);

    message = blocks.join("\n\n");
  });

  return message.trim();
}

function formatDateDisplay(value) {
  const [year, month, day] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function setButtonState(button, active) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));
}

function setFontFamilyControl(value) {
  const selectedFont = FONT_FAMILY_PRESETS[value] ? value : DEFAULT_FONT_FAMILY;
  fontFamilyButtonLabel.textContent = FONT_FAMILY_PRESETS[selectedFont].label;
  fontFamilyButtonLabel.dataset.fontFamily = selectedFont;

  for (const option of fontFamilyOptions) {
    const isActive = option.dataset.fontFamily === selectedFont;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  }
}

function closeFontFamilyMenu() {
  isFontFamilyMenuOpen = false;
  fontFamilyMenu.hidden = true;
  fontFamilyButton.setAttribute("aria-expanded", "false");
  fontFamilyButton.classList.remove("is-active");
  fontFamilyButton.blur();
}

function applyMobileToolbarState() {
  const shouldCollapse = mobileToolbarMedia.matches ? isMobileToolbarCollapsed : false;
  messageEditorShell.classList.toggle("is-toolbar-collapsed", shouldCollapse);
  mobileToolbarToggle.setAttribute("aria-expanded", String(!shouldCollapse));
  mobileToolbarToggle.textContent = shouldCollapse ? "Text Controls" : "Hide Controls";

  if (shouldCollapse) {
    closeFontFamilyMenu();
  }
}

function openFontFamilyMenu() {
  isFontFamilyMenuOpen = true;
  fontFamilyMenu.hidden = false;
  fontFamilyButton.setAttribute("aria-expanded", "true");
  fontFamilyButton.classList.add("is-active");
}

function toggleFontFamilyMenu() {
  if (isFontFamilyMenuOpen) {
    closeFontFamilyMenu();
  } else {
    openFontFamilyMenu();
  }
}

function preserveSelectionOnMouseDown(control) {
  control.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
}

function dispatchEditorCommand(command, payload) {
  editor.focus();
  editor.dispatchCommand(command, payload);
}

function getSelectedBlockElement(selection) {
  const anchorNode = selection.anchor.getNode();
  const topLevel = anchorNode.getTopLevelElementOrThrow();
  return topLevel;
}

function getSelectedListType(selection) {
  let node = selection.anchor.getNode();

  while (node) {
    if ($isListNode(node)) {
      return node.getListType();
    }

    if ($isListItemNode(node)) {
      const parent = node.getParent();
      if (parent && $isListNode(parent)) {
        return parent.getListType();
      }
    }

    node = node.getParent();
  }

  return null;
}

function getSelectedAlignment(selection) {
  let element = getSelectedBlockElement(selection);

  if ($isListItemNode(element)) {
    element = element.getParent();
  }

  return $isElementNode(element) ? element.getFormatType() : "";
}

function normalizeFontFamily(value) {
  const raw = value.toLowerCase();

  if (raw.includes("playfair")) {
    return "playfair";
  }

  if (raw.includes("merriweather")) {
    return "merriweather";
  }

  if (raw.includes("lora")) {
    return "lora";
  }

  if (raw.includes("inter")) {
    return "inter";
  }

  if (raw.includes("source serif")) {
    return "source-serif";
  }

  if (raw.includes("fraunces")) {
    return "fraunces";
  }

  return "manrope";
}

function rgbToHex(value) {
  if (!value) {
    return DEFAULT_TEXT_COLOR;
  }

  if (value.startsWith("#")) {
    return value;
  }

  const match = value.match(/\d+/g);
  if (!match || match.length < 3) {
    return DEFAULT_TEXT_COLOR;
  }

  return `#${match
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function applySelectionStyle(patch) {
  editor.focus();
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $patchStyleText(selection, patch);
    }
  });
}

function updateLogo(source) {
  currentLogoDataUrl = source || "";

  if (currentLogoDataUrl) {
    logoImage.src = currentLogoDataUrl;
  } else {
    logoImage.removeAttribute("src");
  }
}

function initializeFormDefaults() {
  headerLabelInput.value = DEFAULT_HEADER_LABEL;
  headerTitleInput.value = DEFAULT_HEADER_TITLE;
  footerTextInput.value = DEFAULT_FOOTER_TEXT;
  headerColorInput.value = DEFAULT_HEADER_COLOR;
  footerColorInput.value = DEFAULT_FOOTER_COLOR;
  placeInput.placeholder = DEFAULT_PLACE_TEXT;
  updateLogo(DEFAULT_LOGO_URL);
}

function getBrandingState() {
  return {
    headerLabel: headerLabelInput.value.trim() || DEFAULT_HEADER_LABEL,
    headerTitle: headerTitleInput.value.trim() || DEFAULT_HEADER_TITLE,
    footerText: footerTextInput.value.trim() || DEFAULT_FOOTER_TEXT,
    headerColor: headerColorInput.value || DEFAULT_HEADER_COLOR,
    footerColor: footerColorInput.value || DEFAULT_FOOTER_COLOR,
    dateText: dateInput.value ? formatDateDisplay(dateInput.value) : "",
    placeText: placeInput.value.trim(),
  };
}

function isIgnorableNode(node) {
  return node.nodeType === Node.COMMENT_NODE || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim());
}

function hasMeaningfulContent(node) {
  if (!node) {
    return false;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.length > 0;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  return node.childNodes.length > 0 || node.textContent.trim().length > 0;
}

function isOverflowing(container) {
  return container.scrollHeight > container.clientHeight + 1;
}

function tokenizeText(text) {
  return text.match(/\S+\s*|\s+/g) || [text];
}

function splitTextNodeToFit(textNode, parent, measureContainer) {
  const tokens = tokenizeText(textNode.textContent || "");
  let low = 1;
  let high = tokens.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const probe = document.createTextNode(tokens.slice(0, mid).join(""));
    parent.append(probe);

    if (isOverflowing(measureContainer)) {
      probe.remove();
      high = mid - 1;
    } else {
      probe.remove();
      best = mid;
      low = mid + 1;
    }
  }

  if (best === 0) {
    return textNode.cloneNode(true);
  }

  parent.append(document.createTextNode(tokens.slice(0, best).join("")));
  const remainderText = tokens.slice(best).join("");
  return remainderText ? document.createTextNode(remainderText) : null;
}

function appendNodeWithinPage(node, parent, measureContainer) {
  if (isIgnorableNode(node)) {
    return null;
  }

  const fullClone = node.cloneNode(true);
  parent.append(fullClone);

  if (!isOverflowing(measureContainer)) {
    return null;
  }

  fullClone.remove();

  if (node.nodeType === Node.TEXT_NODE) {
    return splitTextNodeToFit(node, parent, measureContainer);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.cloneNode(true);
  }

  const fittedElement = node.cloneNode(false);
  const overflowElement = node.cloneNode(false);
  parent.append(fittedElement);

  let overflowStarted = false;

  for (const child of Array.from(node.childNodes)) {
    if (overflowStarted) {
      overflowElement.append(child.cloneNode(true));
      continue;
    }

    const overflowChild = appendNodeWithinPage(child, fittedElement, measureContainer);
    if (overflowChild) {
      overflowStarted = true;
      overflowElement.append(overflowChild);
    }
  }

  if (!hasMeaningfulContent(fittedElement)) {
    fittedElement.remove();
  }

  return hasMeaningfulContent(overflowElement) ? overflowElement : null;
}

function createPreviewPage(includeMeta, branding) {
  const page = document.createElement("article");
  page.className = "a4-page";
  page.style.setProperty("--header", branding.headerColor);
  page.style.setProperty("--footer", branding.footerColor);

  page.innerHTML = `
    <header class="page-header">
      <div class="brand-lockup">
        <img class="brand-logo" alt="Uploaded brand logo">
        <div class="brand-copy">
          <p class="brand-kicker"></p>
          <h2 class="preview-page-title"></h2>
        </div>
      </div>
    </header>
    <section class="page-body${includeMeta ? "" : " page-body--continued"}">
      ${includeMeta ? `
        <div class="meta-row">
          <div class="meta-card">
            <span class="meta-label">Date</span>
            <strong class="preview-page-date"></strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">Place</span>
            <strong class="preview-page-place"></strong>
          </div>
        </div>
      ` : ""}
      <div class="preview-page-message rich-text-content"></div>
    </section>
    <footer class="page-footer">
      <p class="preview-page-footer"></p>
    </footer>
  `;

  const brandLockup = page.querySelector(".brand-lockup");
  const brandLogo = page.querySelector(".brand-logo");
  if (currentLogoDataUrl) {
    brandLogo.src = currentLogoDataUrl;
    brandLogo.hidden = false;
    brandLockup.classList.remove("brand-lockup--no-logo");
  } else {
    brandLogo.hidden = true;
    brandLogo.removeAttribute("src");
    brandLockup.classList.add("brand-lockup--no-logo");
  }
  page.querySelector(".brand-kicker").textContent = branding.headerLabel;
  page.querySelector(".preview-page-title").textContent = branding.headerTitle;
  page.querySelector(".preview-page-footer").textContent = branding.footerText;

  if (includeMeta) {
    page.querySelector(".preview-page-date").textContent = branding.dateText;
    page.querySelector(".preview-page-place").textContent = branding.placeText;
  }

  return {
    root: page,
    message: page.querySelector(".preview-page-message"),
  };
}

function buildSourceNodes(previewHtml) {
  const source = document.createElement("div");
  source.innerHTML = previewHtml || '<p class="preview-empty">Type your message here.</p>';
  return Array.from(source.childNodes).filter((node) => !isIgnorableNode(node));
}

function paginatePreview(previewHtml) {
  const branding = getBrandingState();
  const sourceNodes = buildSourceNodes(previewHtml);

  previewPages.replaceChildren();

  let currentPage = createPreviewPage(true, branding);
  previewPages.append(currentPage.root);

  function placeNode(node, allowPageAdvance = true) {
    const beforeCount = currentPage.message.childNodes.length;
    const overflowNode = appendNodeWithinPage(node, currentPage.message, currentPage.message);

    if (!overflowNode) {
      return;
    }

    if (currentPage.message.childNodes.length === beforeCount) {
      if (allowPageAdvance) {
        currentPage = createPreviewPage(false, branding);
        previewPages.append(currentPage.root);
        placeNode(node, false);
        return;
      }

      currentPage.message.append(node.cloneNode(true));
      return;
    }

    currentPage = createPreviewPage(false, branding);
    previewPages.append(currentPage.root);
    placeNode(overflowNode, false);
  }

  for (const node of sourceNodes) {
    placeNode(node);
  }
}

function handleLogoUpload() {
  const [file] = logoUploadInput.files || [];
  if (!file) {
    updateLogo("");
    syncPreview();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    updateLogo(result);
    syncPreview();
  });
  reader.readAsDataURL(file);
}

function updateToolbarState(editorState = editor.getEditorState()) {
  editorState.read(() => {
    const selection = $getSelection();
    const canFormat = $isRangeSelection(selection);

    setButtonState(boldButton, canFormat && selection.hasFormat("bold"));
    setButtonState(italicButton, canFormat && selection.hasFormat("italic"));
    setButtonState(underlineButton, canFormat && selection.hasFormat("underline"));

    if (!canFormat) {
      setButtonState(alignLeftButton, false);
      setButtonState(alignCenterButton, false);
      setButtonState(alignRightButton, false);
      setButtonState(bulletListButton, false);
      setButtonState(numberListButton, false);
      setFontFamilyControl(DEFAULT_FONT_FAMILY);
      fontSizeInput.value = DEFAULT_FONT_SIZE;
      textColorInput.value = DEFAULT_TEXT_COLOR;
      return;
    }

    const alignment = getSelectedAlignment(selection);
    const listType = getSelectedListType(selection);
    const selectedFontFamily = normalizeFontFamily(
      $getSelectionStyleValueForProperty(selection, "font-family", FONT_FAMILY_PRESETS[DEFAULT_FONT_FAMILY].style),
    );
    const selectedFontSize = $getSelectionStyleValueForProperty(selection, "font-size", DEFAULT_FONT_SIZE) || DEFAULT_FONT_SIZE;
    const selectedTextColor = rgbToHex($getSelectionStyleValueForProperty(selection, "color", DEFAULT_TEXT_COLOR));

    setButtonState(alignLeftButton, alignment === "" || alignment === "left" || alignment === "start");
    setButtonState(alignCenterButton, alignment === "center");
    setButtonState(alignRightButton, alignment === "right" || alignment === "end");
    setButtonState(bulletListButton, listType === "bullet");
    setButtonState(numberListButton, listType === "number");

    setFontFamilyControl(selectedFontFamily);
    fontSizeInput.value = selectedFontSize;
    textColorInput.value = selectedTextColor;
  });
}

function syncPreview() {
  const editorState = editor.getEditorState();
  currentMessage = getMessageText(editorState);

  let previewHtml = "";
  editorState.read(() => {
    previewHtml = $generateHtmlFromNodes(editor, null);
  });

  editorPlaceholder.hidden = Boolean(currentMessage);
  paginatePreview(previewHtml);
}

async function waitForAssets() {
  await Promise.all([
    !currentLogoDataUrl || logoImage.complete
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          logoImage.addEventListener("load", resolve, { once: true });
          logoImage.addEventListener("error", () => reject(new Error("Logo could not be loaded.")), { once: true });
        }),
    document.fonts?.ready ?? Promise.resolve(),
  ]);
}

function sanitizePdfHtml(html) {
  const source = document.createElement("div");
  source.innerHTML = html || '<p class="preview-empty">Type your message here.</p>';

  source.querySelectorAll("*").forEach((element) => {
    element.style.removeProperty("font-family");
    element.style.removeProperty("background");
    element.style.removeProperty("background-color");
  });

  return source.innerHTML;
}

async function resolvePdfLogo() {
  if (!currentLogoDataUrl) {
    return null;
  }

  if (currentLogoDataUrl.startsWith("data:")) {
    return currentLogoDataUrl;
  }

  const response = await fetch(currentLogoDataUrl);
  if (!response.ok) {
    throw new Error("Logo could not be loaded for the PDF.");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : null));
    reader.addEventListener("error", () => reject(new Error("Logo could not be read for the PDF.")));
    reader.readAsDataURL(blob);
  });
}

function buildPdfHeader(branding, pageSize, logoDataUrl) {
  const headerStack = [
    {
      text: branding.headerLabel.toUpperCase(),
      fontSize: 10,
      bold: true,
      characterSpacing: 2.4,
      color: "#d8e0eb",
      margin: [0, 0, 0, 8],
    },
    {
      text: branding.headerTitle,
      fontSize: 26,
      bold: true,
      color: "#ffffff",
      lineHeight: 1.05,
    },
  ];

  return {
    margin: [0, 0, 0, 0],
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: pageSize.width,
            h: 8,
            color: DEFAULT_ACCENT_COLOR,
          },
          {
            type: "rect",
            x: 0,
            y: 8,
            w: pageSize.width,
            h: 106,
            color: branding.headerColor,
          },
          {
            type: "line",
            x1: 42,
            y1: 96,
            x2: pageSize.width - 42,
            y2: 96,
            lineWidth: 1,
            lineColor: "#415265",
          },
        ],
      },
      logoDataUrl
        ? {
            absolutePosition: { x: 42, y: 30 },
            columns: [
              {
                image: logoDataUrl,
                fit: [48, 48],
                width: 48,
                margin: [0, 0, 14, 0],
              },
              {
                width: "*",
                stack: headerStack,
                margin: [0, 2, 0, 0],
              },
            ],
          }
        : {
            absolutePosition: { x: 42, y: 32 },
            stack: headerStack,
          },
    ],
  };
}

function buildPdfFooter(branding, currentPage, pageCount, pageSize) {
  return {
    margin: [0, 0, 0, 0],
    stack: [
      {
        canvas: [
          {
            type: "line",
            x1: 42,
            y1: 0,
            x2: pageSize.width - 42,
            y2: 0,
            lineWidth: 2,
            lineColor: branding.footerColor,
          },
        ],
      },
      {
        margin: [42, 12, 42, 0],
        columns: [
          {
            width: "*",
            text: branding.footerText,
            color: branding.footerColor,
            fontSize: 9,
            characterSpacing: 0.5,
          },
          {
            width: "auto",
            text: `${currentPage} / ${pageCount}`,
            alignment: "right",
            color: "#8f949d",
            fontSize: 9,
            bold: true,
          },
        ],
      },
    ],
  };
}

function buildPdfMeta(branding) {
  return {
    columns: [
      {
        width: "*",
        stack: [
          { text: "DATE", fontSize: 10, bold: true, color: "#8f949d", characterSpacing: 2, margin: [0, 0, 0, 6] },
          { text: branding.dateText, fontSize: 16, bold: true, color: "#27313d" },
          {
            canvas: [{ type: "line", x1: 0, y1: 12, x2: 235, y2: 12, lineWidth: 1, lineColor: "#cfd4dc" }],
            margin: [0, 8, 0, 0],
          },
        ],
      },
      { width: 24, text: "" },
      {
        width: "*",
        stack: [
          { text: "PLACE", fontSize: 10, bold: true, color: "#8f949d", characterSpacing: 2, margin: [0, 0, 0, 6] },
          { text: branding.placeText, fontSize: 16, bold: true, color: "#27313d" },
          {
            canvas: [{ type: "line", x1: 0, y1: 12, x2: 235, y2: 12, lineWidth: 1, lineColor: "#cfd4dc" }],
            margin: [0, 8, 0, 0],
          },
        ],
      },
    ],
    margin: [0, 0, 0, 24],
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character] || character;
  });
}

function renderPdfInWindow(pdfWindow, blobUrl, filename) {
  const safeTitle = escapeHtml(filename);
  pdfWindow.document.open();
  pdfWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: #1c2330;
    }

    iframe {
      border: 0;
      width: 100%;
      height: 100%;
      display: block;
      background: #1c2330;
    }
  </style>
</head>
<body>
  <iframe src="${blobUrl}" title="${safeTitle}"></iframe>
</body>
</html>`);
  pdfWindow.document.close();
}

function triggerPdfDownload(blob, filename, pendingWindow = null) {
  const blobUrl = URL.createObjectURL(blob);
  const pdfWindow = pendingWindow || window.open("", "_blank");

  if (pdfWindow) {
    renderPdfInWindow(pdfWindow, blobUrl, filename);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return "PDF opened in a new tab.";
  }

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
  return "PDF download started instead because a new tab was blocked.";
}

async function printPdf() {
  printButton.disabled = true;
  statusMessage.textContent = "Generating PDF...";
  const pendingWindow = window.open("", "_blank");

  try {
    const [{ default: htmlToPdfmake }, { default: pdfMake }, { default: pdfFonts }] = await Promise.all([
      import("html-to-pdfmake"),
      import("pdfmake/build/pdfmake.js"),
      import("pdfmake/build/vfs_fonts.js"),
    ]);

    pdfMake.addVirtualFileSystem(pdfFonts);
    await waitForAssets();

    const branding = getBrandingState();
    let previewHtml = "";
    editor.getEditorState().read(() => {
      previewHtml = $generateHtmlFromNodes(editor, null);
    });

    const logoDataUrl = await resolvePdfLogo();
    const messageContent = htmlToPdfmake(sanitizePdfHtml(previewHtml), { window });
    const contentBlocks = Array.isArray(messageContent) ? messageContent : [messageContent];

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [42, 132, 42, 56],
      defaultStyle: {
        font: "Roboto",
        color: "#27313d",
        lineHeight: 1.35,
      },
      header: (currentPage, pageCount, pageSize) => buildPdfHeader(branding, pageSize, logoDataUrl),
      footer: (currentPage, pageCount, pageSize) => buildPdfFooter(branding, currentPage, pageCount, pageSize),
      content: [
        buildPdfMeta(branding),
        ...contentBlocks,
      ],
    };

    const blob = await pdfMake.createPdf(docDefinition).getBlob();
    statusMessage.textContent = triggerPdfDownload(blob, "notepad-sheet.pdf", pendingWindow);
  } catch (error) {
    if (pendingWindow) {
      pendingWindow.close();
    }
    console.error(error);
    statusMessage.textContent = "Could not generate the PDF.";
  } finally {
    printButton.disabled = false;
  }
}


editor.registerUpdateListener(({ editorState }) => {
  syncPreview();
  updateToolbarState(editorState);
});

editor.registerCommand(
  SELECTION_CHANGE_COMMAND,
  () => {
    updateToolbarState();
    return false;
  },
  COMMAND_PRIORITY_LOW,
);

editor.registerCommand(
  CAN_UNDO_COMMAND,
  (payload) => {
    undoButton.disabled = !payload;
    return false;
  },
  COMMAND_PRIORITY_LOW,
);

editor.registerCommand(
  CAN_REDO_COMMAND,
  (payload) => {
    redoButton.disabled = !payload;
    return false;
  },
  COMMAND_PRIORITY_LOW,
);

messageEditor.addEventListener("focus", () => {
  messageEditorShell.classList.add("is-focused");
});

messageEditor.addEventListener("blur", () => {
  messageEditorShell.classList.remove("is-focused");
});

headerLabelInput.addEventListener("input", syncPreview);
headerTitleInput.addEventListener("input", syncPreview);
footerTextInput.addEventListener("input", syncPreview);
headerColorInput.addEventListener("input", syncPreview);
footerColorInput.addEventListener("input", syncPreview);
logoUploadInput.addEventListener("change", handleLogoUpload);
dateInput.addEventListener("input", syncPreview);
placeInput.addEventListener("input", syncPreview);
fontFamilyButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleFontFamilyMenu();
});
fontFamilyOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();
    const selectedFont = option.dataset.fontFamily || DEFAULT_FONT_FAMILY;
    applySelectionStyle({ "font-family": FONT_FAMILY_PRESETS[selectedFont].style });
    setFontFamilyControl(selectedFont);
    closeFontFamilyMenu();
  });
});
fontSizeInput.addEventListener("change", () => {
  applySelectionStyle({ "font-size": fontSizeInput.value });
});
textColorInput.addEventListener("input", () => {
  applySelectionStyle({ color: textColorInput.value });
});

printButton.addEventListener("click", printPdf);
mobileToolbarToggle.addEventListener("click", () => {
  isMobileToolbarCollapsed = !isMobileToolbarCollapsed;
  applyMobileToolbarState();
});

[
  fontFamilyButton,
  boldButton,
  italicButton,
  underlineButton,
  alignLeftButton,
  alignCenterButton,
  alignRightButton,
  bulletListButton,
  numberListButton,
  undoButton,
  redoButton,
  clearButton,
].forEach(preserveSelectionOnMouseDown);

fontFamilyOptions.forEach(preserveSelectionOnMouseDown);

boldButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_TEXT_COMMAND, "bold"));
italicButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_TEXT_COMMAND, "italic"));
underlineButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_TEXT_COMMAND, "underline"));
alignLeftButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_ELEMENT_COMMAND, "left"));
alignCenterButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_ELEMENT_COMMAND, "center"));
alignRightButton.addEventListener("click", () => dispatchEditorCommand(FORMAT_ELEMENT_COMMAND, "right"));
bulletListButton.addEventListener("click", () => {
  if (bulletListButton.classList.contains("is-active")) {
    dispatchEditorCommand(REMOVE_LIST_COMMAND);
  } else {
    dispatchEditorCommand(INSERT_UNORDERED_LIST_COMMAND);
  }
});
numberListButton.addEventListener("click", () => {
  if (numberListButton.classList.contains("is-active")) {
    dispatchEditorCommand(REMOVE_LIST_COMMAND);
  } else {
    dispatchEditorCommand(INSERT_ORDERED_LIST_COMMAND);
  }
});
undoButton.addEventListener("click", () => dispatchEditorCommand(UNDO_COMMAND));
redoButton.addEventListener("click", () => dispatchEditorCommand(REDO_COMMAND));
clearButton.addEventListener("click", () => {
  editor.focus();
  editor.update(() => {
    $getRoot().clear();
  });
});

document.addEventListener("click", (event) => {
  if (!fontFamilyMenu.contains(event.target) && !fontFamilyButton.contains(event.target)) {
    closeFontFamilyMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFontFamilyMenu();
  }
});

mobileToolbarMedia.addEventListener("change", (event) => {
  isMobileToolbarCollapsed = event.matches;
  applyMobileToolbarState();
});

undoButton.disabled = true;
redoButton.disabled = true;
initializeFormDefaults();
setInitialMessage(DEFAULT_MESSAGE);
updateLogo(currentLogoDataUrl);
syncPreview();
updateToolbarState();
setFontFamilyControl(DEFAULT_FONT_FAMILY);
applyMobileToolbarState();
