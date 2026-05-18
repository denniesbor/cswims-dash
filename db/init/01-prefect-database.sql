-- Role: Create the prefect database alongside cswim.
-- Author: Dennies Bor
-- Description:
--   Postgres init scripts in /docker-entrypoint-initdb.d run on first
--   startup of an empty data directory. Adds a prefect database owned
--   by the same cswim user so the Prefect server can use the same
--   postgres instance without cross-talking with our domain data.

CREATE DATABASE prefect OWNER cswim;