FROM postgres:14 AS build

RUN apt-get update \
      && apt-get install -y --no-install-recommends \
      	postgresql-$PG_MAJOR-wal2json \
      && rm -rf /var/lib/apt/lists/*
      
FROM postgres:14

COPY --from=build /usr/lib/postgresql/$PG_MAJOR/lib/wal2json.so /usr/lib/postgresql/$PG_MAJOR/lib/
COPY postgres/postgresql.conf.sample /usr/share/postgresql/postgresql.conf.sample

ADD data /

