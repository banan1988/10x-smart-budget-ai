# REST API Plan

This document outlines the REST API for the SmartBudgetAI application, based on the provided database schema, product requirements, and technology stack. The API will be implemented using Astro Server Endpoints.

## 1. Resources

- **Transactions**: Represents user's financial transactions. Corresponds to the `transactions` table.
- **Categories**: Represents global spending categories. Corresponds to the `categories` table.
- **User**: Represents the authenticated user and their data. Corresponds to the `auth.users` and `user_profiles` tables.
- **Dashboard**: A virtual resource providing aggregated data for the user's dashboard.
- **Feedback**: Represents user feedback about the application.

## 2. Endpoints

All endpoints are protected and require user authentication unless otherwise specified.

### 2.1. Transactions

#### `GET /api/transactions`

- **Description**: Retrieves a list of transactions for the authenticated user for a given month.
- **Query Parameters**:
    - `month` (string, required): The month to fetch transactions for, in `YYYY-MM` format.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "type": "expense",
      "amount": 5000,
      "description": "Zakupy spożywcze",
      "date": "2025-10-15",
      "category": {
        "id": 101,
        "key": "food",
        "name": "Jedzenie"
      },
      "is_ai_categorized": true
    },
    {
      "id": 2,
      "type": "income",
      "amount": 100000,
      "description": "Wynagrodzenie",
      "date": "2025-10-01",
      "category": null,
      "is_ai_categorized": false
    }
  ]
  ```
- **Error Responses**:
    - `400 Bad Request`: If the `month` parameter is missing or invalid.
    - `401 Unauthorized`: If the user is not authenticated.

#### `POST /api/transactions`

- **Description**: Creates a new transaction. If the transaction `type` is 'expense', the API will internally call the AI service to categorize it based on its description. Income transactions are not categorized.
- **Request Body**:
  ```json
  {
    "type": "expense",
    "amount": 5000,
    "description": "Cotygodniowe zakupy w supermarkecie",
    "date": "2025-10-15"
  }
  ```
- **Validation (using Zod)**:
    - `type`: Must be a string, either 'income' or 'expense'.
    - `amount`: Must be an integer greater than 0.
    - `description`: Must be a non-empty string with a maximum length of 255 characters.
    - `date`: Must be a string in `YYYY-MM-DD` format.
- **Response (201 Created)**:
  ```json
  {
    "id": 2,
    "type": "expense",
    "amount": 5000,
    "description": "Cotygodniowe zakupy w supermarkecie",
    "date": "2025-10-15",
    "category": {
      "id": 101,
      "key": "food",
      "name": "Jedzenie"
    },
    "is_ai_categorized": true
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: For invalid input data (e.g., amount <= 0).
    - `401 Unauthorized`: If the user is not authenticated.
    - `500 Internal Server Error`: If the AI categorization fails unexpectedly.

#### `PUT /api/transactions/{id}`

- **Description**: Updates an existing transaction.
- **URL Parameters**:
    - `id` (integer, required): The ID of the transaction to update.
- **Request Body**:
  ```json
  {
    "type": "expense",
    "amount": 5500,
    "description": "Zakupy spożywcze i przekąski",
    "date": "2025-10-16",
    "categoryId": 102
  }
  ```
- **Validation (using Zod)**:
    - All fields are optional, but at least one must be provided.
    - `type`: Must be a string, either 'income' or 'expense'.
    - `amount`: Must be an integer greater than 0.
    - `description`: Must be a non-empty string with a maximum length of 255 characters.
    - `date`: Must be a string in `YYYY-MM-DD` format.
    - `categoryId`: Must be an integer. If `type` is changed to 'income', this should be set to null.
- **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "type": "expense",
    "amount": 5500,
    "description": "Zakupy spożywcze i przekąski",
    "date": "2025-10-16",
    "category": {
      "id": 102,
      "key": "groceries",
      "name": "Zakupy spożywcze"
    },
    "is_ai_categorized": false
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: For invalid input data.
    - `401 Unauthorized`: If the user is not authenticated.
    - `404 Not Found`: If the transaction does not exist or the user does not have permission to edit it.

#### `DELETE /api/transactions/{id}`

- **Description**: Deletes a specific transaction.
- **URL Parameters**:
    - `id` (integer, required): The ID of the transaction to delete.
- **Response (204 No Content)**:
- **Error Responses**:
    - `401 Unauthorized`: If the user is not authenticated.
    - `404 Not Found`: If the transaction does not exist or the user does not have permission to delete it.

### 2.2. Categories

#### `GET /api/categories`

- **Description**: Retrieves the list of all available global categories. This is used by the frontend to populate category selection dropdowns.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 101,
      "key": "food",
      "name": "Jedzenie"
    },
    {
      "id": 102,
      "key": "transport",
      "name": "Transport"
    }
  ]
  ```
- **Error Responses**:
    - `401 Unauthorized`: If the user is not authenticated.

### 2.3. User

#### `GET /api/user/profile`

- **Description**: Retrieves the profile for the authenticated user, including nickname and preferences.
- **Response (200 OK)**:
  ```json
  {
    "nickname": "BudżetowyMistrz",
    "preferences": {
      "theme": "dark"
    }
  }
  ```
- **Error Responses**:
    - `401 Unauthorized`: If the user is not authenticated.
    - `404 Not Found`: If the user profile does not exist.

#### `DELETE /api/user`

- **Description**: Deletes the authenticated user's account and all associated data (profile, transactions) in compliance with GDPR. This is an irreversible action.
- **Response (204 No Content)**:
- **Error Responses**:
    - `401 Unauthorized`: If the user is not authenticated.
    - `500 Internal Server Error`: If data deletion fails.

### 2.4. Dashboard

#### `GET /api/dashboard`

- **Description**: Retrieves aggregated data for the dashboard view for a specific month, including top spending categories and an AI-generated summary.
- **Query Parameters**:
    - `month` (string, required): The month to fetch data for, in `YYYY-MM` format.
- **Response (200 OK)**:
  ```json
  {
    "income": 150000,
    "expenses": 350000,
    "balance": -200000,
    "spendingChart": {
      "categories": [
        { "name": "Jedzenie", "total": 120000 },
        { "name": "Transport", "total": 80000 },
        { "name": "Rozrywka", "total": 65000 },
        { "name": "Rachunki", "total": 50000 },
        { "name": "Ubrania", "total": 45000 },
        { "name": "Inne", "total": 30000 }
      ]
    },
    "aiSummary": "W tym miesiącu Twoje największe wydatki dotyczyły jedzenia i transportu. Udało Ci się utrzymać wydatki na rozrywkę na umiarkowanym poziomie."
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: If the `month` parameter is missing or invalid.
    - `401 Unauthorized`: If the user is not authenticated.

### 2.5. Feedback

#### `POST /api/feedback`

- **Description**: Submits user feedback about the application.
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Ta aplikacja jest fantastyczna! Kategoryzacja AI to rewolucja."
  }
  ```
- **Validation (using Zod)**:
    - `rating`: Must be an integer between 1 and 5.
    - `comment`: Must be a string with a maximum length of 1000 characters (can be empty).
- **Response (201 Created)**:
  ```json
  {
    "message": "Dziękujemy za Twoją opinię."
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: If the rating is invalid (e.g., not between 1 and 5).
    - `401 Unauthorized`: If the user is not authenticated.

#### `GET /api/feedbacks/stats`

- **Description**: Retrieves aggregated feedback statistics, such as average rating and total count. This endpoint is public or available to all authenticated users as it does not expose personal data.
- **Response (200 OK)**:
  ```json
  {
    "averageRating": 4.75,
    "totalFeedbacks": 1234
  }
  ```

#### `GET /api/admin/feedbacks`

- **Description**: Retrieves a list of all user feedback. **This is a protected admin endpoint and requires special permissions (e.g., `service_role` or a custom `admin` role).** It must not be exposed to regular users.
- **Query Parameters**:
    - `page` (integer, optional): For pagination.
    - `limit` (integer, optional): For pagination.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "rating": 5,
      "comment": "Ta aplikacja jest fantastyczna!",
      "createdAt": "2025-11-10T10:00:00Z",
      "userId": "user-uuid-1"
    },
    {
      "id": 2,
      "rating": 4,
      "comment": "Działa dobrze, ale brakuje mi opcji X.",
      "createdAt": "2025-11-09T12:30:00Z",
      "userId": "user-uuid-2"
    }
  ]
  ```
- **Error Responses**:
    - `401 Unauthorized`: If the user is not authenticated.
    - `403 Forbidden`: If the authenticated user is not an admin.

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled using Supabase Auth. The client will send a JWT in the `Authorization` header (`Bearer <token>`) with every request to a protected endpoint.
- **Middleware**: An Astro middleware (`src/middleware/index.ts`) will intercept incoming requests to API routes. It will validate the JWT using the Supabase client. If the token is invalid or missing, it will return a `401 Unauthorized` response.
- **Authorization**: Row Level Security (RLS) is enabled in the PostgreSQL database. Policies ensure that users can only access and modify their own data (e.g., `user_id = auth.uid()` on the `transactions` table). The `DELETE /api/user` endpoint will use the authenticated user's ID to delete the correct user from `auth.users`.

## 4. Validation and Business Logic

- **Input Validation**: Zod will be used in each API endpoint to validate incoming request bodies and query parameters. This ensures type safety and the presence of required fields.
- **Database Constraints**:
    - `transactions.amount`: Must be a positive integer (`CHECK(amount > 0)`). This is enforced at the database level and validated by Zod in the API.
- **Business Logic Implementation**:
    - **AI Categorization**: The `POST /api/transactions` endpoint contains the logic to call the AI service. This logic is only triggered if the transaction `type` is 'expense'. It constructs a prompt with the transaction description and the list of available category keys, sends it to the AI, and processes the response. If the AI fails or returns an invalid category key, a default category ("Inne") is assigned.
    - **Dashboard Aggregation**: The `GET /api/dashboard` endpoint contains the logic to query the database for transactions within a given month, calculate total income, total expenses, and the balance. It also groups expenses by category, calculates totals for the spending chart, and makes a separate call to the AI service to generate the natural language summary.
    - **User Data Deletion**: The `DELETE /api/user` endpoint will call a specific Supabase function (`supabase.auth.admin.deleteUser(userId)`) that handles the deletion of a user and triggers the `ON DELETE CASCADE` constraints in the database to remove all related data (`user_profiles`, `transactions`).
    - **Feedback Storage**: The `POST /api/feedback` endpoint will validate the input and insert a new record into the `public.feedback` table with the `user_id` of the authenticated user.
