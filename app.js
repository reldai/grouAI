// Employee data from the application
const employeeData = {
  name: "Nathaniel Matheson",
  id: "ID-G605",
  position: "Product Designer",
  email: "nate.matheson@grou.com",
  department: "Design",
  joinDate: "2020-01-15",
  currentAddress: "Jl. Sudirman No. 123, Jakarta",
  phone: "+62 812 3456 7890"
};

const payslipData = {
  month: "September",
  year: "2025",
  basicSalary: "Rp10,000,000",
  allowances: "Rp500,000",
  deductions: "Rp1,500,000",
  netPay: "Rp9,000,000"
};

const leaveBalances = [
  { type: "Annual Leave", remaining: 8, total: 12 },
  { type: "Sick Leave", remaining: 5, total: 12 },
  { type: "Personal Leave", remaining: 3, total: 3 }
];

// Chat state management
let isHomepageState = true;
let conversationHistory = [];

// DOM Elements
let chatMessages, messageInput, sendBtn, attachBtn, typingIndicator;
let formModal, modalTitle, modalBody, modalClose, quickActions, newChatBtn;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  chatMessages = document.getElementById('chatMessages');
  messageInput = document.getElementById('messageInput');
  sendBtn = document.getElementById('sendBtn');
  attachBtn = document.getElementById('attachBtn');
  typingIndicator = document.getElementById('typingIndicator');
  formModal = document.getElementById('formModal');
  modalTitle = document.getElementById('modalTitle');
  modalBody = document.getElementById('modalBody');
  modalClose = document.getElementById('modalClose');
  quickActions = document.getElementById('quickActions');
  newChatBtn = document.getElementById('newChatBtn');
  
  initializeEventListeners();
  scrollToBottom();
});

function initializeEventListeners() {
  // New chat button
  if (newChatBtn) {
    newChatBtn.addEventListener('click', handleNewChat);
  }
  
  // Quick action cards
  if (quickActions) {
    quickActions.addEventListener('click', handleQuickActionClick);
  }
  
  // Send button and enter key
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }
  
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
  }
  
  // Modal close
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  if (formModal) {
    formModal.addEventListener('click', function(e) {
      if (e.target === formModal) {
        closeModal();
      }
    });
  }
}

function handleNewChat() {
  if (!chatMessages) return;
  
  // Add visual feedback
  newChatBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    newChatBtn.style.transform = 'scale(1)';
  }, 150);
  
  // Close any open modals
  closeModal();
  
  // Clear input field
  if (messageInput) {
    messageInput.value = '';
  }
  
  // Transition out current chat
  chatMessages.classList.add('transition-out');
  
  setTimeout(() => {
    // Reset chat state
    isHomepageState = true;
    conversationHistory = [];
    
    // Clear chat messages and restore initial state
    chatMessages.innerHTML = `
      <div class="message ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <p>Good afternoon. How can I help you today?</p>
        </div>
      </div>
      
      <div class="quick-actions" id="quickActions">
        <div class="quick-action-card" data-action="payslip">
          <div class="action-icon">💰</div>
          <h4>Request Payslip</h4>
          <p>Download monthly payslips for payroll, tax filing, or loan applications.</p>
        </div>
        <div class="quick-action-card" data-action="leave">
          <div class="action-icon">📅</div>
          <h4>Check Leave Balance</h4>
          <p>View remaining annual leave, sick days, and upcoming leave entitlements.</p>
        </div>
        <div class="quick-action-card" data-action="letters">
          <div class="action-icon">📄</div>
          <h4>Request Official Letters and Documents</h4>
          <p>Ask for visa letters, loan application letters, recommendation or resignation letters.</p>
        </div>
        <div class="quick-action-card" data-action="personal">
          <div class="action-icon">👤</div>
          <h4>Updating Personal Data</h4>
          <p>Update address, phone number, emergency contact, or banking details.</p>
        </div>
      </div>
    `;
    
    // Re-initialize quick actions event listener
    quickActions = document.getElementById('quickActions');
    if (quickActions) {
      quickActions.addEventListener('click', handleQuickActionClick);
    }
    
    // Transition in new chat
    chatMessages.classList.remove('transition-out');
    chatMessages.classList.add('transition-in');
    
    setTimeout(() => {
      chatMessages.classList.remove('transition-in');
      scrollToBottom();
    }, 300);
    
  }, 250);
}

function handleQuickActionClick(e) {
  const card = e.target.closest('.quick-action-card');
  if (!card) return;
  
  const action = card.dataset.action;
  const title = card.querySelector('h4').textContent;
  
  addUserMessage(`I want to ${title.toLowerCase()}`);
  hideQuickActions();
  isHomepageState = false;
  
  setTimeout(() => {
    handleAIResponse(action);
  }, 800);
}

function handleSendMessage() {
  if (!messageInput) return;
  
  const message = messageInput.value.trim();
  if (!message) return;
  
  addUserMessage(message);
  messageInput.value = '';
  hideQuickActions();
  isHomepageState = false;
  
  setTimeout(() => {
    processUserMessage(message);
  }, 800);
}

function addUserMessage(message) {
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user-message';
  messageDiv.innerHTML = `
    <div class="message-avatar">U</div>
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  chatMessages.appendChild(messageDiv);
  
  // Store in conversation history
  conversationHistory.push({
    type: 'user',
    content: message,
    timestamp: Date.now()
  });
  
  scrollToBottom();
}

function addAIMessage(message) {
  if (!chatMessages) return;
  
  showTypingIndicator();
  
  setTimeout(() => {
    hideTypingIndicator();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        ${message}
      </div>
    `;
    chatMessages.appendChild(messageDiv);
    
    // Store in conversation history
    conversationHistory.push({
      type: 'ai',
      content: message,
      timestamp: Date.now()
    });
    
    scrollToBottom();
  }, 1200);
}

function processUserMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('payslip') || lowerMessage.includes('salary') || lowerMessage.includes('pay')) {
    handleAIResponse('payslip');
  } else if (lowerMessage.includes('leave') || lowerMessage.includes('vacation') || lowerMessage.includes('holiday')) {
    handleAIResponse('leave');
  } else if (lowerMessage.includes('letter') || lowerMessage.includes('document') || lowerMessage.includes('certificate')) {
    handleAIResponse('letters');
  } else if (lowerMessage.includes('personal') || lowerMessage.includes('address') || lowerMessage.includes('phone') || lowerMessage.includes('update')) {
    handleAIResponse('personal');
  } else {
    handleGeneralQuery(message);
  }
}

function handleAIResponse(action) {
  switch (action) {
    case 'payslip':
      handlePayslipRequest();
      break;
    case 'leave':
      handleLeaveBalanceRequest();
      break;
    case 'letters':
      handleLetterRequest();
      break;
    case 'personal':
      handlePersonalDataRequest();
      break;
  }
}

function handlePayslipRequest() {
  addAIMessage(`
    <p>I can help you request your payslip. Let me show you the available options.</p>
    <div class="form-actions">
      <button class="btn btn--primary" onclick="showPayslipForm()">Select Month & Year</button>
    </div>
  `);
}

function handleLeaveBalanceRequest() {
  let balanceHtml = '<p>Here are your current leave balances:</p><div class="data-grid">';
  
  leaveBalances.forEach(leave => {
    const percentage = (leave.remaining / leave.total) * 100;
    balanceHtml += `
      <div class="data-row">
        <div>
          <div class="data-label">${leave.type}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
        <div class="data-value">${leave.remaining}/${leave.total} days</div>
      </div>
    `;
  });
  
  balanceHtml += '</div>';
  addAIMessage(balanceHtml);
}

function handleLetterRequest() {
  addAIMessage(`
    <p>I can help you request official letters and documents. What type of letter do you need?</p>
    <div class="form-actions">
      <button class="btn btn--primary" onclick="showLetterForm()">Request Letter</button>
    </div>
  `);
}

function handlePersonalDataRequest() {
  addAIMessage(`
    <p>I can help you update your personal information. Let me show you your current details.</p>
    <div class="form-actions">
      <button class="btn btn--primary" onclick="showPersonalDataForm()">Update Information</button>
    </div>
  `);
}

function handleGeneralQuery(message) {
  const responses = [
    "I'm here to help you with HR-related requests. You can ask me about payslips, leave balances, official letters, or updating your personal information.",
    "I can assist you with various employee services. Would you like to check your leave balance, request a payslip, or update your personal information?",
    "I'm your Employee Self Service assistant. I can help you with payroll documents, leave management, official letters, and personal data updates. What do you need help with?",
    "That's an interesting question! While I specialize in HR and employee services, I can help you with payslips, leave requests, official documents, and personal information updates. Is there anything specific you'd like to know about these services?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  addAIMessage(`<p>${randomResponse}</p>`);
}

function showPayslipForm() {
  if (!modalTitle || !modalBody) return;
  
  modalTitle.textContent = 'Request Payslip';
  modalBody.innerHTML = `
    <form id="payslipForm">
      <div class="form-group">
        <label class="form-label">Select Month</label>
        <select class="form-control" id="payslipMonth" required>
          <option value="">Choose month...</option>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
          <option value="April">April</option>
          <option value="May">May</option>
          <option value="June">June</option>
          <option value="July">July</option>
          <option value="August">August</option>
          <option value="September" selected>September</option>
          <option value="October">October</option>
          <option value="November">November</option>
          <option value="December">December</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Select Year</label>
        <select class="form-control" id="payslipYear" required>
          <option value="">Choose year...</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025" selected>2025</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn--primary">Generate Payslip</button>
      </div>
    </form>
  `;
  
  showModal();
  
  const form = document.getElementById('payslipForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const month = document.getElementById('payslipMonth').value;
      const year = document.getElementById('payslipYear').value;
      
      if (month && year) {
        closeModal();
        generatePayslip(month, year);
      }
    });
  }
}

function generatePayslip(month, year) {
  addAIMessage(`
    <p>Here's your payslip for ${month} ${year}:</p>
    <div class="data-grid">
      <div class="data-row">
        <div class="data-label">Employee ID</div>
        <div class="data-value">${employeeData.id}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Employee Name</div>
        <div class="data-value">${employeeData.name}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Position</div>
        <div class="data-value">${employeeData.position}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Basic Salary</div>
        <div class="data-value">${payslipData.basicSalary}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Allowances</div>
        <div class="data-value">${payslipData.allowances}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Deductions</div>
        <div class="data-value">${payslipData.deductions}</div>
      </div>
      <div class="data-row">
        <div class="data-label"><strong>Net Pay</strong></div>
        <div class="data-value"><strong>${payslipData.netPay}</strong></div>
      </div>
    </div>
    <div class="status-message success">
      ✅ Payslip generated successfully! You can download it from your email or HR portal.
    </div>
  `);
}

function showLetterForm() {
  if (!modalTitle || !modalBody) return;
  
  modalTitle.textContent = 'Request Official Letter';
  modalBody.innerHTML = `
    <form id="letterForm">
      <div class="form-group">
        <label class="form-label">Letter Type</label>
        <select class="form-control" id="letterType" required>
          <option value="">Choose letter type...</option>
          <option value="employment">Employment Letter</option>
          <option value="salary">Salary Certificate</option>
          <option value="recommendation">Recommendation Letter</option>
          <option value="visa">Visa Support Letter</option>
          <option value="loan">Loan Application Letter</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Purpose</label>
        <textarea class="form-control" id="letterPurpose" rows="3" placeholder="Please describe the purpose of this letter..." required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Recipient (Optional)</label>
        <input type="text" class="form-control" id="letterRecipient" placeholder="To whom should this letter be addressed?">
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn--primary">Submit Request</button>
      </div>
    </form>
  `;
  
  showModal();
  
  const form = document.getElementById('letterForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const letterType = document.getElementById('letterType').value;
      const purpose = document.getElementById('letterPurpose').value;
      const recipient = document.getElementById('letterRecipient').value;
      
      if (letterType && purpose) {
        closeModal();
        processLetterRequest(letterType, purpose, recipient);
      }
    });
  }
}

function processLetterRequest(letterType, purpose, recipient) {
  const letterTypeNames = {
    'employment': 'Employment Letter',
    'salary': 'Salary Certificate',
    'recommendation': 'Recommendation Letter',
    'visa': 'Visa Support Letter',
    'loan': 'Loan Application Letter'
  };
  
  addAIMessage(`
    <p>Your request for <strong>${letterTypeNames[letterType]}</strong> has been submitted successfully!</p>
    <div class="data-grid">
      <div class="data-row">
        <div class="data-label">Letter Type</div>
        <div class="data-value">${letterTypeNames[letterType]}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Purpose</div>
        <div class="data-value">${purpose}</div>
      </div>
      ${recipient ? `
      <div class="data-row">
        <div class="data-label">Recipient</div>
        <div class="data-value">${recipient}</div>
      </div>
      ` : ''}
      <div class="data-row">
        <div class="data-label">Processing Time</div>
        <div class="data-value">2-3 business days</div>
      </div>
    </div>
    <div class="status-message success">
      ✅ Your letter request has been forwarded to HR. You will receive an email confirmation shortly.
    </div>
  `);
}

function showPersonalDataForm() {
  if (!modalTitle || !modalBody) return;
  
  modalTitle.textContent = 'Update Personal Information';
  modalBody.innerHTML = `
    <form id="personalDataForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="fullName" value="${employeeData.name}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Employee ID</label>
          <input type="text" class="form-control" id="employeeId" value="${employeeData.id}" readonly>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" id="email" value="${employeeData.email}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input type="tel" class="form-control" id="phone" value="${employeeData.phone}">
        </div>
      </div>
      <div class="form-row single">
        <div class="form-group">
          <label class="form-label">Current Address</label>
          <textarea class="form-control" id="address" rows="3">${employeeData.currentAddress}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn--primary">Update Information</button>
      </div>
    </form>
  `;
  
  showModal();
  
  const form = document.getElementById('personalDataForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const address = document.getElementById('address').value;
      
      closeModal();
      updatePersonalData(email, phone, address);
    });
  }
}

function updatePersonalData(email, phone, address) {
  // Update the employee data
  employeeData.email = email;
  employeeData.phone = phone;
  employeeData.currentAddress = address;
  
  addAIMessage(`
    <p>Your personal information has been updated successfully!</p>
    <div class="data-grid">
      <div class="data-row">
        <div class="data-label">Email Address</div>
        <div class="data-value">${email}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Phone Number</div>
        <div class="data-value">${phone}</div>
      </div>
      <div class="data-row">
        <div class="data-label">Address</div>
        <div class="data-value">${address}</div>
      </div>
    </div>
    <div class="status-message success">
      ✅ Changes have been saved and will be reflected in your employee profile within 24 hours.
    </div>
  `);
}

function hideQuickActions() {
  if (quickActions) {
    quickActions.classList.add('fade-out');
    setTimeout(() => {
      quickActions.classList.add('hidden');
    }, 250);
  }
}

function showTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.classList.remove('hidden');
  }
}

function hideTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.classList.add('hidden');
  }
}

function showModal() {
  if (formModal) {
    formModal.classList.remove('hidden');
  }
}

function closeModal() {
  if (formModal) {
    formModal.classList.add('hidden');
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, 100);
}
