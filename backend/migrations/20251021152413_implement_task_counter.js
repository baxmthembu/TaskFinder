/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('task', function(table) {
    table.enum('status', ['pending', 'accepted', 'in-progress', 'finished', 'paid']).defaultTo('pending');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('task', function(table) {
    table.dropColumn('status');
  });
};
