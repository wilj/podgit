import { log } from "@app/config";
import { Task } from "graphile-worker";

const task: Task = async (inPayload, { withPgClient }) => {
  log(`Running cleanup_workspaces`);
  withPgClient((pgClient) =>
    pgClient.query(
      `
      delete from app_public.workspaces
      where last_updated_ts < (current_timestamp - INTERVAL '2 minutes')
      `,
      []
    )
  );
};

module.exports = task;
