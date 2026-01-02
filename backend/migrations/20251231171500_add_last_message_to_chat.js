/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('chat', function(table) {
    table.text('last_message');
    table.timestamp('last_message_time');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('chat', function(table) {
    table.dropColumn('last_message');
    table.dropColumn('last_message_time');
  });
};
