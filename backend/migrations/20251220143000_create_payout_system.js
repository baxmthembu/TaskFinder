/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Payments Table - Tracks incoming money from clients
    .createTable('payments', function(table) {
      table.increments('id').primary();
      table.integer('task_id').unsigned().references('task_id').inTable('task').onDelete('SET NULL');
      table.bigInteger('client_id').unsigned().references('id').inTable('user_info').onDelete('SET NULL');
      table.decimal('amount_total', 10, 2).notNullable().comment('Total amount paid by client');
      table.decimal('platform_fee', 10, 2).notNullable().comment('Commission kept by platform');
      table.decimal('freelancer_amount', 10, 2).notNullable().comment('Amount owed to freelancer');
      table.string('currency', 3).defaultTo('ZAR');
      table.string('status', 20).defaultTo('pending').comment('pending, completed, failed, refunded');
      table.string('provider_ref', 100).comment('External transaction ID (e.g., Paystack ref)');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })

    // 2. Freelancer Wallets Table - Stores current financial state
    .createTable('freelancer_wallets', function(table) {
      table.increments('id').primary();
      table.bigInteger('freelancer_id').unsigned().notNullable().unique().references('id').inTable('freelancers').onDelete('CASCADE');
      table.decimal('available_balance', 10, 2).defaultTo(0.00).comment('Funds ready for payout');
      table.decimal('pending_balance', 10, 2).defaultTo(0.00).comment('Funds held (task in progress)');
      table.decimal('total_earnings', 10, 2).defaultTo(0.00).comment('Lifetime earnings counter');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })

    // 3. Wallet Transactions Table - Audit log of every balance change
    .createTable('wallet_transactions', function(table) {
      table.increments('id').primary();
      table.integer('wallet_id').unsigned().notNullable().references('id').inTable('freelancer_wallets').onDelete('CASCADE');
      table.string('type', 20).notNullable().comment('earning, payout, refund, adjustment');
      table.decimal('amount', 10, 2).notNullable().comment('Positive for credit, Negative for debit');
      table.decimal('balance_after', 10, 2).notNullable().comment('Snapshot of balance after transaction');
      table.string('reference_type', 20).comment('task, payout, admin');
      table.integer('reference_id').comment('ID of the related task or payout');
      table.text('description').comment('Human readable description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // 4. Payouts Table - Tracks manual EFT requests
    .createTable('payouts', function(table) {
      table.increments('id').primary();
      table.bigInteger('freelancer_id').unsigned().notNullable().references('id').inTable('freelancers').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('status', 20).defaultTo('requested').comment('requested, processing, paid, failed');
      table.string('bank_name', 50).comment('e.g., Capitec, FNB');
      table.string('account_number', 20);
      table.text('admin_note').comment('Internal notes for admin');
      table.timestamp('processed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payouts')
    .dropTableIfExists('wallet_transactions')
    .dropTableIfExists('freelancer_wallets')
    .dropTableIfExists('payments');
};