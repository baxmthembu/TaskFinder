/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .table('task', table => {
      table.integer('rating');
      table.text('comments');
    })
    .then(() => {
        return knex.schema.table('freelancers', table => {
            table.float('rating').defaultTo(0);
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .table('task', table => {
      table.dropColumn('rating');
      table.dropColumn('comments');
    })
    .then(() => {
        return knex.schema.table('freelancers', table => {
            table.dropColumn('rating');
        });
    });
};
