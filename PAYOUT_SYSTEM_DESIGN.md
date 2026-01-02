# Taskify / Taskaroo Payout System Design

## Overview
This document outlines the database schema and logic for the manual payout system. The system is designed to be robust, auditable, and scalable, following the "Client pays Platform first" model.

## Money Flow
1.  **Payment In (Client → Platform):**
    *   Client pays for a task.
    *   **Funds are deposited directly into the platform's Capitec Business Account (Acc No: 1054722480).**
    *   System records a `payment` entry.
    *   The total amount is **logically held** by the platform (not a separate escrow account).
    *   The system logically splits the amount: `platform_fee` (Revenue) and `freelancer_amount` (Liability).
    *   Funds are initially held in a "Pending" state for the freelancer until the task is completed.

2.  **Earning (Task Completion):**
    *   When a task is marked complete, the `freelancer_amount` moves from `pending_balance` to `available_balance` in the freelancer's wallet.
    *   A `wallet_transaction` record is created to audit this event.

3.  **Payout Out (Platform → Freelancer):**
    *   Admin (or Freelancer) initiates a payout request.
    *   Funds are deducted from `available_balance` immediately to prevent double-spending.
    *   A `payout` record is created with status `pending`.
    *   Admin manually performs the EFT from Capitec.
    *   Admin updates the `payout` record to `paid`.

## Database Schema Design (PostgreSQL)

### 1. `payments`
Tracks incoming money from clients.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL PK | Unique ID |
| `task_id` | INT FK | Link to the Task |
| `client_id` | INT FK | Link to the Client |
| `amount_total` | DECIMAL(10,2) | Total amount paid by client (e.g., 100.00) |
| `platform_fee` | DECIMAL(10,2) | Commission kept by platform (e.g., 30.00) |
| `freelancer_amount` | DECIMAL(10,2) | Amount owed to freelancer (e.g., 70.00) |
| `currency` | VARCHAR(3) | 'ZAR' |
| `status` | VARCHAR(20) | 'pending', 'completed', 'failed', 'refunded' |
| `provider_ref` | VARCHAR(100) | External transaction ID (e.g., Paystack ref) |
| `created_at` | TIMESTAMP | Date of payment |

### 2. `freelancer_wallets`
Stores the current financial state of a freelancer. One row per freelancer.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL PK | Unique ID |
| `freelancer_id` | INT FK | Link to Freelancer |
| `available_balance` | DECIMAL(10,2) | Funds ready for payout |
| `pending_balance` | DECIMAL(10,2) | Funds held (task in progress) |
| `total_earnings` | DECIMAL(10,2) | Lifetime earnings counter |
| `updated_at` | TIMESTAMP | Last change timestamp |

### 3. `wallet_transactions` (Audit Log)
The immutable history of every balance change. **Crucial for auditing.**

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL PK | Unique ID |
| `wallet_id` | INT FK | Link to Freelancer Wallet |
| `type` | VARCHAR(20) | 'earning', 'payout', 'refund', 'adjustment' |
| `amount` | DECIMAL(10,2) | Positive for credit, Negative for debit |
| `balance_after` | DECIMAL(10,2) | Snapshot of balance after transaction |
| `reference_type` | VARCHAR(20) | 'task', 'payout', 'admin' |
| `reference_id` | INT | ID of the related task or payout |
| `description` | TEXT | Human readable description |
| `created_at` | TIMESTAMP | Date of transaction |

### 4. `payouts`
Tracks manual EFT requests and their status.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL PK | Unique ID |
| `freelancer_id` | INT FK | Link to Freelancer |
| `amount` | DECIMAL(10,2) | Amount requested |
| `status` | VARCHAR(20) | 'requested', 'processing', 'paid', 'failed' |
| `bank_name` | VARCHAR(50) | e.g., 'Capitec', 'FNB' |
| `account_number` | VARCHAR(20) | Freelancer's account number |
| `admin_note` | TEXT | Internal notes (e.g., "EFT done batch #4") |
| `processed_at` | TIMESTAMP | When the money was actually sent |
| `created_at` | TIMESTAMP | Request date |

## Future Extensibility

*   **Automatic Split Payments:** The `payments` table already separates `platform_fee` and `freelancer_amount`. When integrating Stripe Connect or Paystack Split, you simply map these columns to their API fields.
*   **Multiple Payout Providers:** The `payouts` table is generic. You can add a `provider` column later (e.g., 'manual_eft', 'paypal', 'bitcoin') without breaking the schema.
*   **Escrow:** The `pending_balance` in `freelancer_wallets` acts as a logical escrow. Funds sit there until the system (or admin) moves them to `available_balance`.

## Example Status Workflows

**Happy Path:**
1.  `payments`: Status `completed` (Money in Capitec).
2.  `freelancer_wallets`: `pending_balance` increases.
3.  **Task Done:** `freelancer_wallets`: `pending_balance` decreases, `available_balance` increases.
4.  **Payout Req:** `payouts`: Status `requested`. `freelancer_wallets`: `available_balance` decreases.
5.  **Admin Pays:** `payouts`: Status `paid`.

**Refund Path:**
1.  `payments`: Status `refunded`.
2.  `freelancer_wallets`: `pending_balance` decreases (reversing the hold).