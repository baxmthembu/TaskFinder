exports.up = function(knex) {
  // First, clear the data from tables that have foreign keys referencing the 'task' table.
  return knex('history').truncate()
    .then(() => knex('payment').truncate())
    // After clearing the data, proceed with dropping the foreign keys.
    .then(() => knex.schema.alterTable('history', table => table.dropForeign('task_id')))
    .then(() => knex.schema.alterTable('payment', table => table.dropForeign('task_id')))
    // Now it's safe to alter the 'task' table.
    .then(() => knex.schema.alterTable('task', table => {
      table.dropPrimary();
    }))
    .then(() => knex.schema.alterTable('task', table => {
      table.renameColumn('id', 'client_id');
    }))
    .then(() => knex.schema.alterTable('task', table => {
      table.increments('task_id').primary();
    }))
    // Finally, re-establish the foreign key relationships.
    .then(() => knex.schema.alterTable('history', table => {
      table.foreign('task_id').references('task_id').inTable('task');
    }))
    .then(() => knex.schema.alterTable('payment', table => {
      table.foreign('task_id').references('task_id').inTable('task');
    }));
};

exports.down = function(knex) {
  // Revert the changes in the opposite order.
  return knex.schema.alterTable('history', table => table.dropForeign('task_id'))
    .then(() => knex.schema.alterTable('payment', table => table.dropForeign('task_id')))
    .then(() => knex.schema.alterTable('task', table => {
      table.dropColumn('task_id');
    }))
    .then(() => knex.schema.alterTable('task', table => {
      table.renameColumn('client_id', 'id');
    }))
    .then(() => knex.schema.alterTable('task', table => {
      table.primary('id');
    }))
    .then(() => knex.schema.alterTable('history', table => {
      table.foreign('task_id').references('id').inTable('task');
    }))
    .then(() => knex.schema.alterTable('payment', table => {
      table.foreign('task_id').references('id').inTable('task');
    }));
};