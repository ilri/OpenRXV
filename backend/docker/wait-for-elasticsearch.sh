#!/usr/bin/env bash
#
# wait-for-elasticsearch.sh
#
# See: https://github.com/elastic/elasticsearch-py/issues/778

set -e

host="$1"
shift
cmd="$@"

until $(curl --output /dev/null --silent --head --fail "$host"); do
    printf '.'
    sleep 1
done

# Wait for Elasticsearch to start...
response=$(curl $host)

until [ "$response" = "200" ]; do
    response=$(curl --write-out %{http_code} --silent --output /dev/null "$host")
    >&2 echo "Elasticsearch is unavailable - sleeping"
    sleep 1
done

# Next, wait for Elasticsearch status to turn green or yellow
health="$(curl -fsSL "$host/_cat/health?h=status")"
health="$(echo "$health" | sed -r 's/^[[:space:]]+|[[:space:]]+$//g')" # trim whitespace (otherwise we'll have "green ")

until [[ "$health" =~ (green|yellow) ]]; do
    health="$(curl -fsSL "$host/_cat/health?h=status")"
    health="$(echo "$health" | sed -r 's/^[[:space:]]+|[[:space:]]+$//g')"
    >&2 echo "Elasticsearch is unavailable - sleeping"
    sleep 1
done

>&2 echo "Elasticsearch is up"
exec $cmd
