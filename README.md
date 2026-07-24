# 📉 MonthEnd

> **Patterns over prescriptions.**  
> *An Allowance-Based Financial Wellness Platform for Students*

A student-focused budgeting and financial wellness system designed for Indian teenagers and young adults to build healthy money habits, reduce financial stress, and learn financial decision-making in a safe, non-judgmental way.

---

## 📸 App Showcase

<div align="center">
  <img src="app imgs/dashboard.jpeg" width="22%" alt="Dashboard" />
  <img src="app imgs/expectedVsActual.jpeg" width="22%" alt="Expected vs Actual" />
</div>

---

## 🛑 Problem Statement

In India, most students:
- Receive fixed monthly allowances.
- Do not earn independently during school or college.
- Lack structured financial literacy.
- Experience anxiety, guilt, or dependency due to poor budgeting.

Most existing finance apps are built for earning adults with salary streams, not allowance-based students. **MonthEnd** directly addresses that gap.

---

## 💡 Core Idea

This project treats money management as a **behavioral and educational challenge**, not a financial optimization problem. Instead of only tracking expenses, the system:
1. **Learns** a student’s spending behavior.
2. **Predicts** consequences before money is spent.
3. **Encourages** reflection and informed decision-making.

*The focus is awareness and well-being, not control or profit.*

---

## ✨ Key Features

### 1. 💰 Allowance-Based Budgeting
- Fixed monthly allowance setup.
- Expected expense limits vs. Actual expense tracking.
- Secure Google Auth & traditional Sign-Up options.

<div align="center">
  <img src="app imgs/allowance.jpeg" width="24%" alt="Allowance Setup" />
</div>

### 2. 📊 Spending Visualization
- Category-wise breakdown.
- Real-time deviation from expected spending.
- Monthly summaries for deep reflection.

<div align="center">
  <img src="app imgs/reflections.jpeg" width="24%" alt="Reflections" />
</div>

### 3. 🧠 Behavioral Budget Twin (What-If Simulation)
- Creates a temporary in-memory snapshot of the user’s current budget state.
- Simulates hypothetical expenses before spending.
- Shows the impact on: End-of-month balance, savings goals, and spending risk level.
- *(Real user data is never modified during simulations).*

<div align="center">
  <img src="app imgs/chatbot1.jpeg" width="24%" alt="Chatbot Query" />
</div>

### 4. 💬 Conversational Financial Assistant (Chatbot)
- A supportive chatbot that answers questions like: *"Can I afford this right now?"* or *"How will this affect my goal?"*
- Explains predictions using numbers and past behavior.
- Avoids alarms, judgment, or generic advice.
- *Note: This is an explainable, rule-based and ML-assisted decision-support system, not a generic text generator.*

### 5. 👨‍👩‍👧 Automated Parent Reports (Cron Jobs)
- Users can selectively share monthly progress with parents.
- Fully customizable privacy: users choose exactly which insights to share (Goals, Category Split, Reflections).
- Automated email reports sent via backend scheduling (Node-Cron).

<div align="center">
  <img src="app imgs/share.jpeg" width="24%" alt="Share Settings" />
  <img src="app imgs/chatbot2.jpeg" width="24%" alt="Chatbot Simulation" />
</div>

### 6. 🎯 Goal Setting & Reflection
- Short-term goal creation (e.g., saving for a device or trip).
- Goal feasibility evaluation and monthly reflection to reinforce learning.

<div align="center">
  <img src="app imgs/goals.jpeg" width="24%" alt="Goals" />
</div>

---

## ▶️ Demo Flow (End-to-End User Journey)

1. **Allowance Setup**: User securely logs in and enters their monthly allowance and expected limits.
   <div align="center"><img src="app imgs/auth.png" width="22%" alt="Auth Screen" /></div>
2. **Expense Logging**: Daily expenses are added and categorized.
   <div align="center"><img src="app imgs/expense.jpeg" width="22%" alt="Expense Screen" /></div>
3. **Visualization & Awareness**: Dashboard displays expected vs. actual spending and remaining allowance.
4. **What-If Query**: User asks the chatbot, *“Can I spend ₹600 today?”*
   <div align="center"><img src="app imgs/chatbot1.jpeg" width="22%" alt="Chatbot 1" /></div>
5. **Budget Twin Simulation**: System clones the budget state, injects the expense, and recalculates risks.
   <div align="center"><img src="app imgs/chatbot2.jpeg" width="22%" alt="Chatbot 2" /></div>
6. **Explainable Response**: Chatbot replies: *“Based on your last two months, this expense may increase your end-of-month shortfall risk by 40%.”*
7. **User Decision**: User decides whether to proceed, adjust, or delay.
8. **Monthly Reflection & Sharing**: At month-end, system summarizes learnings and emails a customized report to parents.

---

## 🏗️ System Architecture & Tech Stack

- **Frontend (Mobile App)**: React Native, Expo SDK 54, React Navigation, Axios
- **Backend**: Node.js, Express.js, REST APIs (Deployed on Render)
- **Database**: MongoDB Atlas (User profiles, allowances, expenses, share configs)
- **Authentication**: Google OAuth 2.0 (`@react-native-google-signin`), JWT Tokens
- **Background Scheduling**: Node-Cron & Nodemailer (Automated parent report emails)
- **Intelligence Layer**: Rule-based logic, statistical trend analysis, and in-memory state cloning.

---

## 🚀 Installation & Running Locally

### 1. Backend Setup
```bash
cd MonthEnd/backend
npm install
npm start
```

### 2. Frontend Setup (Expo Go)
```bash
cd MonthEnd/frontend
npm install
npx expo start --clear
```

---

## 📦 Building Standalone APK (Android)

To generate a direct `.apk` file for Android devices:

```bash
cd MonthEnd/frontend

# 1. Install EAS CLI (if not installed)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```
Once the cloud build completes, scan the generated QR code or open the download link to install the `.apk` on your mobile phone.

---

## 🎨 Design Principles

- **Explainable > Complex**
- **Preventive > Reactive**
- **Educational > Prescriptive**
- **Trust > Automation**

*The system is designed to support user judgment, not replace it.*

---

## 🌍 Intended Impact

- Reduce financial stress among students.
- Improve financial literacy through lived experience.
- Encourage responsible independence.
- Provide a safe introduction to money management.

---

## 📌 Disclaimer

This project:
- Does not offer financial advice.
- Does not handle real payments or investments.
- Does not promote borrowing or trading.

It is strictly a budgeting and financial awareness tool designed to build habits.