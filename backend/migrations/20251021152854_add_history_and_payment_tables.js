/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('history', function(table) {
    table.increments('id').primary();
    table.integer('task_id').unsigned().references('id').inTable('task');
    table.integer('user_id').unsigned().references('id').inTable('user_info');
    table.integer('freelancer_id').unsigned().references('id').inTable('freelancers');
    table.string('task_title');
    table.timestamp('date_finished');
    table.decimal('amount', 10, 2);
  }).createTable('payment', function(table) {
    table.increments('id').primary();
    table.integer('task_id').unsigned().references('id').inTable('task');
    table.integer('user_id').unsigned().references('id').inTable('user_info');
    table.decimal('amount', 10, 2);
    table.timestamp('date_paid').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('payment').dropTable('history');
};
