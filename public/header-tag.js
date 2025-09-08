let conversationHistory = [];
let isMessageBeingSent = false;
let userId;

const generateUserId = () => {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
};

const loadConversationHistory = (user_id) => {
  conversationHistory = [];
};

const saveConversationHistory = () => {
  // TODO: Implement later
};

// Start a new chat
function startNewChat() {
  // Clear conversation history
  conversationHistory = [];
  saveConversationHistory();

  // Clear the messages display
  const messages = document.getElementById("chat-messages");
  if (messages) {
    messages.innerHTML = "";
    // Add welcome message
    const welcomeMsg = document.createElement("div");
    welcomeMsg.style.margin = `0 0 ${constants.MARGIN_LARGE} 0`;
    welcomeMsg.style.padding = constants.PADDING_LARGE;
    welcomeMsg.style.background = constants.CONTAINER_BG;
    welcomeMsg.style.borderRadius = constants.BORDER_RADIUS_SMALL;
    welcomeMsg.style.boxShadow = `0 2px 8px ${constants.SHADOW_COLOR_MEDIUM}`;
    welcomeMsg.style.border = `1px solid ${constants.BORDER_COLOR}`;
    welcomeMsg.innerHTML = `
      <div style="display: flex; align-items: center; gap: ${constants.MARGIN_SMALL}; margin-bottom: ${constants.MARGIN_SMALL};">
        <div style="width: 32px; height: 32px; background: ${constants.PRIMARY_COLOR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: ${constants.FONT_SIZE_MEDIUM};">🦷</div>
        <div style="font-weight: 600; color: ${constants.PRIMARY_TEXT};">Hi there!</div>
      </div>
      <div style="color: ${constants.SECONDARY_TEXT}; line-height: 1.6;">${constants.WELCOME_MESSAGE}</div>
    `;
    messages.appendChild(welcomeMsg);
  }
}

const constants = {
  // Text content
  HEADER_TEXT: "BrightSmile Dental Clinic",
  HEADER_SUBTEXT: "Your dental care assistant",
  WELCOME_MESSAGE:
    "Hello! Welcome to BrightSmile Dental Clinic. I'm here to help you with appointment scheduling, dental care questions, and information about our services. How can I assist you today?",
  INPUT_PLACEHOLDER: "Ask about appointments, treatments, or dental care...",
  SEND_BUTTON_TEXT: "Send",
  SEND_BUTTON_ICON: "💬",

  // API Configuration
  API_URL: "/chat",

  // Chatbot SVG Icon - Enhanced design
  CHATBOT_ICON: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 119.35"><title>chatbot</title><path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z"/></svg>`,

  // Color scheme - Dental/Healthcare theme
  PRIMARY_COLOR: "#10b981", // Emerald green - associated with health and nature
  PRIMARY_COLOR_HOVER: "#059669",
  PRIMARY_COLOR_LIGHT: "#d1fae5",

  // Background colors - Clean medical theme
  CONTAINER_BG: "#ffffff",
  MESSAGES_BG: "#f0fdf4", // Very light green tint
  INPUT_BG: "#f0fdf4",
  INPUT_BG_FOCUS: "#ffffff",

  // Text colors - Professional medical theme
  PRIMARY_TEXT: "#064e3b", // Dark green for better contrast
  SECONDARY_TEXT: "#6b7280",
  WHITE_TEXT: "#ffffff",

  // Border colors
  BORDER_COLOR: "#d1d5db",
  BORDER_COLOR_FOCUS: "#10b981",

  // Shadow colors - Green theme
  SHADOW_COLOR: "rgba(0,0,0,0.12)",
  SHADOW_COLOR_LIGHT: "rgba(0,0,0,0.08)",
  SHADOW_COLOR_MEDIUM: "rgba(0,0,0,0.06)",
  PRIMARY_SHADOW: "rgba(16, 185, 129, 0.3)",
  PRIMARY_SHADOW_HOVER: "rgba(16, 185, 129, 0.4)",
  PRIMARY_SHADOW_FOCUS: "rgba(16, 185, 129, 0.1)",

  // Typing indicator colors
  TYPING_DOT_COLOR: "#a7f3d0",

  // Dimensions
  CONTAINER_WIDTH: "350px",
  CONTAINER_HEIGHT: "500px",
  CONTAINER_WIDTH_EXPANDED: "600px",
  CONTAINER_HEIGHT_EXPANDED: "700px",
  ICON_SIZE: "60px",
  BORDER_RADIUS: "16px",
  BORDER_RADIUS_SMALL: "12px",
  BORDER_RADIUS_ROUND: "24px",
  BORDER_RADIUS_CIRCLE: "50%",

  // Spacing
  PADDING_SMALL: "8px",
  PADDING_MEDIUM: "12px",
  PADDING_LARGE: "16px",
  PADDING_XLARGE: "20px",
  MARGIN_SMALL: "8px",
  MARGIN_MEDIUM: "12px",
  MARGIN_LARGE: "16px",

  // Font sizes
  FONT_SIZE_SMALL: "12px",
  FONT_SIZE_MEDIUM: "14px",
  FONT_SIZE_LARGE: "16px",
  FONT_SIZE_XLARGE: "20px",
};

const loadUI = () => {
  // Create main container
  const container = document.createElement("div");
  container.id = "my-chat-widget";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "99999";
  container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Create floating icon button (initially visible)
  const iconButton = document.createElement("div");
  iconButton.id = "chat-icon-button";
  iconButton.style.width = constants.ICON_SIZE;
  iconButton.style.height = constants.ICON_SIZE;
  iconButton.style.background = constants.PRIMARY_COLOR;
  iconButton.style.borderRadius = constants.BORDER_RADIUS_CIRCLE;
  iconButton.style.display = "flex";
  iconButton.style.alignItems = "center";
  iconButton.style.justifyContent = "center";
  iconButton.style.cursor = "pointer";
  iconButton.style.boxShadow = `0 4px 12px ${constants.PRIMARY_SHADOW}`;
  iconButton.style.transition = "all 0.3s ease";
  iconButton.innerHTML = constants.CHATBOT_ICON;

  // Style the SVG icon
  const svg = iconButton.querySelector("svg");
  if (svg) {
    svg.style.width = "32px";
    svg.style.height = "32px";
    svg.style.fill = constants.WHITE_TEXT;
  }

  // Create chat container (initially hidden)
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-container";
  chatContainer.style.width = constants.CONTAINER_WIDTH;
  chatContainer.style.height = constants.CONTAINER_HEIGHT;
  chatContainer.style.border = "none";
  chatContainer.style.borderRadius = constants.BORDER_RADIUS;
  chatContainer.style.background = constants.CONTAINER_BG;
  chatContainer.style.boxShadow = `0 8px 32px ${constants.SHADOW_COLOR}, 0 4px 16px ${constants.SHADOW_COLOR_LIGHT}`;
  chatContainer.style.display = "none";
  chatContainer.style.flexDirection = "column";
  chatContainer.style.overflow = "hidden";
  chatContainer.style.transition = "all 0.3s ease";

  // Header
  const header = document.createElement("div");
  header.style.background = constants.PRIMARY_COLOR;
  header.style.color = constants.WHITE_TEXT;
  header.style.padding = `${constants.PADDING_LARGE} ${constants.PADDING_XLARGE}`;
  header.style.fontWeight = "600";
  header.style.fontSize = constants.FONT_SIZE_LARGE;
  header.style.textAlign = "left";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.boxShadow = `0 2px 8px ${constants.SHADOW_COLOR_MEDIUM}`;

  const headerLeft = document.createElement("div");
  headerLeft.style.display = "flex";
  headerLeft.style.alignItems = "center";
  headerLeft.style.gap = constants.MARGIN_MEDIUM;

  const headerIcon = document.createElement("div");
  headerIcon.innerHTML = constants.CHATBOT_ICON;
  headerIcon.style.fontSize = constants.FONT_SIZE_XLARGE;

  // Style the header SVG icon
  const headerSvg = headerIcon.querySelector("svg");
  if (headerSvg) {
    headerSvg.style.width = "20px";
    headerSvg.style.height = "20px";
    headerSvg.style.fill = constants.WHITE_TEXT;
  }

  const headerText = document.createElement("div");
  headerText.innerHTML = `<div>${constants.HEADER_TEXT}</div><div style='font-size: ${constants.FONT_SIZE_SMALL}; opacity: 0.9; font-weight: 400;'>${constants.HEADER_SUBTEXT}</div>`;

  // Resize button - only show on desktop
  const resizeButton = document.createElement("div");
  resizeButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 42H6V26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26 6H42V22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  resizeButton.style.cursor = "pointer";
  resizeButton.style.display = "flex";
  resizeButton.style.alignItems = "center";
  resizeButton.style.justifyContent = "center";
  resizeButton.style.opacity = "0.8";
  resizeButton.style.transition = "opacity 0.2s ease";
  resizeButton.style.marginRight = constants.MARGIN_SMALL;

  // Hide resize button on mobile devices
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    resizeButton.style.display = "none";
  }

  resizeButton.addEventListener("mouseenter", () => {
    resizeButton.style.opacity = "1";
  });

  resizeButton.addEventListener("mouseleave", () => {
    resizeButton.style.opacity = "0.8";
  });

  // Close button
  const closeButton = document.createElement("div");
  closeButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
    </svg>
  `;
  closeButton.style.cursor = "pointer";
  closeButton.style.display = "flex";
  closeButton.style.alignItems = "center";
  closeButton.style.justifyContent = "center";
  closeButton.style.opacity = "0.8";
  closeButton.style.transition = "opacity 0.2s ease";

  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.opacity = "1";
  });

  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.opacity = "0.8";
  });

  headerLeft.appendChild(headerIcon);
  headerLeft.appendChild(headerText);
  header.appendChild(headerLeft);

  const headerRight = document.createElement("div");
  headerRight.style.display = "flex";
  headerRight.style.alignItems = "center";
  headerRight.appendChild(resizeButton);
  headerRight.appendChild(closeButton);

  header.appendChild(headerRight);
  chatContainer.appendChild(header);

  // Messages area
  const messages = document.createElement("div");
  messages.id = "chat-messages";
  messages.style.flex = "1";
  messages.style.padding = constants.PADDING_XLARGE;
  messages.style.overflowY = "auto";
  messages.style.background = constants.MESSAGES_BG;
  messages.style.fontSize = constants.FONT_SIZE_MEDIUM;
  messages.style.lineHeight = "1.5";

  // Welcome message with better styling
  const welcomeMsg = document.createElement("div");
  welcomeMsg.style.margin = `0 0 ${constants.MARGIN_LARGE} 0`;
  welcomeMsg.style.padding = constants.PADDING_LARGE;
  welcomeMsg.style.background = constants.CONTAINER_BG;
  welcomeMsg.style.borderRadius = constants.BORDER_RADIUS_SMALL;
  welcomeMsg.style.boxShadow = `0 2px 8px ${constants.SHADOW_COLOR_MEDIUM}`;
  welcomeMsg.style.border = `1px solid ${constants.BORDER_COLOR}`;
  welcomeMsg.innerHTML = `
      <div style="display: flex; align-items: center; gap: ${constants.MARGIN_SMALL}; margin-bottom: ${constants.MARGIN_SMALL};">
        <div style="width: 32px; height: 32px; background: ${constants.PRIMARY_COLOR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: ${constants.FONT_SIZE_MEDIUM};">🦷</div>
        <div style="font-weight: 600; color: ${constants.PRIMARY_TEXT};">Welcome to BrightSmile!</div>
      </div>
    <div style="color: ${constants.SECONDARY_TEXT}; line-height: 1.6;">${constants.WELCOME_MESSAGE}</div>
  `;
  messages.appendChild(welcomeMsg);
  chatContainer.appendChild(messages);

  // Input area
  const inputBox = document.createElement("div");
  inputBox.style.display = "flex";
  inputBox.style.gap = constants.MARGIN_MEDIUM;
  inputBox.style.padding = constants.PADDING_XLARGE;
  inputBox.style.background = constants.CONTAINER_BG;
  inputBox.style.borderTop = `1px solid ${constants.BORDER_COLOR}`;
  inputBox.style.alignItems = "center";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = constants.INPUT_PLACEHOLDER;
  input.style.flex = "1";
  input.style.border = `1px solid ${constants.BORDER_COLOR}`;
  input.style.borderRadius = constants.BORDER_RADIUS_ROUND;
  input.style.padding = `${constants.PADDING_MEDIUM} ${constants.PADDING_XLARGE}`;
  input.style.fontSize = constants.FONT_SIZE_MEDIUM;
  input.style.outline = "none";
  input.style.transition = "all 0.2s ease";
  input.style.background = constants.INPUT_BG;

  // Input focus effects
  input.addEventListener("focus", () => {
    input.style.borderColor = constants.BORDER_COLOR_FOCUS;
    input.style.background = constants.INPUT_BG_FOCUS;
    input.style.boxShadow = `0 0 0 3px ${constants.PRIMARY_SHADOW_FOCUS}`;
  });

  input.addEventListener("blur", () => {
    input.style.borderColor = constants.BORDER_COLOR;
    input.style.background = constants.INPUT_BG;
    input.style.boxShadow = "none";
  });

  const button = document.createElement("button");
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  button.style.background = constants.PRIMARY_COLOR;
  button.style.color = constants.WHITE_TEXT;
  button.style.border = "none";
  button.style.borderRadius = constants.BORDER_RADIUS_CIRCLE;
  button.style.width = "44px";
  button.style.height = "44px";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.cursor = "pointer";
  button.style.transition = "all 0.2s ease";
  button.style.boxShadow = `0 4px 12px ${constants.PRIMARY_SHADOW}`;

  // Button hover effects
  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-2px)";
    button.style.background = constants.PRIMARY_COLOR_HOVER;
    button.style.boxShadow = `0 6px 20px ${constants.PRIMARY_SHADOW_HOVER}`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0)";
    button.style.background = constants.PRIMARY_COLOR;
    button.style.boxShadow = `0 4px 12px ${constants.PRIMARY_SHADOW}`;
  });

  inputBox.appendChild(input);
  inputBox.appendChild(button);
  chatContainer.appendChild(inputBox);

  // Append both containers to main container
  container.appendChild(iconButton);
  container.appendChild(chatContainer);

  // Append main container to body
  window.document.body.appendChild(container);

  // Toggle functionality
  iconButton.addEventListener("click", () => {
    iconButton.style.display = "none";
    chatContainer.style.display = "flex";

    // Load and display previous messages
    loadPreviousMessages();
  });

  closeButton.addEventListener("click", () => {
    chatContainer.style.display = "none";
    iconButton.style.display = "flex";
  });

  // Resize functionality
  let isExpanded = false;
  resizeButton.addEventListener("click", () => {
    if (isExpanded) {
      chatContainer.style.width = constants.CONTAINER_WIDTH;
      chatContainer.style.height = constants.CONTAINER_HEIGHT;
      resizeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 42H6V26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M26 6H42V22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      isExpanded = false;
    } else {
      chatContainer.style.width = constants.CONTAINER_WIDTH_EXPANDED;
      chatContainer.style.height = constants.CONTAINER_HEIGHT_EXPANDED;
      resizeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 20H28V4" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 28H20V44" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      isExpanded = true;
    }
  });

  // Message functionality
  button.addEventListener("click", () => sendMessage(input, messages));
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage(input, messages);
  });

  // Handle window resize for mobile/desktop switching
  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      resizeButton.style.display = "none";
      // Reset to normal size on mobile
      if (isExpanded) {
        chatContainer.style.width = constants.CONTAINER_WIDTH;
        chatContainer.style.height = constants.CONTAINER_HEIGHT;
        isExpanded = false;
      }
    } else {
      resizeButton.style.display = "flex";
    }
  });
};

// Load and display previous messages from current chat
function loadPreviousMessages() {
  const messages = document.getElementById("chat-messages");
  if (!messages) return;

  // Clear existing messages (except welcome message)
  const welcomeMsg = messages.querySelector("div:first-child");
  messages.innerHTML = "";
  if (welcomeMsg) {
    messages.appendChild(welcomeMsg);
  }

  // Load messages from conversation history
  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      if (msg.type === "user") {
        // Display user message
        const userMsg = document.createElement("div");
        userMsg.style.margin = `${constants.MARGIN_LARGE} 0`;
        userMsg.style.display = "flex";
        userMsg.style.justifyContent = "flex-end";

        const userBubble = document.createElement("div");
        userBubble.style.maxWidth = "80%";
        userBubble.style.padding = `${constants.PADDING_MEDIUM} ${constants.PADDING_LARGE}`;
        userBubble.style.background = constants.PRIMARY_COLOR;
        userBubble.style.color = constants.WHITE_TEXT;
        userBubble.style.borderRadius = "18px 18px 4px 18px";
        userBubble.style.fontSize = constants.FONT_SIZE_MEDIUM;
        userBubble.style.lineHeight = "1.4";
        userBubble.style.boxShadow = `0 2px 8px ${constants.PRIMARY_SHADOW}`;
        userBubble.style.wordWrap = "break-word";
        userBubble.innerText = msg.content;

        userMsg.appendChild(userBubble);
        messages.appendChild(userMsg);
      } else if (msg.type === "assistant") {
        // Display bot message
        const botMsg = document.createElement("div");
        botMsg.style.margin = `${constants.MARGIN_LARGE} 0`;
        botMsg.style.display = "flex";
        botMsg.style.alignItems = "flex-start";
        botMsg.style.gap = constants.MARGIN_MEDIUM;

        const avatar = document.createElement("div");
        avatar.style.width = "32px";
        avatar.style.height = "32px";
        avatar.style.background = constants.PRIMARY_COLOR;
        avatar.style.borderRadius = constants.BORDER_RADIUS_CIRCLE;
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.color = constants.WHITE_TEXT;
        avatar.style.fontSize = constants.FONT_SIZE_MEDIUM;
        avatar.innerHTML = constants.CHATBOT_ICON;
        avatar.style.aspectRatio = "1/1";

        const botSvg = avatar.querySelector("svg");
        if (botSvg) {
          botSvg.style.width = "16px";
          botSvg.style.height = "16px";
          botSvg.style.fill = constants.WHITE_TEXT;
        }

        const botBubble = document.createElement("div");
        botBubble.style.maxWidth = "80%";
        botBubble.style.padding = `${constants.PADDING_MEDIUM} ${constants.PADDING_LARGE}`;
        botBubble.style.background = constants.CONTAINER_BG;
        botBubble.style.color = constants.PRIMARY_TEXT;
        botBubble.style.borderRadius = "18px 18px 18px 4px";
        botBubble.style.fontSize = constants.FONT_SIZE_MEDIUM;
        botBubble.style.lineHeight = "1.4";
        botBubble.style.boxShadow = `0 2px 8px ${constants.SHADOW_COLOR_MEDIUM}`;
        botBubble.style.border = `1px solid ${constants.BORDER_COLOR}`;
        botBubble.style.wordWrap = "break-word";

        const parsedReply = parseMarkdown(msg.content);
        botBubble.innerHTML = parsedReply;

        botMsg.appendChild(avatar);
        botMsg.appendChild(botBubble);
        messages.appendChild(botMsg);
      }
    });

    // Scroll to bottom
    messages.scrollTop = messages.scrollHeight;
  }
}

function sendMessage(input, messages) {
  const text = input.value.trim();
  if (!text || isMessageBeingSent) return; // Prevent sending if already processing

  // Set loading state
  isMessageBeingSent = true;

  // Disable input and button
  const sendButton = input.parentElement.querySelector("button");
  input.disabled = true;
  input.style.opacity = "0.6";
  input.style.cursor = "not-allowed";
  if (sendButton) {
    sendButton.disabled = true;
    sendButton.style.opacity = "0.6";
    sendButton.style.cursor = "not-allowed";
  }

  // User message
  const userMsg = document.createElement("div");
  userMsg.style.margin = `${constants.MARGIN_LARGE} 0`;
  userMsg.style.display = "flex";
  userMsg.style.justifyContent = "flex-end";

  const userBubble = document.createElement("div");
  userBubble.style.maxWidth = "80%";
  userBubble.style.padding = `${constants.PADDING_MEDIUM} ${constants.PADDING_LARGE}`;
  userBubble.style.background = constants.PRIMARY_COLOR;
  userBubble.style.color = constants.WHITE_TEXT;
  userBubble.style.borderRadius = "18px 18px 4px 18px";
  userBubble.style.fontSize = constants.FONT_SIZE_MEDIUM;
  userBubble.style.lineHeight = "1.4";
  userBubble.style.boxShadow = `0 2px 8px ${constants.PRIMARY_SHADOW}`;
  userBubble.style.wordWrap = "break-word";
  userBubble.innerText = text;

  userMsg.appendChild(userBubble);
  messages.appendChild(userMsg);
  input.value = "";

  // Add user message to conversation history
  conversationHistory.push({
    type: "user",
    content: text,
    timestamp: Date.now(),
  });

  // Auto-scroll to bottom
  messages.scrollTop = messages.scrollHeight;

  // Show typing indicator
  showTypingIndicator(messages);

  // Call API with Chatbot
  callChatbotAPI(text, messages, input);
}

// Function to re-enable input and send button
function enableInput(input) {
  input.disabled = false;
  input.style.opacity = "1";
  input.style.cursor = "text";

  const sendButton = input.parentElement.querySelector("button");
  if (sendButton) {
    sendButton.disabled = false;
    sendButton.style.opacity = "1";
    sendButton.style.cursor = "pointer";
  }

  // Reset the message sending flag
  isMessageBeingSent = false;
}

async function callChatbotAPI(userMessage, messages, input) {
  try {
    const response = await fetch("https://chatbot.dental.srv580629.hstgr.cloud" + constants.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Remove typing indicator
    removeTypingIndicator(messages);

    // Show bot response with parsed markdown
    showBotResponse(messages, data.reply);

    // Re-enable input after successful response
    enableInput(input);
  } catch (error) {
    console.error("Error calling Chatbot API:", error);

    // Remove typing indicator
    removeTypingIndicator(messages);

    // Show error message
    showBotResponse(
      messages,
      "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
    );

    // Re-enable input after error response
    enableInput(input);
  }
}

function showTypingIndicator(messages) {
  const typing = document.createElement("div");
  typing.id = "typing-indicator";
  typing.style.margin = `${constants.MARGIN_LARGE} 0`;
  typing.style.display = "flex";
  typing.style.alignItems = "center";
  typing.style.gap = constants.MARGIN_SMALL;

  const avatar = document.createElement("div");
  avatar.style.width = "32px";
  avatar.style.height = "32px";
  avatar.style.background = constants.PRIMARY_COLOR;
  avatar.style.borderRadius = constants.BORDER_RADIUS_CIRCLE;
  avatar.style.display = "flex";
  avatar.style.alignItems = "center";
  avatar.style.justifyContent = "center";
  avatar.style.color = constants.WHITE_TEXT;
  avatar.style.fontSize = constants.FONT_SIZE_MEDIUM;
  avatar.innerHTML = constants.CHATBOT_ICON;

  // Style the typing indicator SVG icon
  const typingSvg = avatar.querySelector("svg");
  if (typingSvg) {
    typingSvg.style.width = "16px";
    typingSvg.style.height = "16px";
    typingSvg.style.fill = constants.WHITE_TEXT;
  }

  const dots = document.createElement("div");
  dots.style.display = "flex";
  dots.style.gap = "4px";
  dots.innerHTML = `
    <div style="width: 8px; height: 8px; background: ${constants.TYPING_DOT_COLOR}; border-radius: 50%; animation: typing 1.4s infinite ease-in-out;"></div>
    <div style="width: 8px; height: 8px; background: ${constants.TYPING_DOT_COLOR}; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.2s;"></div>
    <div style="width: 8px; height: 8px; background: ${constants.TYPING_DOT_COLOR}; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.4s;"></div>
  `;

  typing.appendChild(avatar);
  typing.appendChild(dots);
  messages.appendChild(typing);

  // Add typing animation CSS
  if (!document.getElementById("typing-animation")) {
    const style = document.createElement("style");
    style.id = "typing-animation";
    style.textContent = `
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-10px); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator(messages) {
  const typing = document.getElementById("typing-indicator");
  if (typing) {
    typing.remove();
  }
}

function showBotResponse(messages, botReply) {
  const botMsg = document.createElement("div");
  botMsg.style.margin = `${constants.MARGIN_LARGE} 0`;
  botMsg.style.display = "flex";
  botMsg.style.alignItems = "flex-start";
  botMsg.style.gap = constants.MARGIN_MEDIUM;

  const avatar = document.createElement("div");
  avatar.style.width = "32px";
  avatar.style.height = "32px";
  avatar.style.background = constants.PRIMARY_COLOR;
  avatar.style.borderRadius = constants.BORDER_RADIUS_CIRCLE;
  avatar.style.display = "flex";
  avatar.style.alignItems = "center";
  avatar.style.justifyContent = "center";
  avatar.style.color = constants.WHITE_TEXT;
  avatar.style.fontSize = constants.FONT_SIZE_MEDIUM;
  avatar.innerHTML = constants.CHATBOT_ICON;
  avatar.style.aspectRatio = "1/1";

  // Style the bot response SVG icon
  const botSvg = avatar.querySelector("svg");
  if (botSvg) {
    botSvg.style.width = "16px";
    botSvg.style.height = "16px";
    botSvg.style.fill = constants.WHITE_TEXT;
  }

  const botBubble = document.createElement("div");
  botBubble.style.maxWidth = "80%";
  botBubble.style.padding = `${constants.PADDING_MEDIUM} ${constants.PADDING_LARGE}`;
  botBubble.style.background = constants.CONTAINER_BG;
  botBubble.style.color = constants.PRIMARY_TEXT;
  botBubble.style.borderRadius = "18px 18px 18px 4px";
  botBubble.style.fontSize = constants.FONT_SIZE_MEDIUM;
  botBubble.style.lineHeight = "1.4";
  botBubble.style.boxShadow = `0 2px 8px ${constants.SHADOW_COLOR_MEDIUM}`;
  botBubble.style.border = `1px solid ${constants.BORDER_COLOR}`;
  botBubble.style.wordWrap = "break-word";

  // Parse markdown and convert to HTML
  const parsedReply = parseMarkdown(botReply);
  botBubble.innerHTML = parsedReply;

  botMsg.appendChild(avatar);
  botMsg.appendChild(botBubble);
  messages.appendChild(botMsg);

  // Add bot response to conversation history
  conversationHistory.push({
    type: "assistant",
    content: botReply,
    timestamp: Date.now(),
  });
  // Save to localStorage
  saveConversationHistory();

  messages.scrollTop = messages.scrollHeight;
}

function parseMarkdown(text) {
  if (!text) return "";

  return (
    text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>'
      )
      // Line breaks
      .replace(/\n/g, "<br>")
      // Headers (simplified)
      .replace(
        /^### (.*$)/gim,
        '<h3 style="margin: 16px 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b;">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 style="margin: 20px 0 12px 0; font-size: 20px; font-weight: 600; color: #1e293b;">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 style="margin: 24px 0 16px 0; font-size: 22px; font-weight: 600; color: #1e293b;">$1</h1>'
      )
      // Lists
      .replace(/^\* (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
      .replace(/^- (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
      // Wrap lists in ul tags (simplified)
      .replace(/(<li.*<\/li>)/g, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>')
  );
}

(function () {
  window.addEventListener("DOMContentLoaded", () => {
    if (window.bitsChatWidgetLoaded) return;
    window.bitsChatWidgetLoaded = true;
    console.log("header-tag.js loaded");
    userId = generateUserId();
    loadConversationHistory(userId);
    loadUI();
  });
})();
