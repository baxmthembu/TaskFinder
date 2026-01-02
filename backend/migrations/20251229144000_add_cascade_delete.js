/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. history table
  await knex.schema.alterTable('history', function(table) {
    table.dropForeign('freelancer_id');
    table.foreign('freelancer_id').references('freelancers.id').onDelete('CASCADE');

    table.dropForeign('user_id');
    table.foreign('user_id').references('user_info.id').onDelete('CASCADE');

    table.dropForeign('task_id');
    table.foreign('task_id').references('task.task_id').onDelete('CASCADE');
  });

  // 2. payment table
  await knex.schema.alterTable('payment', function(table) {
    table.dropForeign('task_id');
    table.foreign('task_id').references('task.task_id').onDelete('CASCADE');

    table.dropForeign('user_id');
    table.foreign('user_id').references('user_info.id').onDelete('CASCADE');
  });

  // 3. task table
  await knex.schema.alterTable('task', function(table) {
    // client_id has no FK on prod, so we just add it.
    // We use a specific name to avoid collision if knex generates a different one, 
    // and to make it easier to drop later.
    table.foreign('client_id', 'task_client_id_foreign_cascade').references('user_info.id').onDelete('CASCADE');

    table.dropForeign('freelancer_id', 'task_freelancer_id_foreign');
    table.foreign('freelancer_id').references('freelancers.id').onDelete('CASCADE');
  });

  // 4. chat_sessions table
  await knex.schema.alterTable('chat_sessions', function(table) {
    table.dropForeign('client_id', 'chat_sessions_client_id_fkey');
    table.foreign('client_id').references('user_info.id').onDelete('CASCADE');

    table.dropForeign('freelancer_id', 'chat_sessions_freelancer_id_fkey');
    table.foreign('freelancer_id').references('freelancers.id').onDelete('CASCADE');
  });

  // 5. messages table
  await knex.schema.alterTable('messages', function(table) {
     table.dropForeign('chat_id', 'messages_chat_id_fkey');
     table.foreign('chat_id').references('chats.id').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revert changes - remove ON DELETE CASCADE

  // 1. history table
  await knex.schema.alterTable('history', function(table) {
    table.dropForeign('freelancer_id');
    table.foreign('freelancer_id').references('freelancers.id');

    table.dropForeign('user_id');
    table.foreign('user_id').references('user_info.id');

    table.dropForeign('task_id');
    table.foreign('task_id').references('task.task_id');
  });

  // 2. payment table
  await knex.schema.alterTable('payment', function(table) {
    table.dropForeign('task_id');
    table.foreign('task_id').references('task.task_id');

    table.dropForeign('user_id');
    table.foreign('user_id').references('user_info.id');
  });

  // 3. task table
  await knex.schema.alterTable('task', function(table) {
    table.dropForeign('client_id', 'task_client_id_foreign_cascade');
    // We don't restore the old missing constraint for client_id as it didn't exist.

    table.dropForeign('freelancer_id');
    table.foreign('freelancer_id').references('freelancers.id').withKeyName('task_freelancer_id_foreign');
  });

  // 4. chat_sessions table
  await knex.schema.alterTable('chat_sessions', function(table) {
    table.dropForeign('client_id');
    table.foreign('client_id').references('user_info.id').withKeyName('chat_sessions_client_id_fkey');

    table.dropForeign('freelancer_id');
    table.foreign('freelancer_id').references('freelancers.id').withKeyName('chat_sessions_freelancer_id_fkey');
  });

  // 5. messages table
  await knex.schema.alterTable('messages', function(table) {
    table.dropForeign('chat_id');
    table.foreign('chat_id').references('chats.id').withKeyName('messages_chat_id_fkey');
  });
};
