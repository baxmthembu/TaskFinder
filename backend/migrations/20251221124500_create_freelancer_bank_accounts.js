/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('freelancer_bank_accounts', function(table) {
    table.increments('id').primary();
    table.bigInteger('freelancer_id').unsigned().notNullable().references('id').inTable('freelancers').onDelete('CASCADE');
    table.string('bank_name', 100).notNullable();
    table.string('account_holder_name', 100).notNullable();
    table.text('account_number_encrypted').notNullable(); // Encrypted field
    table.string('branch_code', 20).notNullable();
    table.string('account_type', 50).notNullable(); // Savings, Cheque, Business
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable(); // Soft delete

    // Ensure only one active account per freelancer (handled via application logic mostly, but index helps)
    // We can't easily enforce "only one true" with simple unique constraint without partial index
    table.index(['freelancer_id', 'is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('freelancer_bank_accounts');
};