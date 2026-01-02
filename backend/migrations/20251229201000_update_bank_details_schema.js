/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('freelancer_bank_accounts', function(table) {
    table.dropColumn('branch_code');
    table.string('security_code', 3).notNullable().defaultTo('000'); // Default to avoid issues with existing rows, though in prod we might want to handle differently
    table.string('valid_thru', 5).notNullable().defaultTo('00/00'); // MM/YY
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('freelancer_bank_accounts', function(table) {
    table.dropColumn('security_code');
    table.dropColumn('valid_thru');
    table.string('branch_code', 20).notNullable().defaultTo('');
  });
};
