# 10x Smart Budget AI

A personal finance application that leverages AI to provide smart budgeting and financial insights.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [AI Ready](#ai-ready)
- [Getting Started Locally](#getting-started-locally)
- [Getting Started for Production](#getting-started-for-production)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

- **Framework**: [Astro](https://astro.build/) 5
- **UI Framework**: [React](https://react.dev/) 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **Package Manager**: [npm](https://www.npmjs.com/)
- **Node.js version**: 22.14.0

## Testing

- **Unit & Integration Testing**: [Vitest](https://vitest.dev/)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **API Mocking**: [Mock Service Worker (MSW)](https://mswjs.io/)
- **Performance Testing**: [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

## Project Structure

```
./
├── public/ - public assets
└── src/ - source code
    ├── assets/ - static internal assets
    ├── components/ - Client-side components written in Astro (static) and React (dynamic)
    │   └── ui/ - Client-side components from Shadcn/ui
    ├── db/ - Supabase clients and types
    ├── layouts/ - Astro layouts
    ├── lib/ - Services and helpers
    ├── middleware/
    │   └── index.ts - Astro middleware
    ├── pages/ - Astro pages
    │   └── api/ - API endpoints
    └── types.ts - Shared types for backend and frontend (Entities, DTOs)
```

## AI Ready

This project is designed to be **AI Ready**, with a clear separation of concerns that allows for easy integration of artificial intelligence features. The backend is prepared to handle AI-powered logic, such as providing smart budget recommendations and financial insights, while the frontend is set up to consume and display this data effectively.

The use of Supabase for the backend and a well-defined API structure in Astro allows for seamless communication between the client and any AI services.

### AI Features

- **Automatic Transaction Categorization**: Transactions are automatically categorized using AI based on their descriptions. See [AI Categorization Documentation](./docs/ai-categorization.md) for more details.
- **Smart Financial Insights**: AI-generated summaries of spending patterns and trends.

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js version `22.14.0` or higher installed. You can use a tool like [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

```sh
nvm use
```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/10x-smart-budget-ai.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```

### Running the application

```sh
npm run dev
```

## Getting Started for Production

To build and run the application in a production environment, follow these steps.

### Prerequisites

Ensure you have Node.js version `22.14.0` or higher installed.

### Build

1. Install dependencies
   ```sh
   npm install
   ```
2. Build the application
   ```sh
   npm run build
   ```

### Running the application

After building, you can preview the production build with:

```sh
npm run preview
```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `build` folder.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the project files using ESLint.
- `npm run lint:fix`: Lints and automatically fixes problems in project files.
- `npm run format`: Formats the code using Prettier.

## Project Scope

Based on the Project Requirements Document (PRD), the scope for the Minimum Viable Product (MVP) of SmartBudgetAI includes the following key features:

### 1. User Account Management
- **Registration:** Users can sign up with an email and password.
- **Login:** Registered users can log in to access their account.
- **Account Deletion:** Users can permanently delete their account and all associated data.

### 2. Transaction Management (CRUD)
- **Add Transaction:** A modal window allows users to add new transactions with fields for amount (in PLN), description, and date.
- **View Transactions:** A list of transactions for the current month is displayed on the main screen, with navigation to previous and next months.
- **Edit Transaction:** Users can modify the amount, description, and date of existing transactions.
- **Delete Transaction:** Users can remove individual transactions.

### 3. AI-Powered Categorization
- **Automatic Categorization:** When a transaction is added, its description is sent to an AI model to be automatically assigned a category from a predefined list.
- **Error Handling:** Ifd the AI fails to assign a category, the transaction is automatically labeled as "Other."

### 4. Main Dashboard
- **Default View:** The main screen after login, showing data for the current month.
- **Expense Chart:** A bar chart displaying the top 5 spending categories and an "Other" category for the rest.
- **AI Summary:** A brief, 2-3 sentence natural language summary of the last month's spending, generated by AI.
- **Empty State:** A message encouraging users to add their first transaction if there are none for the current month.

### 5. Feedback Collection
- A simple pop-up to collect user feedback on the application's usefulness on a scale of 1 to 5, with an optional comment field.

## Project Status

The project is currently in the **initial development phase**.

## License

Distributed under the MIT License. See `LICENSE` for more information.
