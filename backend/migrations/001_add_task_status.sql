-- Add a task status type
CREATE TYPE task_status AS ENUM ('pending', 'accepted', 'in-progress', 'finished', 'paid');

-- Add a status column to the task table
ALTER TABLE task ADD COLUMN status task_status DEFAULT 'pending';